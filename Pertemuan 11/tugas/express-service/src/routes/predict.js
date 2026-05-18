const express = require("express");
const router = express.Router();
const mlClient = require("../mlClient");

/**
 * POST /api/predict
 */
router.post("/", async (req, res) => {
  const { sepal_length, sepal_width, petal_length, petal_width } = req.body;

  // Validasi input
  const fields = { sepal_length, sepal_width, petal_length, petal_width };
  const missing = Object.entries(fields)
    .filter(([, v]) => v === undefined || v === null)
    .map(([k]) => k);

  if (missing.length > 0) {
    return res.status(400).json({
      success: false,
      error: "Validasi gagal",
      missing_fields: missing,
      example: {
        sepal_length: 5.1,
        sepal_width: 3.5,
        petal_length: 1.4,
        petal_width: 0.2,
      },
    });
  }

  const numericErrors = Object.entries(fields)
    .filter(([, v]) => isNaN(Number(v)) || Number(v) <= 0)
    .map(([k]) => k);

  if (numericErrors.length > 0) {
    return res.status(400).json({
      success: false,
      error: "Nilai harus berupa angka positif",
      invalid_fields: numericErrors,
    });
  }

  try {
    const mlResult = await mlClient.predict({
      sepal_length: Number(sepal_length),
      sepal_width: Number(sepal_width),
      petal_length: Number(petal_length),
      petal_width: Number(petal_width),
    });

    return res.json({
      success: true,
      source: "ml-service",
      input: {
        sepal_length: Number(sepal_length),
        sepal_width: Number(sepal_width),
        petal_length: Number(petal_length),
        petal_width: Number(petal_width),
      },
      result: {
        prediction_id: mlResult.prediction,
        predicted_class: mlResult.predicted_class,
        confidence: mlResult.confidence,
        confidence_percent: `${(mlResult.confidence * 100).toFixed(2)}%`,
        probabilities: mlResult.probabilities,
        cached: mlResult.cached,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    if (err.name === "OpenCircuitError" || err.code === "ECONNREFUSED") {
      return res.status(503).json({
        success: false,
        error: "ML Service tidak tersedia saat ini",
        circuit_breaker: "open",
        message: "Silakan coba beberapa saat lagi",
        timestamp: new Date().toISOString(),
      });
    }

    console.error("Predict error:", err.message);
    return res.status(500).json({
      success: false,
      error: "Terjadi kesalahan internal",
      detail: err.message,
    });
  }
});

/**
 * POST /api/predict/batch
 */
router.post("/batch", async (req, res) => {
  const { data } = req.body;

  if (!Array.isArray(data) || data.length === 0) {
    return res.status(400).json({
      success: false,
      error: "Field 'data' harus berupa array dan tidak boleh kosong",
      example: {
        data: [
          { sepal_length: 5.1, sepal_width: 3.5, petal_length: 1.4, petal_width: 0.2 },
          { sepal_length: 6.3, sepal_width: 3.3, petal_length: 6.0, petal_width: 2.5 },
        ],
      },
    });
  }

  if (data.length > 100) {
    return res.status(400).json({
      success: false,
      error: "Maksimal 100 item per batch request",
    });
  }

  try {
    const mlResult = await mlClient.batchPredict(data);

    return res.json({
      success: true,
      source: "ml-service",
      total: mlResult.total,
      results: mlResult.results.map((r, i) => ({
        index: i,
        input: data[i],
        prediction_id: r.prediction,
        predicted_class: r.predicted_class,
        confidence: r.confidence,
        confidence_percent: `${(r.confidence * 100).toFixed(2)}%`,
        cached: r.cached,
      })),
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    if (err.name === "OpenCircuitError" || err.code === "ECONNREFUSED") {
      return res.status(503).json({
        success: false,
        error: "ML Service tidak tersedia saat ini",
        circuit_breaker: "open",
        timestamp: new Date().toISOString(),
      });
    }

    console.error("Batch predict error:", err.message);
    return res.status(500).json({
      success: false,
      error: "Terjadi kesalahan internal",
      detail: err.message,
    });
  }
});

module.exports = router;
