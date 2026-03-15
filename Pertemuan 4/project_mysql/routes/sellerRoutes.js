const express = require("express");
const router = express.Router();
const pool = require("../db/connection");

// Ambil semua seller
router.get("/", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM seller ORDER BY id ASC");
    res.json({
      success: true,
      message: "Berhasil mengambil data seller",
      data: rows,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message, data: null });
  }
});

// Ambil seller berdasarkan ID
router.get("/:id", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM seller WHERE id = ?", [
      req.params.id,
    ]);
    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Seller tidak ditemukan",
        data: null,
      });
    }
    res.json({
      success: true,
      message: "Berhasil mengambil seller",
      data: rows[0],
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message, data: null });
  }
});

// Ambil semua produk milik seller tertentu
router.get("/:id/produk", async (req, res) => {
  try {
    const [sellerCheck] = await pool.query(
      "SELECT id, nama_toko FROM seller WHERE id = ?",
      [req.params.id],
    );
    if (sellerCheck.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Seller tidak ditemukan",
        data: null,
      });
    }

    const [rows] = await pool.query(
      `SELECT p.*, k.nama_kategori, s.nama_toko
       FROM produk p
       JOIN kategori k ON p.id_kategori = k.id
       JOIN seller s ON p.id_seller = s.id
       WHERE p.id_seller = ?
       ORDER BY p.id ASC`,
      [req.params.id],
    );

    res.json({
      success: true,
      message: `Produk milik seller '${sellerCheck[0].nama_toko}'`,
      data: rows,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message, data: null });
  }
});

// Daftarkan seller baru
router.post("/", async (req, res) => {
  const { nama_toko, email, no_hp, alamat } = req.body;

  if (!nama_toko || nama_toko.trim() === "") {
    return res.status(400).json({
      success: false,
      message: "Field nama_toko wajib diisi",
      data: null,
    });
  }
  if (!email || email.trim() === "") {
    return res
      .status(400)
      .json({ success: false, message: "Field email wajib diisi", data: null });
  }

  try {
    const [result] = await pool.query(
      "INSERT INTO seller (nama_toko, email, no_hp, alamat) VALUES (?, ?, ?, ?)",
      [nama_toko.trim(), email.trim(), no_hp || null, alamat || null],
    );
    const [newRow] = await pool.query("SELECT * FROM seller WHERE id = ?", [
      result.insertId,
    ]);
    res.status(201).json({
      success: true,
      message: "Seller berhasil didaftarkan",
      data: newRow[0],
    });
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") {
      return res.status(400).json({
        success: false,
        message: "Email seller sudah terdaftar",
        data: null,
      });
    }
    res.status(500).json({ success: false, message: err.message, data: null });
  }
});

// Update data seller
router.put("/:id", async (req, res) => {
  const { nama_toko, email, no_hp, alamat } = req.body;

  if (!nama_toko || nama_toko.trim() === "") {
    return res.status(400).json({
      success: false,
      message: "Field nama_toko wajib diisi",
      data: null,
    });
  }
  if (!email || email.trim() === "") {
    return res
      .status(400)
      .json({ success: false, message: "Field email wajib diisi", data: null });
  }

  try {
    const [check] = await pool.query("SELECT id FROM seller WHERE id = ?", [
      req.params.id,
    ]);
    if (check.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Seller tidak ditemukan",
        data: null,
      });
    }

    await pool.query(
      "UPDATE seller SET nama_toko = ?, email = ?, no_hp = ?, alamat = ? WHERE id = ?",
      [
        nama_toko.trim(),
        email.trim(),
        no_hp || null,
        alamat || null,
        req.params.id,
      ],
    );
    const [updated] = await pool.query("SELECT * FROM seller WHERE id = ?", [
      req.params.id,
    ]);
    res.json({
      success: true,
      message: "Data seller berhasil diupdate",
      data: updated[0],
    });
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") {
      return res.status(400).json({
        success: false,
        message: "Email seller sudah terdaftar",
        data: null,
      });
    }
    res.status(500).json({ success: false, message: err.message, data: null });
  }
});

// Hapus seller
router.delete("/:id", async (req, res) => {
  try {
    const [check] = await pool.query("SELECT id FROM seller WHERE id = ?", [
      req.params.id,
    ]);
    if (check.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Seller tidak ditemukan",
        data: null,
      });
    }
    await pool.query("DELETE FROM seller WHERE id = ?", [req.params.id]);
    res.json({ success: true, message: "Seller berhasil dihapus", data: null });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message, data: null });
  }
});

module.exports = router;
