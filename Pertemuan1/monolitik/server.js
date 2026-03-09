const express = require("express");
const app = express();

app.use(express.json());

// Memory Database
let users = [
  { id: 1, name: "Budi Acikiwir", email: "budi@acikiwir.com", role: "admin" },
  { id: 2, name: "Andi Ambatunat", email: "andi@ambatunat.com", role: "user" },
];

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
];

let orders = [
  {
    id: 1,
    userId: 1,
    productId: 1,
    quantity: 1,
    status: "completed",
    total: 8500000,
  },
];

let nextUserId = 3;
let nextProductId = 4;
let nextOrderId = 2;

// Middleware
app.use((req, res, next) => {
  const time = new Date();
  console.log(`[MONOLITHIC] ${time} - ${req.method} ${req.url}`);
  next();
});

// User Routes
app.get("/api/users", (req, res) => {
  res.json({ success: true, data: users, total: users.length });
});

app.get("/api/users/:id", (req, res) => {
  const user = users.find((u) => u.id === parseInt(req.params.id));
  if (!user)
    return res
      .status(404)
      .json({ success: false, message: "User tidak ditemukan" });

  res.json({ success: true, data: user });
});

app.post("/api/users", (req, res) => {
  const { name, email, role = "user" } = req.body;
  if (!name || !email)
    return res
      .status(400)
      .json({ success: false, message: "Name dan email wajib diisi" });
  if (users.find((u) => u.email === email))
    return res
      .status(409)
      .json({ success: false, message: "Email sudah terdaftar" });

  const newUser = { id: nextUserId++, name, email, role };
  users.push(newUser);
  res.status(201).json({
    success: true,
    data: newUser,
    message: "User berhasil ditambahkan",
  });
});

app.put("/api/users/:id", (req, res) => {
  const idx = users.findIndex((u) => u.id === parseInt(req.params.id));
  if (idx === -1)
    return res
      .status(404)
      .json({ success: false, message: "User tidak ditemukan" });
  users[idx] = { ...users[idx], ...req.body, id: users[idx].id };
  res.json({
    success: true,
    data: users[idx],
    message: "User berhasil diperbarui",
  });
});

app.delete("/api/users/:id", (req, res) => {
  const idx = users.findIndex((u) => u.id === parseInt(req.params.id));
  if (idx === -1)
    return res
      .status(404)
      .json({ success: false, message: "User tidak ditemukan" });
  users.splice(idx, 1);
  res.json({ success: true, message: "User berhasil dihapus" });
});

// PRODUCT ROUTES
app.get("/api/products", (req, res) => {
  const { category, minPrice, maxPrice } = req.query;
  let result = [...products];
  if (category) result = result.filter((p) => p.category === category);
  if (minPrice) result = result.filter((p) => p.price >= parseInt(minPrice));
  if (maxPrice) result = result.filter((p) => p.price <= parseInt(maxPrice));
  res.json({ success: true, data: result, total: result.length });
});

app.get("/api/products/:id", (req, res) => {
  const product = products.find((p) => p.id === parseInt(req.params.id));
  if (!product)
    return res
      .status(404)
      .json({ success: false, message: "Produk tidak ditemukan" });
  res.json({ success: true, data: product });
});

app.post("/api/products", (req, res) => {
  const { name, price, stock, category } = req.body;
  if (!name || !price)
    return res
      .status(400)
      .json({ success: false, message: "Name dan price wajib diisi" });
  const newProduct = {
    id: nextProductId++,
    name,
    price,
    stock: stock || 0,
    category: category || "umum",
  };
  products.push(newProduct);
  res.status(201).json({
    success: true,
    data: newProduct,
    message: "Produk berhasil dibuat",
  });
});

app.put("/api/products/:id", (req, res) => {
  const idx = products.findIndex((p) => p.id === parseInt(req.params.id));
  if (idx === -1)
    return res
      .status(404)
      .json({ success: false, message: "Produk tidak ditemukan" });
  products[idx] = { ...products[idx], ...req.body, id: products[idx].id };
  res.json({
    success: true,
    data: products[idx],
    message: "Produk berhasil diperbarui",
  });
});

app.delete("/api/products/:id", (req, res) => {
  const idx = products.findIndex((p) => p.id === parseInt(req.params.id));
  if (idx === -1)
    return res
      .status(404)
      .json({ success: false, message: "Produk tidak ditemukan" });
  products.splice(idx, 1);
  res.json({ success: true, message: "Produk berhasil dihapus" });
});

// ORDER ROUTES
app.get("/api/orders", (req, res) => {
  const enriched = orders.map((o) => ({
    ...o,
    user: users.find((u) => u.id === o.userId),
    product: products.find((p) => p.id === o.productId),
  }));
  res.json({ success: true, data: enriched, total: enriched.length });
});

app.get("/api/orders/:id", (req, res) => {
  const order = orders.find((o) => o.id === parseInt(req.params.id));
  if (!order)
    return res
      .status(404)
      .json({ success: false, message: "Order tidak ditemukan" });
  res.json({
    success: true,
    data: {
      ...order,
      user: users.find((u) => u.id === order.userId),
      product: products.find((p) => p.id === order.productId),
    },
  });
});

app.post("/api/orders", (req, res) => {
  const { userId, productId, quantity } = req.body;
  if (!userId || !productId || !quantity) {
    return res.status(400).json({
      success: false,
      message: "userId, productId, dan quantity wajib diisi",
    });
  }

  const user = users.find((u) => u.id === parseInt(userId));
  if (!user)
    return res
      .status(404)
      .json({ success: false, message: "User tidak ditemukan" });

  const product = products.find((p) => p.id === parseInt(productId));
  if (!product)
    return res
      .status(404)
      .json({ success: false, message: "Produk tidak ditemukan" });

  if (product.stock < quantity) {
    return res.status(400).json({
      success: false,
      message: `Stok tidak cukup. Tersedia: ${product.stock}`,
    });
  }

  // Kurangi stok
  product.stock -= quantity;

  const newOrder = {
    id: nextOrderId++,
    userId: parseInt(userId),
    productId: parseInt(productId),
    quantity,
    status: "pending",
    total: product.price * quantity,
    createdAt: new Date().toISOString(),
  };
  orders.push(newOrder);
  res.status(201).json({
    success: true,
    data: { ...newOrder, user, product },
    message: "Order berhasil dibuat",
  });
});

app.patch("/api/orders/:id/status", (req, res) => {
  const order = orders.find((o) => o.id === parseInt(req.params.id));
  if (!order)
    return res
      .status(404)
      .json({ success: false, message: "Order tidak ditemukan" });
  const validStatus = ["pending", "processing", "completed", "cancelled"];
  if (!validStatus.includes(req.body.status)) {
    return res.status(400).json({
      success: false,
      message: `Status harus salah satu: ${validStatus.join(", ")}`,
    });
  }
  order.status = req.body.status;
  res.json({ success: true, data: order, message: "Status order diperbarui" });
});

app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    architecture: "Monolitik",
    timestamp: new Date().toISOString(),
  });
});

const port = 3000;
app.listen(port, () => {
  console.log(`Server berjalan di http://localhost:${port}`);
});
