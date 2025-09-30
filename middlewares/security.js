// middlewares/security.js
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// Helmet güvenlik headers
const helmetConfig = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  noSniff: true,
  xssFilter: true,
  referrerPolicy: { policy: "same-origin" }
});

// Genel rate limiting
const generalLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 dakika
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // 100 istek
  message: {
    error: "Çok fazla istek gönderildi. Lütfen daha sonra tekrar deneyin.",
    retryAfter: "15 dakika"
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Auth endpoint'leri için özel rate limiting
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 dakika
  max: 5, // 5 deneme
  message: {
    error: "Çok fazla giriş denemesi. Lütfen 15 dakika sonra tekrar deneyin.",
    retryAfter: "15 dakika"
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// API endpoint'leri için rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 dakika
  max: 200, // 200 istek
  message: {
    error: "API rate limit aşıldı. Lütfen daha sonra tekrar deneyin.",
    retryAfter: "15 dakika"
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = {
  helmetConfig,
  generalLimiter,
  authLimiter,
  apiLimiter
};
