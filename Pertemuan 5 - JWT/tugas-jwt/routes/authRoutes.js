const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const authenticateToken = require("../middleware/authMiddleware");

router.post("/login", authController.login);

router.get("/protected", authenticateToken, authController.protected);

module.exports = router;
