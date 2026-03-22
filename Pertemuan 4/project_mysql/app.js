const express = require("express");
const { apiReference } = require("@scalar/express-api-reference");
const path = require("path");
const pool = require("./db/connection");

const kategoriRoutes = require("./routes/kategoriRoutes");
const sellerRoutes = require("./routes/sellerRoutes");
const produkRoutes = require("./routes/produkRoutes");
const orderRoutes = require("./routes/orderRoutes");
const statistikRoutes = require("./routes/statistikRoutes");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Middleware Logging setiap request
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path}`);
  next();
});

app.get("/openapi.json", (req, res) => {
  res.sendFile(path.join(__dirname, "openapi.json"));
});

// Scalar API Docs
app.use(
  "/docs",
  apiReference({
    spec: { url: "/openapi.json" },
    theme: "purple",
  }),
);

// Routes
app.use("/kategori", kategoriRoutes);
app.use("/seller", sellerRoutes);
app.use("/produk", produkRoutes);
app.use("/order", orderRoutes);
app.use("/statistik", statistikRoutes);

// 404 handler untuk route yang tidak ditemukan
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.path} tidak ditemukan`,
    data: null,
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res
    .status(500)
    .json({ success: false, message: "Internal Server Error", data: null });
});

app.listen(PORT, () => {
  console.log(`TokoBersama API berjalan di http://localhost:${PORT}`);
  console.log(`API Docs (Scalar) : http://localhost:${PORT}/docs`);
  console.log(`OpenAPI Spec      : http://localhost:${PORT}/openapi.json`);
});

module.exports = app;
