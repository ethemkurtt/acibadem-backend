// middlewares/serviceCommunication.js
const { serviceAuthMiddleware } = require('../utils/serviceAuth');

// Servisler arası iletişim için özel middleware
const serviceCommunicationMiddleware = (req, res, next) => {
  // Eğer istek servisler arası ise (X-Service-Token header'ı varsa)
  if (req.headers['x-service-token']) {
    return serviceAuthMiddleware(req, res, next);
  }
  
  // Normal kullanıcı isteği ise devam et
  next();
};

// Servis endpoint'leri için özel middleware
const serviceOnlyMiddleware = (req, res, next) => {
  if (!req.headers['x-service-token']) {
    return res.status(403).json({
      error: 'Service access only',
      message: 'This endpoint is only accessible by services'
    });
  }
  
  return serviceAuthMiddleware(req, res, next);
};

// Servis loglama middleware
const serviceLoggingMiddleware = (req, res, next) => {
  if (req.headers['x-service-token']) {
    console.log(`[SERVICE] ${req.method} ${req.path} - Service: ${req.headers['x-service-name'] || 'unknown'}`);
  }
  next();
};

module.exports = {
  serviceCommunicationMiddleware,
  serviceOnlyMiddleware,
  serviceLoggingMiddleware
};
