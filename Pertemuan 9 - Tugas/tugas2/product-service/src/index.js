require('dotenv').config();
const express = require('express');
const { initDB } = require('./config/database');
const productRoutes = require('./routes/productRoutes');
const categoryRoutes = require('./routes/categoryRoutes');

const app = express();
const PORT = process.env.PORT || 3002;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/health', (req, res) => {
  res.json({ success: true, service: 'product-service', status: 'running' });
});

app.use('/products', productRoutes);
app.use('/categories', categoryRoutes);

app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

app.use((err, req, res, next) => {
  console.error('[Error]', err);
  res.status(500).json({ success: false, message: 'Internal server error' });
});

const start = async (retries = 10, delay = 3000) => {
  for (let i = 0; i < retries; i++) {
    try {
      await initDB();
      app.listen(PORT, () => {
        console.log(`[Product Service] Running on port ${PORT}`);
      });
      return;
    } catch (err) {
      console.error(`[Product Service] Start attempt ${i + 1}/${retries} failed:`, err.message);
      if (i < retries - 1) {
        console.log(`[Product Service] Retrying in ${delay / 1000}s...`);
        await new Promise((res) => setTimeout(res, delay));
      } else {
        console.error('[Product Service] All attempts failed, exiting.');
        process.exit(1);
      }
    }
  }
};

start();
