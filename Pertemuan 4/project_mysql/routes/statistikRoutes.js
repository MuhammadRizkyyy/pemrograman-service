const express = require("express");
const router = express.Router();
const pool = require("../db/connection");

// GET /
router.get("/", async (req, res) => {
  try {
    const [[{ total_produk }]] = await pool.query(
      "SELECT COUNT(*) AS total_produk FROM produk",
    );
    const [[{ total_seller }]] = await pool.query(
      "SELECT COUNT(*) AS total_seller FROM seller",
    );
    const [[{ total_order }]] = await pool.query(
      "SELECT COUNT(*) AS total_order FROM `order`",
    );
    const [[{ total_revenue }]] = await pool.query(
      "SELECT COALESCE(SUM(total_harga), 0) AS total_revenue FROM `order` WHERE status = 'selesai'",
    );

    res.json({
      success: true,
      message: "Statistik TokoBersama",
      data: {
        total_produk,
        total_seller,
        total_order,
        total_revenue: parseFloat(total_revenue),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message, data: null });
  }
});

module.exports = router;
