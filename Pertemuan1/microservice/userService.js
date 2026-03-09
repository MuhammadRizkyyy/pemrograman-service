const express = require("express");
const app = express();

app.use(express.json());

let users = [
  {
    id: 1,
    name: "Budi Santoso",
    email: "budi@example.com",
    role: "admin",
    createdAt: "2024-01-01",
  },
  {
    id: 2,
    name: "Adinda Rahayu",
    email: "adinda@example.com",
    role: "user",
    createdAt: "2024-01-02",
  },
];
let nextId = 3;

// Logger
app.use((req, res, next) => {
  console.log(
    `[USER-SERVICE] ${new Date().toISOString()} ${req.method} ${req.url}`,
  );
  next();
});

// GET all user
app.get("/api/users", (req, res) => {
  const { role } = req.query;
  let result = role ? users.filter((u) => u.role === role) : users;
  res.json({
    success: true,
    data: result,
    total: result.lenth,
    service: "user-service",
  });
});

// GET user by ID
app.get("/api/users/:id", (req, res) => {
  const user = users.find((u) => u.id === parseInt(req.params.id));
  if (!user)
    return res
      .status(404)
      .json({ success: false, message: "User tidak ditemukan" });
  res.json({ success: true, data: user });
});

// POST buat user baru
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

  const user = {
    id: nextId++,
    name,
    email,
    role,
    createdAt: new Date().toISOString(),
  };
  users.push(user);
  res
    .status(201)
    .json({ success: true, data: user, message: "User berhasil dibuat" });
});

// PUT update user
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

// DELETE user
app.delete("/api/users/:id", (req, res) => {
  const idx = users.findIndex((u) => u.id === parseInt(req.params.id));
  if (idx === -1)
    return res
      .status(404)
      .json({ success: false, message: "User tidak ditemukan" });
  users.splice(idx, 1);
  res.json({ success: true, message: "User berhasil dihapus" });
});

// Helath check
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    service: "user-service",
    port: 3001,
    users: users.length,
  });
});

app.listen(3001, () => {
  console.log("User Service berjalan di http://localhost:3001");
});
