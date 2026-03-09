const express = require("express");
const app = express();
const port = 3000;

// Simulasi database dalam memori
const barang = [
  { id: 1, nama_barang: "Laptop", harga_barang: 10000 },
  { id: 2, nama_barang: "Mouse", harga_barang: 500 },
  { id: 3, nama_barang: "Keyboard", harga_barang: 800 },
];

// Endpoint utama
app.get("/", (req, res) => {
  res.json({ message: "Selamat datang di Aplikasi Monolitik" });
});

// Endpoint daftar produk
app.get("/barang", (req, res) => {
  res.json({ barang });
});

// Endpoint detail produk
app.get("/barang/:id", (req, res) => {
  const barangs = barang.find((p) => p.id == req.params.id);

  if (!barangs) return res.status(404).json({ message: "Produk tidak Ada" });
  res.json(barangs);
});

// Jalankan server
app.listen(port, () => {
  console.log(`Menjalankan Aplikasi Monolitik http://localhost:${port}`);
});
