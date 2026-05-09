require('dotenv').config();
const express = require('express');
const { initDB } = require('./config/database');
const { startConsumer } = require('./consumers/orderConsumer');
const notificationRoutes = require('./routes/notificationRoutes');

const app = express();
const PORT = process.env.PORT || 3004;

app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ success: true, service: 'notification-service', status: 'running' });
});

app.use('/notifications', notificationRoutes);

app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

const start = async () => {
  try {
    await initDB();
    await startConsumer();
    app.listen(PORT, () => {
      console.log(`[Notification Service] Running on port ${PORT}`);
    });
  } catch (err) {
    console.error('[Notification Service] Failed to start:', err);
    process.exit(1);
  }
};

start();
