
const axios = require("axios");
const CircuitBreaker = require("opossum");
const config = require("./config");

let cachedToken = null;
let tokenExpiry = null;

const mlAxios = axios.create({
  baseURL: config.ML_SERVICE_URL,
  timeout: config.CB_TIMEOUT,
  headers: { "Content-Type": "application/json" },
});

async function getToken() {
  if (cachedToken && tokenExpiry && Date.now() < tokenExpiry - 60_000) {
    return cachedToken;
  }

  const params = new URLSearchParams();
  params.append("username", config.ML_USERNAME);
  params.append("password", config.ML_PASSWORD);

  const res = await axios.post(`${config.ML_SERVICE_URL}/auth/token`, params, {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    timeout: 5000,
  });

  cachedToken = res.data.access_token;
  tokenExpiry = Date.now() + 60 * 60 * 1000;
  return cachedToken;
}

async function mlRequest(method, path, data = null) {
  const token = await getToken();
  const res = await mlAxios.request({
    method,
    url: path,
    data,
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
}

const breakerOptions = {
  timeout: config.CB_TIMEOUT,
  errorThresholdPercentage: config.CB_ERROR_THRESHOLD,
  resetTimeout: config.CB_RESET_TIMEOUT,
  name: "ml-service-breaker",
};

const breaker = new CircuitBreaker(mlRequest, breakerOptions);

breaker.on("open", () =>
  console.warn("Circuit Breaker OPEN — ML Service tidak tersedia")
);
breaker.on("halfOpen", () =>
  console.info("Circuit Breaker HALF-OPEN — mencoba reconnect...")
);
breaker.on("close", () =>
  console.info("Circuit Breaker CLOSED — ML Service kembali normal")
);

async function healthCheck() {
  const res = await axios.get(`${config.ML_SERVICE_URL}/health`, { timeout: 3000 });
  return res.data;
}

async function predict(features) {
  return breaker.fire("POST", "/predict", features);
}

async function batchPredict(dataArray) {
  return breaker.fire("POST", "/batch-predict", { data: dataArray });
}

function getBreakerStatus() {
  return {
    state: breaker.opened ? "open" : breaker.halfOpen ? "half-open" : "closed",
    stats: breaker.stats,
  };
}

module.exports = { healthCheck, predict, batchPredict, getBreakerStatus };
