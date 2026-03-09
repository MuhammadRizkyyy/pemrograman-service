const express = require("express");
const router = express.Router();

// Simulasi database dalam memori
const barang = [
  { id: 1, nama_barang: "Laptop", harga_barang: 10000 },
  { id: 2, nama_barang: "Mouse", harga_barang: 500 },
  { id: 3, nama_barang: "Keyboard", harga_barang: 800 },
];

// Endpoint daftar produk
router.get("/", (req, res) => {
  res.json({ barang });
});

// Endpoint detail produk
router.get("/:id", (req, res) => {
  const barangs = barang.find((p) => p.id == req.params.id);
  if (!barangs)
    return res.status(404).json({ message: "Barang tidak ditemukan" });
  res.json(barangs);
});

module.exports = router;
