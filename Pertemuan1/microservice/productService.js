const express = require("express");
const app = express();
app.use(express.json());

let products = [
  {
    id: 1,
    name: "Laptop ASUS",
    price: 8500000,
    stock: 10,
    category: "elektronik",
  },
  {
    id: 2,
    name: "Mouse Logitech",
    price: 250000,
    stock: 50,
    category: "elektronik",
  },
  {
    id: 3,
    name: "Keyboard Mechanical",
    price: 450000,
    stock: 30,
    category: "elektronik",
  },
  { id: 4, name: "Baju Batik", price: 150000, stock: 100, category: "fashion" },
];
let nextId = 5;

app.use((req, res, next) => {
  console.log(
    `[PRODUCT-SERVICE] ${new Date().toISOString()} ${req.method} ${req.url}`,
  );
  next();
});

// GET semua produk
app.get("/api/products", (req, res) => {
  const { category, minPrice, maxPrice, search } = req.query;
  let result = [...products];
  if (category) result = result.filter((p) => p.category === category);
  if (minPrice) result = result.filter((p) => p.price >= parseInt(minPrice));
  if (maxPrice) result = result.filter((p) => p.price <= parseInt(maxPrice));
  if (search)
    result = result.filter((p) =>
      p.name.toLowerCase().includes(search.toLowerCase()),
    );
  res.json({
    success: true,
    data: result,
    total: result.length,
    service: "product-service",
  });
});

// GET produk by ID
app.get("/api/products/:id", (req, res) => {
  const product = products.find((p) => p.id === parseInt(req.params.id));
  if (!product)
    return res
      .status(404)
      .json({ success: false, message: "Produk tidak ditemukan" });
  res.json({ success: true, data: product });
});

// POST buat produk baru
app.post("/api/products", (req, res) => {
  const { name, price, stock = 0, category = "umum" } = req.body;
  if (!name || !price)
    return res
      .status(400)
      .json({ success: false, message: "Name dan price wajib diisi" });
  const product = {
    id: nextId++,
    name,
    price,
    stock,
    category,
    createdAt: new Date().toISOString(),
  };
  products.push(product);
  res
    .status(201)
    .json({ success: true, data: product, message: "Produk berhasil dibuat" });
});

// PUT update produk
app.put("/api/products/:id", (req, res) => {
  const idx = products.findIndex((p) => p.id === parseInt(req.params.id));
  if (idx === -1)
    return res
      .status(404)
      .json({ success: false, message: "Produk tidak ditemukan" });
  products[idx] = { ...products[idx], ...req.body, id: products[idx].id };
  res.json({ success: true, data: products[idx] });
});

// PATCH update stok
app.patch("/api/products/:id/stock", (req, res) => {
  const product = products.find((p) => p.id === parseInt(req.params.id));
  if (!product)
    return res
      .status(404)
      .json({ success: false, message: "Produk tidak ditemukan" });

  const { quantity, action } = req.body;
  if (action === "decrease") {
    if (product.stock < quantity)
      return res.status(400).json({
        success: false,
        message: `Stok tidak cukup. Tersedia: ${product.stock}`,
      });
    product.stock -= quantity;
  } else {
    product.stock += quantity;
  }
  res.json({
    success: true,
    data: product,
    message: "Stok berhasil diperbarui",
  });
});

// DELETE produk
app.delete("/api/products/:id", (req, res) => {
  const idx = products.findIndex((p) => p.id === parseInt(req.params.id));
  if (idx === -1)
    return res
      .status(404)
      .json({ success: false, message: "Produk tidak ditemukan" });
  products.splice(idx, 1);
  res.json({ success: true, message: "Produk berhasil dihapus" });
});

// Health check
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    service: "product-service",
    port: 3002,
    products: products.length,
  });
});

app.listen(3002, () => {
  console.log("Product Service berjalan di http://localhost:3002");
});
