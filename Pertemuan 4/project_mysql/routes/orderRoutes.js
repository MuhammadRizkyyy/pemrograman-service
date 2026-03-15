const express = require("express");
const router = express.Router();
const pool = require("../db/connection");

const STATUS_FLOW = ["pending", "proses", "selesai", "batal"];

// Ambil semua order (dengan detail produk)
router.get("/", async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT o.*, p.nama AS nama_produk, p.harga AS harga_satuan,
             k.nama_kategori, s.nama_toko
      FROM \`order\` o
      JOIN produk p ON o.id_produk = p.id
      JOIN kategori k ON p.id_kategori = k.id
      JOIN seller s ON p.id_seller = s.id
      ORDER BY o.id ASC
    `);
    res.json({
      success: true,
      message: "Berhasil mengambil data order",
      data: rows,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message, data: null });
  }
});

// Ambil detail order
router.get("/:id", async (req, res) => {
  try {
    const [rows] = await pool.query(
      `
      SELECT o.*, p.nama AS nama_produk, p.harga AS harga_satuan,
             k.nama_kategori, s.nama_toko
      FROM \`order\` o
      JOIN produk p ON o.id_produk = p.id
      JOIN kategori k ON p.id_kategori = k.id
      JOIN seller s ON p.id_seller = s.id
      WHERE o.id = ?
    `,
      [req.params.id],
    );
    if (rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Order tidak ditemukan", data: null });
    }
    res.json({
      success: true,
      message: "Berhasil mengambil order",
      data: rows[0],
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message, data: null });
  }
});

// Buat order baru (dengan MySQL Transaction)
router.post("/", async (req, res) => {
  const { id_produk, jumlah } = req.body;

  // Validasi input
  if (!id_produk) {
    return res.status(400).json({
      success: false,
      message: "Field id_produk wajib diisi",
      data: null,
    });
  }
  if (!jumlah || jumlah <= 0) {
    return res.status(400).json({
      success: false,
      message: "Field jumlah wajib diisi dan harus lebih dari 0",
      data: null,
    });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [produkRows] = await conn.query(
      "SELECT * FROM produk WHERE id = ? FOR UPDATE",
      [id_produk],
    );
    if (produkRows.length === 0) {
      await conn.rollback();
      conn.release();
      return res.status(404).json({
        success: false,
        message: "Produk tidak ditemukan",
        data: null,
      });
    }

    const produk = produkRows[0];

    // Cek stok mencukupi
    if (produk.stok < jumlah) {
      await conn.rollback();
      conn.release();
      return res.status(400).json({
        success: false,
        message: `Stok tidak mencukupi. Stok tersedia: ${produk.stok}`,
        data: null,
      });
    }

    // Hitung total harga
    const total_harga = produk.harga * jumlah;

    // Kurangi stok
    await conn.query("UPDATE produk SET stok = stok - ? WHERE id = ?", [
      jumlah,
      id_produk,
    ]);

    // Insert order
    const [result] = await conn.query(
      "INSERT INTO `order` (id_produk, jumlah, total_harga, status) VALUES (?, ?, ?, ?)",
      [id_produk, jumlah, total_harga, "pending"],
    );

    await conn.commit();
    conn.release();

    // Ambil data order yang baru dibuat
    const [newOrder] = await pool.query(
      `
      SELECT o.*, p.nama AS nama_produk, p.harga AS harga_satuan,
             k.nama_kategori, s.nama_toko
      FROM \`order\` o
      JOIN produk p ON o.id_produk = p.id
      JOIN kategori k ON p.id_kategori = k.id
      JOIN seller s ON p.id_seller = s.id
      WHERE o.id = ?
    `,
      [result.insertId],
    );

    res.status(201).json({
      success: true,
      message: `Order berhasil dibuat. Total harga: Rp ${total_harga.toLocaleString("id-ID")}`,
      data: newOrder[0],
    });
  } catch (err) {
    await conn.rollback();
    conn.release();
    res.status(500).json({ success: false, message: err.message, data: null });
  }
});

// Update status order
router.put("/:id/status", async (req, res) => {
  const { status } = req.body;

  if (!status) {
    return res.status(400).json({
      success: false,
      message: "Field status wajib diisi",
      data: null,
    });
  }
  if (!STATUS_FLOW.includes(status)) {
    return res.status(400).json({
      success: false,
      message: `Status tidak valid. Pilihan: ${STATUS_FLOW.join(", ")}`,
      data: null,
    });
  }

  try {
    const [rows] = await pool.query("SELECT * FROM `order` WHERE id = ?", [
      req.params.id,
    ]);
    if (rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Order tidak ditemukan", data: null });
    }

    const order = rows[0];

    // Validasi transisi status (tidak boleh mundur ke status sebelumnya)
    const currentIdx = STATUS_FLOW.indexOf(order.status);
    const newIdx = STATUS_FLOW.indexOf(status);
    if (newIdx <= currentIdx && status !== "batal") {
      return res.status(400).json({
        success: false,
        message: `Tidak dapat mengubah status dari '${order.status}' ke '${status}'`,
        data: null,
      });
    }
    if (order.status === "selesai" || order.status === "batal") {
      return res.status(400).json({
        success: false,
        message: `Order dengan status '${order.status}' tidak dapat diubah lagi`,
        data: null,
      });
    }

    await pool.query("UPDATE `order` SET status = ? WHERE id = ?", [
      status,
      req.params.id,
    ]);
    const [updated] = await pool.query("SELECT * FROM `order` WHERE id = ?", [
      req.params.id,
    ]);
    res.json({
      success: true,
      message: `Status order berhasil diubah menjadi '${status}'`,
      data: updated[0],
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message, data: null });
  }
});

// Hapus/batalkan order (kembalikan stok jika pending)
router.delete("/:id", async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const [rows] = await conn.query("SELECT * FROM `order` WHERE id = ?", [
      req.params.id,
    ]);
    if (rows.length === 0) {
      conn.release();
      return res
        .status(404)
        .json({ success: false, message: "Order tidak ditemukan", data: null });
    }

    const order = rows[0];

    await conn.beginTransaction();

    // Kembalikan stok hanya jika order masih berstatus 'pending'
    if (order.status === "pending") {
      await conn.query("UPDATE produk SET stok = stok + ? WHERE id = ?", [
        order.jumlah,
        order.id_produk,
      ]);
    }

    await conn.query("DELETE FROM `order` WHERE id = ?", [req.params.id]);

    await conn.commit();
    conn.release();

    const msg =
      order.status === "pending"
        ? `Order berhasil dihapus dan stok produk dikembalikan sebanyak ${order.jumlah} unit`
        : "Order berhasil dihapus (stok tidak dikembalikan karena status bukan pending)";

    res.json({ success: true, message: msg, data: null });
  } catch (err) {
    await conn.rollback();
    conn.release();
    res.status(500).json({ success: false, message: err.message, data: null });
  }
});

module.exports = router;
