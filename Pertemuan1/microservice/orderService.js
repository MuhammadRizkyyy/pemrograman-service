const express = require("express");
const http = require("http");
const app = express();
app.use(express.json());

const USER_SERVICE = "http://localhost:3001";
const PRODUCT_SERVICE = "http://localhost:3002";

let orders = [
  {
    id: 1,
    userId: 1,
    productId: 1,
    quantity: 1,
    status: "completed",
    total: 8500000,
    createdAt: "2024-01-10",
  },
];
let nextId = 2;

app.use((req, res, next) => {
  console.log(
    `[ORDER-SERVICE] ${new Date().toISOString()} ${req.method} ${req.url}`,
  );
  next();
});

//HELPER: HTTP REQUEST ke service lain
function httpGet(url) {
  return new Promise((resolve, reject) => {
    http
      .get(url, (res) => {
        let body = "";
        res.on("data", (d) => (body += d));
        res.on("end", () => {
          try {
            resolve({ statusCode: res.statusCode, data: JSON.parse(body) });
          } catch {
            reject(new Error("Parse error"));
          }
        });
      })
      .on("error", reject);
  });
}

function httpPatch(url, body) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const data = JSON.stringify(body);
    const options = {
      hostname: parsed.hostname,
      port: parsed.port,
      path: parsed.pathname,
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(data),
      },
    };
    const req = http.request(options, (res) => {
      let b = "";
      res.on("data", (d) => (b += d));
      res.on("end", () => {
        try {
          resolve({ statusCode: res.statusCode, data: JSON.parse(b) });
        } catch {
          reject(new Error("Parse error"));
        }
      });
    });
    req.on("error", reject);
    req.write(data);
    req.end();
  });
}

// GET semua order
app.get("/api/orders", async (req, res) => {
  try {
    const enriched = await Promise.all(
      orders.map(async (order) => {
        const [userRes, productRes] = await Promise.all([
          httpGet(`${USER_SERVICE}/api/users/${order.userId}`),
          httpGet(`${PRODUCT_SERVICE}/api/products/${order.productId}`),
        ]);
        return {
          ...order,
          user: userRes.data?.data || null,
          product: productRes.data?.data || null,
        };
      }),
    );
    res.json({
      success: true,
      data: enriched,
      total: enriched.length,
      service: "order-service",
    });
  } catch {
    res.status(500).json({
      success: false,
      message: "Gagal mengambil data dari service lain",
    });
  }
});

// GET order by ID
app.get("/api/orders/:id", async (req, res) => {
  const order = orders.find((o) => o.id === parseInt(req.params.id));
  if (!order)
    return res
      .status(404)
      .json({ success: false, message: "Order tidak ditemukan" });

  try {
    const [userRes, productRes] = await Promise.all([
      httpGet(`${USER_SERVICE}/api/users/${order.userId}`),
      httpGet(`${PRODUCT_SERVICE}/api/products/${order.productId}`),
    ]);
    res.json({
      success: true,
      data: {
        ...order,
        user: userRes.data?.data,
        product: productRes.data?.data,
      },
    });
  } catch {
    res.json({ success: true, data: order });
  }
});

// POST buat order baru
app.post("/api/orders", async (req, res) => {
  const { userId, productId, quantity } = req.body;
  if (!userId || !productId || !quantity) {
    return res.status(400).json({
      success: false,
      message: "userId, productId, dan quantity wajib diisi",
    });
  }

  try {
    const userRes = await httpGet(`${USER_SERVICE}/api/users/${userId}`);
    if (userRes.statusCode === 404)
      return res
        .status(404)
        .json({ success: false, message: "User tidak ditemukan" });

    const productRes = await httpGet(
      `${PRODUCT_SERVICE}/api/products/${productId}`,
    );
    if (productRes.statusCode === 404)
      return res
        .status(404)
        .json({ success: false, message: "Produk tidak ditemukan" });

    const product = productRes.data.data;
    if (product.stock < quantity) {
      return res.status(400).json({
        success: false,
        message: `Stok tidak cukup. Tersedia: ${product.stock}`,
      });
    }

    await httpPatch(`${PRODUCT_SERVICE}/api/products/${productId}/stock`, {
      quantity,
      action: "decrease",
    });

    const order = {
      id: nextId++,
      userId: parseInt(userId),
      productId: parseInt(productId),
      quantity,
      status: "pending",
      total: product.price * quantity,
      createdAt: new Date().toISOString(),
    };
    orders.push(order);

    res.status(201).json({
      success: true,
      data: { ...order, user: userRes.data.data, product },
      message: "Order berhasil dibuat",
    });
  } catch (err) {
    console.error(err);
    res.status(503).json({
      success: false,
      message: "Service tidak tersedia, coba lagi nanti",
    });
  }
});

// PATCH update status order
app.patch("/api/orders/:id/status", (req, res) => {
  const order = orders.find((o) => o.id === parseInt(req.params.id));
  if (!order)
    return res
      .status(404)
      .json({ success: false, message: "Order tidak ditemukan" });
  const valid = ["pending", "processing", "completed", "cancelled"];
  if (!valid.includes(req.body.status)) {
    return res
      .status(400)
      .json({ success: false, message: `Status harus: ${valid.join(", ")}` });
  }
  order.status = req.body.status;
  res.json({ success: true, data: order });
});

// Health check
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    service: "order-service",
    port: 3003,
    orders: orders.length,
  });
});

app.listen(3003, () => {
  console.log("Order Service berjalan di http://localhost:3003");
});
