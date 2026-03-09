const express = require("express");
const app = express();

app.use(express.json());

const SERVICES = {
  user: "http://localhost:3001",
  product: "http://localhost:3002",
  order: "http://localhost:3003",
};

// Middleware
app.use((req, res, next) => {
  console.log(
    `[GATEWAY] ${new Date().toISOString()} - ${req.method} ${req.url}`,
  );
  next();
});

const http = require("http");
const { hostname } = require("os");

function proxyRequest(targetUrl, req, res) {
  const url = new URL(targetUrl);
  const options = {
    hostname: url.hostname,
    port: url.port,
    path: url.pathname + (url.search || ""),
    method: req.method,
    headers: { "Content-Type": "application/json" },
  };

  const proxyReq = http.request(options, (proxyRes) => {
    res.status(proxyRes.statusCode);
    let body = "";
    proxyRes.on("data", (chunk) => (body += chunk));
    proxyRes.on("end", () => {
      try {
        res.json(JSON.parse(body));
      } catch {
        res.send(body);
      }
    });
  });

  proxyReq.on("error", () => {
    res.status(503).json({ success: false, message: "Service tidak tersedia" });
  });

  if (["POST", "PUT", "PATCH"].includes(req.method) && req.body) {
    proxyReq.write(JSON.stringify(req.body));
  }
  proxyReq.end();
}

// ---- ROUTING RULES ----
// User routes → user-service:3001
app.all(/\/api\/users.*/, (req, res) => {
  const target = SERVICES.user + req.url;
  console.log(`[GATEWAY] Routing ke User Service: ${target}`);
  proxyRequest(target, req, res);
});

// Product routes → product-service:3002
app.all(/\/api\/products.*/, (req, res) => {
  const target = SERVICES.product + req.url;
  console.log(`[GATEWAY] Routing ke Product Service: ${target}`);
  proxyRequest(target, req, res);
});

// Order routes → order-service:3003
app.all(/\/api\/orders.*/, (req, res) => {
  const target = SERVICES.order + req.url;
  console.log(`[GATEWAY] Routing ke Order Service: ${target}`);
  proxyRequest(target, req, res);
});

// ---- HEALTH CHECK SEMUA SERVICE ----
app.get("/health", async (req, res) => {
  const checks = await Promise.all(
    Object.entries(SERVICES).map(
      ([name, url]) =>
        new Promise((resolve) => {
          const req = http
            .get(`${url}/health`, (r) => {
              resolve({
                service: name,
                status: r.statusCode === 200 ? "UP" : "DOWN",
                url,
              });
            })
            .on("error", () => resolve({ service: name, status: "DOWN", url }));
          req.setTimeout(2000, () =>
            resolve({ service: name, status: "TIMEOUT", url }),
          );
        }),
    ),
  );
  res.json({
    gateway: "OK",
    architecture: "Microservices",
    timestamp: new Date().toISOString(),
    services: checks,
  });
});

const port = 3000;
app.listen(port, () => {
  console.log(`http://localhost:${port}`);
});
