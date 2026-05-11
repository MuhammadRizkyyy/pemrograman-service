require('dotenv').config();
const express = require('express');
const rateLimit = require('express-rate-limit');
const axios = require('axios');
const cors = require('cors');
const morgan = require('morgan');

const app = express();
const PORT = process.env.PORT || 3000;
const SERVICE_B_URL = process.env.SERVICE_B_URL || 'http://localhost:8080';

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX) || 5,                   
  standardHeaders: true,  
  legacyHeaders: false,   
  message: {
    status: 429,
    error: 'Too Many Requests',
    message: 'Anda telah melebihi batas 5 request per menit. Silakan coba lagi nanti.',
    retryAfter: '60 detik'
  },
  handler: (req, res, next, options) => {
    console.log(`[RATE LIMIT] IP ${req.ip} diblokir - melebihi batas request`);
    res.status(options.statusCode).json(options.message);
  }
});

app.use('/api', limiter);

app.get('/', (req, res) => {
  res.json({
    service: 'Service A - Toko Sepatu Gateway',
    status: 'running',
    version: '1.0.0',
    rateLimit: {
      max: 5,
      windowMs: '60 detik',
      description: 'Maksimal 5 request per menit per IP'
    },
    endpoints: {
      sepatu: {
        'GET /api/sepatu': 'Ambil semua data sepatu',
        'GET /api/sepatu/:id': 'Ambil sepatu berdasarkan ID',
        'POST /api/sepatu': 'Tambah sepatu baru',
        'PUT /api/sepatu/:id': 'Update data sepatu',
        'DELETE /api/sepatu/:id': 'Hapus sepatu'
      },
      orders: {
        'GET /api/orders': 'Ambil semua pesanan',
        'GET /api/orders/:id': 'Ambil pesanan berdasarkan ID',
        'POST /api/orders': 'Buat pesanan baru'
      }
    }
  });
});


app.get('/api/sepatu', async (req, res) => {
  try {
    const response = await axios.get(`${SERVICE_B_URL}/api/sepatu.php`);
    res.status(response.status).json(response.data);
  } catch (error) {
    handleProxyError(error, res, 'Gagal mengambil data sepatu');
  }
});

app.get('/api/sepatu/:id', async (req, res) => {
  try {
    const response = await axios.get(`${SERVICE_B_URL}/api/sepatu.php?id=${req.params.id}`);
    res.status(response.status).json(response.data);
  } catch (error) {
    handleProxyError(error, res, 'Gagal mengambil data sepatu');
  }
});

app.post('/api/sepatu', async (req, res) => {
  try {
    const response = await axios.post(`${SERVICE_B_URL}/api/sepatu.php`, req.body);
    res.status(response.status).json(response.data);
  } catch (error) {
    handleProxyError(error, res, 'Gagal menambah sepatu');
  }
});

app.put('/api/sepatu/:id', async (req, res) => {
  try {
    const response = await axios.put(`${SERVICE_B_URL}/api/sepatu.php?id=${req.params.id}`, req.body);
    res.status(response.status).json(response.data);
  } catch (error) {
    handleProxyError(error, res, 'Gagal mengupdate sepatu');
  }
});

app.delete('/api/sepatu/:id', async (req, res) => {
  try {
    const response = await axios.delete(`${SERVICE_B_URL}/api/sepatu.php?id=${req.params.id}`);
    res.status(response.status).json(response.data);
  } catch (error) {
    handleProxyError(error, res, 'Gagal menghapus sepatu');
  }
});


app.get('/api/orders', async (req, res) => {
  try {
    const response = await axios.get(`${SERVICE_B_URL}/api/orders.php`);
    res.status(response.status).json(response.data);
  } catch (error) {
    handleProxyError(error, res, 'Gagal mengambil data pesanan');
  }
});

app.get('/api/orders/:id', async (req, res) => {
  try {
    const response = await axios.get(`${SERVICE_B_URL}/api/orders.php?id=${req.params.id}`);
    res.status(response.status).json(response.data);
  } catch (error) {
    handleProxyError(error, res, 'Gagal mengambil data pesanan');
  }
});

app.post('/api/orders', async (req, res) => {
  try {
    const response = await axios.post(`${SERVICE_B_URL}/api/orders.php`, req.body);
    res.status(response.status).json(response.data);
  } catch (error) {
    handleProxyError(error, res, 'Gagal membuat pesanan');
  }
});

function handleProxyError(error, res, defaultMessage) {
  if (error.response) {
    res.status(error.response.status).json(error.response.data);
  } else if (error.request) {
    console.error('[PROXY ERROR] Service B tidak merespons:', error.message);
    res.status(503).json({
      status: 503,
      error: 'Service Unavailable',
      message: 'Service B (PHP) tidak dapat dihubungi. Pastikan service berjalan.',
      serviceB: SERVICE_B_URL
    });
  } else {
    console.error('[ERROR]', error.message);
    res.status(500).json({
      status: 500,
      error: 'Internal Server Error',
      message: defaultMessage
    });
  }
}

app.listen(PORT, () => {
  console.log('Service A - Toko Sepatu Gateway');
  console.log(`Port: ${PORT}`);
  console.log(`Service B: ${SERVICE_B_URL}`);
  console.log('Rate Limit: 5 req/menit per IP');
});
