require('dotenv').config();
const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const { defaultLimiter, authLimiter } = require('./middleware/rateLimiter');
const { requestId, httpLogger } = require('./middleware/logger');
const { optionalAuth } = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 3000;

const AUTH_SERVICE_URL        = process.env.AUTH_SERVICE_URL        || 'http://localhost:3001';
const PRODUCT_SERVICE_URL     = process.env.PRODUCT_SERVICE_URL     || 'http://localhost:3002';
const ORDER_SERVICE_URL       = process.env.ORDER_SERVICE_URL       || 'http://localhost:3003';
const NOTIFICATION_SERVICE_URL = process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3004';

// Middleware
app.use(requestId);
app.use(httpLogger);
app.use(optionalAuth);
app.use(defaultLimiter);

// Health check
app.get('/health', (req, res) => {
  res.json({
    success: true,
    service: 'api-gateway',
    status: 'running',
    services: {
      auth: AUTH_SERVICE_URL,
      product: PRODUCT_SERVICE_URL,
      order: ORDER_SERVICE_URL,
      notification: NOTIFICATION_SERVICE_URL,
    },
  });
});

// Helper buat proxy dengan path rewrite
const makeProxy = (target, pathRewrite) => {
  return createProxyMiddleware({
    target,
    changeOrigin: true,
    pathRewrite,
    on: {
      error: (err, req, res) => {
        console.error(`[Gateway] Proxy error to ${target}:`, err.message);
        res.status(502).json({ success: false, message: 'Service temporarily unavailable' });
      },
      proxyReq: (proxyReq, req) => {
        proxyReq.setHeader('X-Request-ID', req.id || '');
        if (req.user) {
          proxyReq.setHeader('X-User-ID', String(req.user.id || ''));
          proxyReq.setHeader('X-User-Role', req.user.role || '');
        }
      },
    },
  });
};

// Route
app.use('/api/auth',          authLimiter, makeProxy(AUTH_SERVICE_URL,          { '^/api/auth':          '/auth'          }));
app.use('/api/products',                   makeProxy(PRODUCT_SERVICE_URL,       { '^/api/products':      '/products'      }));
app.use('/api/categories',                 makeProxy(PRODUCT_SERVICE_URL,       { '^/api/categories':    '/categories'    }));
app.use('/api/orders',                     makeProxy(ORDER_SERVICE_URL,         { '^/api/orders':        '/orders'        }));
app.use('/api/notifications',              makeProxy(NOTIFICATION_SERVICE_URL,  { '^/api/notifications': '/notifications' }));

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    availableRoutes: ['/api/auth', '/api/products', '/api/categories', '/api/orders', '/api/notifications'],
  });
});

app.listen(PORT, () => {
  console.log(`[API Gateway] Running on port ${PORT}`);
  console.log(`  /api/auth          -> ${AUTH_SERVICE_URL}`);
  console.log(`  /api/products      -> ${PRODUCT_SERVICE_URL}`);
  console.log(`  /api/categories    -> ${PRODUCT_SERVICE_URL}`);
  console.log(`  /api/orders        -> ${ORDER_SERVICE_URL}`);
  console.log(`  /api/notifications -> ${NOTIFICATION_SERVICE_URL}`);
});
