require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const mongoose = require('mongoose');
const rateLimit = require('express-rate-limit');

const queryRoutes = require('./routes/queryRoutes');
const historyRoutes = require('./routes/historyRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Too many requests, please try again later.' }
});
app.use('/api/', limiter);

// Routes
app.use('/api', queryRoutes);
app.use('/api', historyRoutes);

// Serve Static Frontend Files (ONLY in unified local deployment or specific production environments)
// On cloud providers like Render, the Frontend (Vercel) and Backend are usually separated.
if (process.env.SERVE_STATIC === 'true' || process.env.NODE_ENV === 'development') {
  const clientPath = path.join(__dirname, '../client/dist');
  app.use(express.static(clientPath));

  // Catch-all route for React (SPA)
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(clientPath, 'index.html'));
  });
}

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Global error:', err.message);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

// MongoDB connection
// MongoDB connection with retry
const connectDB = async () => {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/curalink_medical';

  try {
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
      heartbeatFrequencyMS: 10000
    });
    console.log('✅ MongoDB connected');
  } catch (err) {
    console.error('❌ MongoDB connection failed:', err.message);
    console.log('⚠️  Starting in offline memory mode (history disabled)');
  }
};

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Curalink Medical Backend running on port ${PORT}`);
  });
});

module.exports = app;
