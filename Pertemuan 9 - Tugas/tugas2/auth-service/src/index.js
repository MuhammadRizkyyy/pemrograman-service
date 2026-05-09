require('dotenv').config();
const express = require('express');
const { initDB } = require('./config/database');
const authRoutes = require('./routes/authRoutes');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/health', (req, res) => {
  res.json({ success: true, service: 'auth-service', status: 'running' });
});

app.use('/auth', authRoutes);

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
        console.log(`[Auth Service] Running on port ${PORT}`);
      });
      return;
    } catch (err) {
      console.error(`[Auth Service] Start attempt ${i + 1}/${retries} failed:`, err.message);
      if (i < retries - 1) {
        console.log(`[Auth Service] Retrying in ${delay / 1000}s...`);
        await new Promise((res) => setTimeout(res, delay));
      } else {
        console.error('[Auth Service] All attempts failed, exiting.');
        process.exit(1);
      }
    }
  }
};

start();
