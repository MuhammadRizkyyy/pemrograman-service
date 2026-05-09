require('dotenv').config();
const express = require('express');
const { initDB } = require('./config/database');
const { connect } = require('./config/rabbitmq');
const orderRoutes = require('./routes/orderRoutes');

const app = express();
const PORT = process.env.PORT || 3003;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/health', (req, res) => {
  res.json({ success: true, service: 'order-service', status: 'running' });
});

app.use('/orders', orderRoutes);

app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

app.use((err, req, res, next) => {
  console.error('[Error]', err);
  res.status(500).json({ success: false, message: 'Internal server error' });
});

const start = async () => {
  try {
    await initDB();
    await connect();
    app.listen(PORT, () => {
      console.log(`[Order Service] Running on port ${PORT}`);
    });
  } catch (err) {
    console.error('[Order Service] Failed to start:', err);
    process.exit(1);
  }
};

start();
