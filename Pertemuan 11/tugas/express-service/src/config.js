require("dotenv").config();

module.exports = {
  PORT: process.env.PORT || 3092,
  NODE_ENV: process.env.NODE_ENV || "development",

  ML_SERVICE_URL: process.env.ML_SERVICE_URL || "http://localhost:3091",
  ML_USERNAME: process.env.ML_USERNAME || "user",
  ML_PASSWORD: process.env.ML_PASSWORD || "user123",

  CB_TIMEOUT: parseInt(process.env.CB_TIMEOUT || "5000"),       
  CB_ERROR_THRESHOLD: parseInt(process.env.CB_ERROR_THRESHOLD || "50"), 
  CB_RESET_TIMEOUT: parseInt(process.env.CB_RESET_TIMEOUT || "30000"), 
};
