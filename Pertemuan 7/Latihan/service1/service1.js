const express = require("express");
const app = express();
const port = 3001;

// Middleware untuk parsing JSON
app.use(express.json());

// Endpoint yang sudah ada
app.get("/api/resource", (req, res) => {
  res.json({ message: "Response dari Service 1" });
});

// Endpoint baru 1: GET - Daftar Users
app.get("/api/users", (req, res) => {
  const users = [
    { id: 1, name: "Budi Santoso", email: "budi@example.com", age: 25 },
    { id: 2, name: "Siti Rahayu", email: "siti@example.com", age: 30 },
    { id: 3, name: "Ahmad Hidayat", email: "ahmad@example.com", age: 28 },
  ];
  res.json({
    success: true,
    data: users,
    total: users.length,
  });
});

// Endpoint baru 2: POST - Tambah Product
app.post("/api/products", (req, res) => {
  const { name, price, stock } = req.body;

  // Data dummy yang disimpan
  const newProduct = {
    id: Math.floor(Math.random() * 1000),
    name: name || "Product Default",
    price: price || 0,
    stock: stock || 0,
    createdAt: new Date().toISOString(),
  };

  res.status(201).json({
    success: true,
    message: "Product berhasil ditambahkan",
    data: newProduct,
  });
});

// Endpoint baru 3: GET - Detail User by ID
app.get("/api/users/:id", (req, res) => {
  const userId = parseInt(req.params.id);
  const users = [
    {
      id: 1,
      name: "Budi Santoso",
      email: "budi@example.com",
      age: 25,
      city: "Jakarta",
    },
    {
      id: 2,
      name: "Siti Rahayu",
      email: "siti@example.com",
      age: 30,
      city: "Bandung",
    },
    {
      id: 3,
      name: "Ahmad Hidayat",
      email: "ahmad@example.com",
      age: 28,
      city: "Surabaya",
    },
  ];

  const user = users.find((u) => u.id === userId);

  if (user) {
    res.json({ success: true, data: user });
  } else {
    res.status(404).json({ success: false, message: "User tidak ditemukan" });
  }
});

app.listen(port, () => {
  console.log(`Service 1 sedang berjalan ${port}`);
});
