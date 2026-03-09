const express = require("express");
const app = express();
const port = 3000;

// Import layanan
const productService = require("./servis/produkServis");

// Gunakan layanan
app.use("/barang", productService);

// Endpoint utama
app.get("/", (req, res) => {
  res.json({ message: "Selamat Datang di Service-Based Architecture" });
});

// Jalankan server
app.listen(port, () => {
  console.log(`Service-Based sedang running http://localhost:${port}`);
});
