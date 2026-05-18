const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const config = require("./config");

const healthRouter = require("./routes/health");
const predictRouter = require("./routes/predict");

const app = express();

app.use(helmet());
app.use(cors());
app.use(morgan("combined"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: "Terlalu banyak request, coba lagi nanti." },
});
app.use("/api/", limiter);

app.use("/health", healthRouter);
app.use("/api/predict", predictRouter);

app.get("/", (req, res) => {
  res.json({
    service: "Express ML Gateway",
    version: "1.0.0",
    description: "Gateway service yang mengintegrasikan Python FastAPI ML Service",
    endpoints: {
      health: "GET /health",
      predict: "POST /api/predict",
      batch_predict: "POST /api/predict/batch",
    },
    ml_service_docs: `${config.ML_SERVICE_URL}/docs`,
  });
});

app.use((req, res) => {
  res.status(404).json({ success: false, error: `Route ${req.path} tidak ditemukan` });
});

app.use((err, req, res, _next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ success: false, error: "Internal server error" });
});

app.listen(config.PORT, () => {
  console.log(`Express ML Gateway running on port ${config.PORT}`);
  console.log(` ML Service URL: ${config.ML_SERVICE_URL}`);
  console.log(`Environment: ${config.NODE_ENV}`);
});

module.exports = app;
