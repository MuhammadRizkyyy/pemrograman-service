const express = require("express");
const router = express.Router();
const mlClient = require("../mlClient");
const config = require("../config");

router.get("/", async (req, res) => {
  let mlStatus = { status: "unknown", reachable: false };

  try {
    const mlHealth = await mlClient.healthCheck();
    mlStatus = { ...mlHealth, reachable: true };
  } catch {
    mlStatus = { status: "unreachable", reachable: false };
  }

  const circuitBreaker = mlClient.getBreakerStatus();

  res.json({
    status: "healthy",
    service: "Express ML Gateway",
    version: "1.0.0",
    environment: config.NODE_ENV,
    uptime_seconds: Math.floor(process.uptime()),
    ml_service: {
      url: config.ML_SERVICE_URL,
      ...mlStatus,
    },
    circuit_breaker: circuitBreaker,
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
