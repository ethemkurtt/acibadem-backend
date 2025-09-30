// utils/serviceAuth.js
const jwt = require('jsonwebtoken');

const SERVICE_SECRET = process.env.SERVICE_SECRET;

if (!SERVICE_SECRET) {
  console.error("❌ SERVICE_SECRET environment variable is required!");
  throw new Error("SERVICE_SECRET environment variable is required");
}

// Servis token'ı oluştur
function generateServiceToken(serviceName, payload = {}) {
  const tokenPayload = {
    service: serviceName,
    type: 'service',
    iat: Math.floor(Date.now() / 1000),
    ...payload
  };

  return jwt.sign(tokenPayload, SERVICE_SECRET, { 
    expiresIn: '1h',
    issuer: 'acibadem-backend',
    audience: 'acibadem-services'
  });
}

// Servis token'ını doğrula
function verifyServiceToken(token) {
  try {
    const decoded = jwt.verify(token, SERVICE_SECRET, {
      issuer: 'acibadem-backend',
      audience: 'acibadem-services'
    });
    
    if (decoded.type !== 'service') {
      throw new Error('Invalid token type');
    }
    
    return decoded;
  } catch (err) {
    throw new Error(`Invalid service token: ${err.message}`);
  }
}

// Servisler arası istek için token oluştur
function createServiceRequest(serviceName, requestData = {}) {
  const token = generateServiceToken(serviceName, {
    requestId: Math.random().toString(36).substr(2, 9),
    timestamp: Date.now(),
    ...requestData
  });

  return {
    headers: {
      'Authorization': `Bearer ${token}`,
      'X-Service-Name': serviceName,
      'X-Service-Token': token,
      'Content-Type': 'application/json'
    },
    token
  };
}

// Servis token middleware
function serviceAuthMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    const serviceToken = req.headers['x-service-token'];
    
    if (!authHeader && !serviceToken) {
      return res.status(401).json({ 
        error: 'Service authentication required',
        message: 'X-Service-Token header is required'
      });
    }

    const token = serviceToken || authHeader.replace('Bearer ', '');
    const decoded = verifyServiceToken(token);
    
    // Servis bilgilerini req'e ekle
    req.service = {
      name: decoded.service,
      type: decoded.type,
      requestId: decoded.requestId,
      timestamp: decoded.timestamp
    };
    
    next();
  } catch (err) {
    return res.status(401).json({ 
      error: 'Service authentication failed',
      message: err.message
    });
  }
}

// Servisler arası HTTP isteği yapmak için wrapper
async function makeServiceRequest(serviceName, url, options = {}) {
  const serviceRequest = createServiceRequest(serviceName);
  
  const requestOptions = {
    ...options,
    headers: {
      ...serviceRequest.headers,
      ...options.headers
    }
  };

  try {
    const response = await fetch(url, requestOptions);
    
    if (!response.ok) {
      throw new Error(`Service request failed: ${response.status} ${response.statusText}`);
    }
    
    return await response.json();
  } catch (err) {
    console.error(`Service request to ${serviceName} failed:`, err);
    throw err;
  }
}

module.exports = {
  generateServiceToken,
  verifyServiceToken,
  createServiceRequest,
  serviceAuthMiddleware,
  makeServiceRequest
};
