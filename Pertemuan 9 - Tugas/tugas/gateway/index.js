const express = require("express");
const axios = require("axios");
require("dotenv").config();

const app = express();
app.use(express.json());

// Logging Middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

const SERVICES = {
  auth: `http://127.0.0.1:${process.env.AUTH_PORT || 3001}`,
  product: `http://127.0.0.1:${process.env.PRODUCT_PORT || 3002}`,
  transaction: `http://127.0.0.1:${process.env.TRANSACTION_PORT || 3003}`,
};

const proxyRequest = async (serviceUrl, req, res) => {
  try {
    const response = await axios({
      method: req.method,
      url: `${serviceUrl}${req.url.replace(/^\/(auth|products|transactions)/, "")}`,
      data: req.body,
      headers: req.headers,
      timeout: 15000, // 15 second timeout
    });
    res.status(response.status).json(response.data);
  } catch (err) {
    console.error(`[Proxy Error] ${err.message} for ${req.url}`);
    if (err.response) {
      res.status(err.response.status).json(err.response.data);
    } else {
      res.status(503).json({ error: "Service Unavailable or Timeout", details: err.message });
    }
  }
};

app.all(/^\/auth\/.*/, (req, res) => proxyRequest(SERVICES.auth, req, res));
app.all(/^\/products\/.*/, (req, res) =>
  proxyRequest(SERVICES.product, req, res),
);
app.all(/^\/transactions\/.*/, (req, res) =>
  proxyRequest(SERVICES.transaction, req, res),
);

app.get("/", (req, res) => {
  res.json({ message: "API Gateway is running", version: "1.0.0" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`API Gateway running on port ${PORT}`));
