// gateway/gateway.js
const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');

const { authRequired } = require('../middlewares/auth');
const { helmetConfig, generalLimiter, apiLimiter } = require('../middlewares/security');
const { serviceCommunicationMiddleware } = require('../middlewares/serviceCommunication');

const app = express();

// Environment variables
const PORT = process.env.GATEWAY_PORT || 3000;
const API_PORT = process.env.API_PORT || 5000;

// Middleware'ler
app.use(helmetConfig);
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan('combined'));
app.use(generalLimiter);
app.use(serviceCommunicationMiddleware);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'API Gateway',
    version: '1.0.0'
  });
});

// Public endpoints (authentication gerekmez)
const publicEndpoints = [
  '/auth/login',
  '/auth/forgot',
  '/auth/reset/verify',
  '/auth/reset',
  '/health'
];

// Public endpoint'leri proxy'le
publicEndpoints.forEach(endpoint => {
  app.use(endpoint, createProxyMiddleware({
    target: `http://localhost:${API_PORT}`,
    changeOrigin: true,
    pathRewrite: {
      [`^${endpoint}`]: endpoint
    },
    onError: (err, req, res) => {
      console.error(`Gateway error for ${endpoint}:`, err);
      res.status(500).json({ 
        error: 'Gateway Error',
        message: 'Service temporarily unavailable'
      });
    }
  }));
});

// Protected endpoints (authentication gerekir)
app.use('/api', authRequired, apiLimiter);

// API endpoint'lerini proxy'le
app.use('/api', createProxyMiddleware({
  target: `http://localhost:${API_PORT}`,
  changeOrigin: true,
  onError: (err, req, res) => {
    console.error('Gateway API error:', err);
    res.status(500).json({ 
      error: 'Gateway Error',
      message: 'API service temporarily unavailable'
    });
  },
  onProxyReq: (proxyReq, req, res) => {
    // Kullanıcı bilgilerini header'a ekle
    if (req.user) {
      proxyReq.setHeader('X-User-ID', req.user._id);
      proxyReq.setHeader('X-User-Name', req.user.name);
      proxyReq.setHeader('X-User-Role', req.user.role);
      proxyReq.setHeader('X-User-Lokasyon', req.user.lokasyon);
    }
  }
}));

// Static files
app.use('/uploads', createProxyMiddleware({
  target: `http://localhost:${API_PORT}`,
  changeOrigin: true
}));

// Error handling
app.use((err, req, res, next) => {
  console.error('Gateway error:', err);
  res.status(500).json({
    error: 'Internal Gateway Error',
    message: 'An unexpected error occurred'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: 'The requested resource was not found'
  });
});

// Gateway'i başlat
app.listen(PORT, () => {
  console.log(`🚀 API Gateway running on port ${PORT}`);
  console.log(`📡 Proxying to API server on port ${API_PORT}`);
  console.log(`🔒 Authentication required for /api/* endpoints`);
  console.log(`🌐 Public endpoints: ${publicEndpoints.join(', ')}`);
});

module.exports = app;
