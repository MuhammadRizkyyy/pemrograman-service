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

const start = async (retries = 10, delay = 3000) => {
  for (let i = 0; i < retries; i++) {
    try {
      await initDB();
      await startConsumer();
      app.listen(PORT, () => {
        console.log(`[Notification Service] Running on port ${PORT}`);
      });
      return;
    } catch (err) {
      console.error(`[Notification Service] Start attempt ${i + 1}/${retries} failed:`, err.message);
      if (i < retries - 1) {
        console.log(`[Notification Service] Retrying in ${delay / 1000}s...`);
        await new Promise((res) => setTimeout(res, delay));
      } else {
        console.error('[Notification Service] All attempts failed, exiting.');
        process.exit(1);
      }
    }
  }
};

start();
