const express = require("express");
const app = express();
const port = 3002;

// Middleware untuk parsing JSON
app.use(express.json());

// Endpoint yang sudah ada
app.get("/api/resource", (req, res) => {
  res.json({ message: "Response from Service 2" });
});

// Endpoint baru 1: GET - Daftar Books
app.get("/api/books", (req, res) => {
  const books = [
    {
      id: 1,
      title: "Laskar Pelangi",
      author: "Andrea Hirata",
      year: 2005,
      price: 85000,
    },
    {
      id: 2,
      title: "Bumi Manusia",
      author: "Pramoedya Ananta Toer",
      year: 1980,
      price: 95000,
    },
    {
      id: 3,
      title: "Negeri 5 Menara",
      author: "Ahmad Fuadi",
      year: 2009,
      price: 78000,
    },
    {
      id: 4,
      title: "Perahu Kertas",
      author: "Dee Lestari",
      year: 2009,
      price: 82000,
    },
  ];

  res.json({
    success: true,
    data: books,
    total: books.length,
  });
});

// Endpoint baru 2: PUT - Update Order
app.put("/api/orders/:id", (req, res) => {
  const orderId = parseInt(req.params.id);
  const { status, totalAmount, customerName } = req.body;

  // Data dummy order yang diupdate
  const updatedOrder = {
    id: orderId,
    status: status || "pending",
    totalAmount: totalAmount || 0,
    customerName: customerName || "Guest",
    updatedAt: new Date().toISOString(),
  };

  res.json({
    success: true,
    message: `Order #${orderId} berhasil diupdate`,
    data: updatedOrder,
  });
});

// Endpoint baru 3: DELETE - Hapus Book
app.delete("/api/books/:id", (req, res) => {
  const bookId = parseInt(req.params.id);

  res.json({
    success: true,
    message: `Buku dengan ID ${bookId} berhasil dihapus`,
    deletedAt: new Date().toISOString(),
  });
});

// Endpoint baru 4: POST - Tambah Order
app.post("/api/orders", (req, res) => {
  const { customerName, items, totalAmount } = req.body;

  const newOrder = {
    id: Math.floor(Math.random() * 10000),
    customerName: customerName || "Guest",
    items: items || [],
    totalAmount: totalAmount || 0,
    status: "pending",
    createdAt: new Date().toISOString(),
  };

  res.status(201).json({
    success: true,
    message: "Order berhasil dibuat",
    data: newOrder,
  });
});

app.listen(port, () => {
  console.log(`Service 2 sedang berjalan port ${port}`);
});
