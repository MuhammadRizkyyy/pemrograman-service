const express = require("express");
const router = express.Router();
const pool = require("../db/connection");

// Ambil semua kategori
router.get("/", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM kategori ORDER BY id ASC");
    res.json({
      success: true,
      message: "Berhasil mengambil data kategori",
      data: rows,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message, data: null });
  }
});

// Ambil kategori berdasarkan ID
router.get("/:id", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM kategori WHERE id = ?", [
      req.params.id,
    ]);
    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Kategori tidak ditemukan",
        data: null,
      });
    }
    res.json({
      success: true,
      message: "Berhasil mengambil kategori",
      data: rows[0],
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message, data: null });
  }
});

// Tambah kategori baru
router.post("/", async (req, res) => {
  const { nama_kategori, deskripsi } = req.body;

  // Validasi input
  if (!nama_kategori || nama_kategori.trim() === "") {
    return res.status(400).json({
      success: false,
      message: "Field nama_kategori wajib diisi",
      data: null,
    });
  }

  try {
    const [result] = await pool.query(
      "INSERT INTO kategori (nama_kategori, deskripsi) VALUES (?, ?)",
      [nama_kategori.trim(), deskripsi || null],
    );
    const [newRow] = await pool.query("SELECT * FROM kategori WHERE id = ?", [
      result.insertId,
    ]);
    res.status(201).json({
      success: true,
      message: "Kategori berhasil ditambahkan",
      data: newRow[0],
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message, data: null });
  }
});

// Update kategori
router.put("/:id", async (req, res) => {
  const { nama_kategori, deskripsi } = req.body;

  if (!nama_kategori || nama_kategori.trim() === "") {
    return res.status(400).json({
      success: false,
      message: "Field nama_kategori wajib diisi",
      data: null,
    });
  }

  try {
    const [check] = await pool.query("SELECT id FROM kategori WHERE id = ?", [
      req.params.id,
    ]);
    if (check.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Kategori tidak ditemukan",
        data: null,
      });
    }

    await pool.query(
      "UPDATE kategori SET nama_kategori = ?, deskripsi = ? WHERE id = ?",
      [nama_kategori.trim(), deskripsi || null, req.params.id],
    );
    const [updated] = await pool.query("SELECT * FROM kategori WHERE id = ?", [
      req.params.id,
    ]);
    res.json({
      success: true,
      message: "Kategori berhasil diupdate",
      data: updated[0],
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message, data: null });
  }
});

// Hapus kategori (validasi: cek produk terkait)
router.delete("/:id", async (req, res) => {
  try {
    const [check] = await pool.query("SELECT id FROM kategori WHERE id = ?", [
      req.params.id,
    ]);
    if (check.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Kategori tidak ditemukan",
        data: null,
      });
    }

    // Validasi: tidak boleh hapus jika masih ada produk dalam kategori ini
    const [produkTerkait] = await pool.query(
      "SELECT COUNT(*) AS total FROM produk WHERE id_kategori = ?",
      [req.params.id],
    );
    if (produkTerkait[0].total > 0) {
      return res.status(400).json({
        success: false,
        message: `Kategori tidak dapat dihapus karena masih memiliki ${produkTerkait[0].total} produk terkait`,
        data: null,
      });
    }

    await pool.query("DELETE FROM kategori WHERE id = ?", [req.params.id]);
    res.json({
      success: true,
      message: "Kategori berhasil dihapus",
      data: null,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message, data: null });
  }
});

module.exports = router;
