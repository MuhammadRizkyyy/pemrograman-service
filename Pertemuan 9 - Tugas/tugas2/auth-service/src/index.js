require('dotenv').config();
const express = require('express');
const { initDB } = require('./config/database');
const authRoutes = require('./routes/authRoutes');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ success: true, service: 'auth-service', status: 'running' });
});

// Routes
app.use('/auth', authRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('[Error]', err);
  res.status(500).json({ success: false, message: 'Internal server error' });
});

const start = async () => {
  try {
    await initDB();
    app.listen(PORT, () => {
      console.log(`[Auth Service] Running on port ${PORT}`);
    });
  } catch (err) {
    console.error('[Auth Service] Failed to start:', err);
    process.exit(1);
  }
};

start();
