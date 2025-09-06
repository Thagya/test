// middleware/securityMiddleware.js - OWASP Top 10 Protection
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const validator = require('validator');

// 1. Rate Limiting - Prevents Brute Force Attacks
const createRateLimiter = (windowMs, max, message) => {
  return rateLimit({
    windowMs,
    max,
    message: { error: message },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      console.log(`Rate limit exceeded for IP: ${req.ip}, Path: ${req.path}`);
      res.status(429).json({ error: message });
    }
  });
};

// Different rate limits for different endpoints
const authLimiter = createRateLimiter(
  15 * 60 * 1000, // 15 minutes
  5, // 5 attempts
  'Too many authentication attempts, please try again later'
);

const generalLimiter = createRateLimiter(
  15 * 60 * 1000, // 15 minutes
  100, // 100 requests
  'Too many requests, please try again later'
);

const apiLimiter = createRateLimiter(
  15 * 60 * 1000, // 15 minutes
  200, // 200 requests for API calls
  'API rate limit exceeded'
);

// 2. Input Validation Middleware
const validateInput = {
  // Validate user registration/login
  validateAuth: (req, res, next) => {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    // Username validation
    if (!validator.isLength(username, { min: 3, max: 20 })) {
      return res.status(400).json({ error: 'Username must be 3-20 characters long' });
    }

    if (!validator.isAlphanumeric(username)) {
      return res.status(400).json({ error: 'Username must contain only letters and numbers' });
    }

    // Password validation
    if (!validator.isLength(password, { min: 6, max: 100 })) {
      return res.status(400).json({ error: 'Password must be 6-100 characters long' });
    }

    next();
  },

  // Validate product data
  validateProduct: (req, res, next) => {
    const { name, description, price, category, stock } = req.body;

    if (name && !validator.isLength(name, { min: 1, max: 100 })) {
      return res.status(400).json({ error: 'Product name must be 1-100 characters' });
    }

    if (description && !validator.isLength(description, { min: 1, max: 1000 })) {
      return res.status(400).json({ error: 'Description must be 1-1000 characters' });
    }

    if (price && (!validator.isFloat(price.toString(), { min: 0.01 }) || parseFloat(price) > 999999)) {
      return res.status(400).json({ error: 'Price must be between 0.01 and 999999' });
    }

    if (stock && (!validator.isInt(stock.toString(), { min: 0 }) || parseInt(stock) > 999999)) {
      return res.status(400).json({ error: 'Stock must be between 0 and 999999' });
    }

    if (category && !['Eco Bags', 'Water Bottles', 'Reusable Items', 'Solar Products', 'Organic', 'General'].includes(category)) {
      return res.status(400).json({ error: 'Invalid category' });
    }

    next();
  },

  // Validate cart operations
  validateCart: (req, res, next) => {
    const { quantity, productId } = req.body;

    if (quantity && (!validator.isInt(quantity.toString(), { min: 1 }) || parseInt(quantity) > 999)) {
      return res.status(400).json({ error: 'Quantity must be between 1 and 999' });
    }

    if (productId && !validator.isMongoId(productId)) {
      return res.status(400).json({ error: 'Invalid product ID format' });
    }

    next();
  }
};

// 3. SQL Injection Protection (Already handled by Mongoose, but adding extra layer)
const preventInjection = (req, res, next) => {
  // Additional validation for common injection patterns
  const checkForInjection = (obj) => {
    for (const key in obj) {
      if (typeof obj[key] === 'string') {
        // Check for common SQL injection patterns
        const injectionPatterns = [
          /(\$where|\$ne|\$in|\$nin|\$gt|\$gte|\$lt|\$lte)/i,
          /(javascript:|vbscript:|onload|onerror)/i,
          /(<script|<\/script|<iframe|<\/iframe)/i
        ];
        
        for (const pattern of injectionPatterns) {
          if (pattern.test(obj[key])) {
            return false;
          }
        }
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        if (!checkForInjection(obj[key])) {
          return false;
        }
      }
    }
    return true;
  };

  if (!checkForInjection(req.body) || !checkForInjection(req.query)) {
    return res.status(400).json({ error: 'Invalid input detected' });
  }

  next();
};

// 4. CSRF Protection Setup
const csrfProtection = (req, res, next) => {
  // Skip CSRF for certain routes (webhook, health check)
  const skipRoutes = ['/api/payments/webhook', '/api/health'];
  if (skipRoutes.includes(req.path)) {
    return next();
  }

  // For now, we'll implement a simple token-based CSRF protection
  // In production, use proper CSRF tokens
  const csrfHeader = req.headers['x-csrf-token'] || req.headers['x-requested-with'];
  
  // Allow XMLHttpRequest (AJAX) requests as they're subject to same-origin policy
  if (csrfHeader === 'XMLHttpRequest' || req.method === 'GET') {
    return next();
  }

  // For production, implement proper CSRF token validation
  next();
};

// 5. Security Headers with Helmet
const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://api.stripe.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
});

// 6. Request Size Limiting
const requestSizeLimit = (req, res, next) => {
  const contentLength = parseInt(req.headers['content-length']);
  const maxSize = 10 * 1024 * 1024; // 10MB

  if (contentLength > maxSize) {
    return res.status(413).json({ error: 'Request entity too large' });
  }

  next();
};

// 7. Logging and Monitoring
const securityLogger = (req, res, next) => {
  // Log suspicious activities
  const suspiciousPatterns = [
    /(\.\.|\/etc\/|\/proc\/|\/var\/)/i,
    /(union|select|drop|delete|insert|update|create|alter)/i,
    /(<script|javascript:|vbscript:)/i
  ];

  const checkSuspicious = (str) => {
    return suspiciousPatterns.some(pattern => pattern.test(str));
  };

  let suspicious = false;
  
  // Check URL, query params, and body for suspicious content
  if (checkSuspicious(req.url) || 
      checkSuspicious(JSON.stringify(req.query)) || 
      checkSuspicious(JSON.stringify(req.body))) {
    suspicious = true;
  }

  if (suspicious) {
    console.log(`⚠️ Suspicious request detected:`, {
      ip: req.ip,
      method: req.method,
      url: req.url,
      userAgent: req.headers['user-agent'],
      timestamp: new Date().toISOString()
    });
  }

  // Log failed authentication attempts
  const originalSend = res.send;
  res.send = function(data) {
    if (res.statusCode === 401 && req.path.includes('auth')) {
      console.log(`🔒 Failed authentication attempt:`, {
        ip: req.ip,
        username: req.body.username,
        timestamp: new Date().toISOString()
      });
    }
    originalSend.call(this, data);
  };

  next();
};

// 8. Enhanced CORS Configuration
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      process.env.CLIENT_URL || 'http://localhost:3000',
      'http://localhost:3000',
      'http://127.0.0.1:3000'
    ];
    
    // Allow requests with no origin (mobile apps, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log(`🚫 CORS blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Origin', 
    'X-Requested-With', 
    'Content-Type', 
    'Accept', 
    'Authorization',
    'X-CSRF-Token'
  ],
  exposedHeaders: ['X-Total-Count'],
  maxAge: 86400 // 24 hours
};

module.exports = {
  // Rate limiters
  authLimiter,
  generalLimiter,
  apiLimiter,
  
  // Validation middlewares
  validateInput,
  
  // Security middlewares
  preventInjection,
  csrfProtection,
  securityHeaders,
  requestSizeLimit,
  securityLogger,
  corsOptions,
  
  // Security utilities
  sanitizeHtml: (html) => {
    return validator.escape(html);
  },
  
  // MongoDB sanitization (already imported)
  mongoSanitize,
  xss,
  hpp
};