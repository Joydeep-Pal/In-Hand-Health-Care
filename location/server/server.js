const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const nearbyRoutes = require('./routes/nearbyRoutes');

dotenv.config();

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: (process.env.FRONTEND_ORIGIN || 'http://localhost:5173').split(',').map((origin) => origin.trim()),
}));
app.use(express.json({ limit: '10mb' }));

// API routes
app.use('/api/nearby', nearbyRoutes);

// Health check
app.get('/api/health', (req, res) => {
  const mongoose = require('mongoose');
  res.json({ success: true, message: 'Smart Doctor API is running', database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Centralized error handler — never exposes stack traces to client
app.use((err, req, res, next) => {
  console.error('Server error:', err.message);
  const status = Number.isInteger(err.status) ? err.status : 500;
  res.status(status).json({
    success: false,
    message: status === 500 && process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message
  });
});

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`Smart Doctor server running on port ${PORT}`);
  });
};

startServer();
