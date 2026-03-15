const express = require("express");
const router = express.Router();
const pool = require("../db/connection");

const BASE_QUERY = `
  SELECT p.*, k.nama_kategori, s.nama_toko
  FROM produk p
  JOIN kategori k ON p.id_kategori = k.id
  JOIN seller s ON p.id_seller = s.id
`;

// Ambil semua produk (dengan filter & search)
router.get("/", async (req, res) => {
  try {
    const { kategori, search } = req.query;

    let query = BASE_QUERY;
    const params = [];

    if (kategori) {
      query += " WHERE p.id_kategori = ?";
      params.push(kategori);
    } else if (search) {
      query += " WHERE p.nama LIKE ?";
      params.push(`%${search}%`);
    }

    query += " ORDER BY p.id ASC";

    const [rows] = await pool.query(query, params);
    res.json({
      success: true,
      message: "Berhasil mengambil data produk",
      data: rows,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message, data: null });
  }
});

// Ambil detail produk
router.get("/:id", async (req, res) => {
  try {
    const [rows] = await pool.query(BASE_QUERY + " WHERE p.id = ?", [
      req.params.id,
    ]);
    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Produk tidak ditemukan",
        data: null,
      });
    }
    res.json({
      success: true,
      message: "Berhasil mengambil produk",
      data: rows[0],
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message, data: null });
  }
});

// Tambah produk baru
router.post("/", async (req, res) => {
  const { nama, harga, stok, id_kategori, id_seller } = req.body;

  // Validasi field wajib
  if (!nama || nama.trim() === "") {
    return res
      .status(400)
      .json({ success: false, message: "Field nama wajib diisi", data: null });
  }
  if (harga === undefined || harga === null || harga === "") {
    return res
      .status(400)
      .json({ success: false, message: "Field harga wajib diisi", data: null });
  }
  if (!id_kategori) {
    return res.status(400).json({
      success: false,
      message: "Field id_kategori wajib diisi",
      data: null,
    });
  }
  if (!id_seller) {
    return res.status(400).json({
      success: false,
      message: "Field id_seller wajib diisi",
      data: null,
    });
  }

  try {
    // Validasi FK kategori dan seller ada
    const [kat] = await pool.query("SELECT id FROM kategori WHERE id = ?", [
      id_kategori,
    ]);
    if (kat.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Kategori dengan id tersebut tidak ditemukan",
        data: null,
      });
    }
    const [sel] = await pool.query("SELECT id FROM seller WHERE id = ?", [
      id_seller,
    ]);
    if (sel.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Seller dengan id tersebut tidak ditemukan",
        data: null,
      });
    }

    const [result] = await pool.query(
      "INSERT INTO produk (nama, harga, stok, id_kategori, id_seller) VALUES (?, ?, ?, ?, ?)",
      [nama.trim(), harga, stok || 0, id_kategori, id_seller],
    );
    const [newRow] = await pool.query(BASE_QUERY + " WHERE p.id = ?", [
      result.insertId,
    ]);
    res.status(201).json({
      success: true,
      message: "Produk berhasil ditambahkan",
      data: newRow[0],
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message, data: null });
  }
});

// Update produk (termasuk stok)
router.put("/:id", async (req, res) => {
  const { nama, harga, stok, id_kategori, id_seller } = req.body;

  if (!nama || nama.trim() === "") {
    return res
      .status(400)
      .json({ success: false, message: "Field nama wajib diisi", data: null });
  }
  if (harga === undefined || harga === null || harga === "") {
    return res
      .status(400)
      .json({ success: false, message: "Field harga wajib diisi", data: null });
  }
  if (!id_kategori) {
    return res.status(400).json({
      success: false,
      message: "Field id_kategori wajib diisi",
      data: null,
    });
  }
  if (!id_seller) {
    return res.status(400).json({
      success: false,
      message: "Field id_seller wajib diisi",
      data: null,
    });
  }

  try {
    const [check] = await pool.query("SELECT id FROM produk WHERE id = ?", [
      req.params.id,
    ]);
    if (check.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Produk tidak ditemukan",
        data: null,
      });
    }

    await pool.query(
      "UPDATE produk SET nama = ?, harga = ?, stok = ?, id_kategori = ?, id_seller = ? WHERE id = ?",
      [nama.trim(), harga, stok ?? 0, id_kategori, id_seller, req.params.id],
    );
    const [updated] = await pool.query(BASE_QUERY + " WHERE p.id = ?", [
      req.params.id,
    ]);
    res.json({
      success: true,
      message: "Produk berhasil diupdate",
      data: updated[0],
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message, data: null });
  }
});

// Hapus produk
router.delete("/:id", async (req, res) => {
  try {
    const [check] = await pool.query("SELECT id FROM produk WHERE id = ?", [
      req.params.id,
    ]);
    if (check.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Produk tidak ditemukan",
        data: null,
      });
    }
    await pool.query("DELETE FROM produk WHERE id = ?", [req.params.id]);
    res.json({ success: true, message: "Produk berhasil dihapus", data: null });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message, data: null });
  }
});

module.exports = router;
