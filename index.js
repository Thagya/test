// index.js - Enhanced Security Implementation
const express = require("express");
const cors = require("cors");
const compression = require('compression');
require("dotenv").config();

const connectDB = require("./config/db");

// Import security middleware
const {
  authLimiter,
  generalLimiter,
  apiLimiter,
  preventInjection,
  csrfProtection,
  securityHeaders,
  requestSizeLimit,
  securityLogger,
  corsOptions,
  mongoSanitize,
  xss,
  hpp
} = require('./middleware/securityMiddleware');

// Route imports
const authRoutes = require("./routes/authRoutes");
const productRoutes = require("./routes/productRoutes");
const cartRoutes = require("./routes/cartRoutes");
const paymentRoutes = require("./routes/paymentRoutes");

const app = express();

// Connect to MongoDB
connectDB();

// ========================================
// SECURITY MIDDLEWARE STACK
// ========================================

// 1. Security Headers (Helmet) - Must be first
app.use(securityHeaders);

// 2. Compression (helps with performance)
app.use(compression());

// 3. Request logging and monitoring
app.use(securityLogger);

// 4. Request size limiting
app.use(requestSizeLimit);

// 5. Enhanced CORS
app.use(cors(corsOptions));

// 6. Rate limiting (general)
app.use('/api', generalLimiter);

// 7. Body parsing with limits
app.use(express.json({ 
  limit: '10mb',
  verify: (req, res, buf) => {
    // Store raw body for webhook verification
    if (req.originalUrl.includes('/payments/webhook')) {
      req.rawBody = buf;
    }
  }
}));
app.use(express.urlencoded({ 
  extended: true, 
  limit: '10mb' 
}));

// 8. MongoDB Injection Prevention
app.use(mongoSanitize({
  replaceWith: '_',
  onSanitize: ({ req, key }) => {
    console.log(`⚠️ MongoDB injection attempt blocked: ${key} from IP: ${req.ip}`);
  }
}));

// 9. XSS Protection
app.use(xss());

// 10. HTTP Parameter Pollution Protection
app.use(hpp({
  whitelist: ['category', 'price', 'sort'] // Allow duplicate values for these parameters
}));

// 11. General injection prevention
app.use(preventInjection);

// 12. CSRF Protection
app.use(csrfProtection);

// ========================================
// ROUTES WITH SPECIFIC RATE LIMITING
// ========================================

// Authentication routes with stricter rate limiting
app.use("/api/auth", authLimiter, authRoutes);

// API routes with standard rate limiting
app.use("/api/products", apiLimiter, productRoutes);
app.use("/api/cart", apiLimiter, cartRoutes);
app.use("/api/payments", paymentRoutes); // Payments handle their own rate limiting

// ========================================
// UTILITY ROUTES
// ========================================

// Health check route (no rate limiting)
app.get("/api/health", (req, res) => {
  res.json({ 
    message: "🛡️ Secure EcoStore API is running!",
    timestamp: new Date().toISOString(),
    version: "2.0.0-secure",
    security: {
      helmet: "✅ Enabled",
      rateLimit: "✅ Enabled", 
      mongoSanitize: "✅ Enabled",
      xssProtection: "✅ Enabled",
      parameterPollution: "✅ Enabled",
      cors: "✅ Configured",
      inputValidation: "✅ Enabled"
    }
  });
});

// Security test endpoint (for development)
if (process.env.NODE_ENV === 'development') {
  app.get("/api/security-test", (req, res) => {
    res.json({
      message: "Security test endpoint",
      headers: {
        userAgent: req.headers['user-agent'],
        origin: req.headers.origin,
        xRequestedWith: req.headers['x-requested-with'],
        authorization: req.headers.authorization ? 'Bearer [REDACTED]' : 'None'
      },
      ip: req.ip,
      secure: req.secure,
      protocol: req.protocol
    });
  });
}

// ========================================
// ERROR HANDLING
// ========================================

// MongoDB connection error handler
process.on('unhandledRejection', (err) => {
  console.error('🚨 Unhandled Promise Rejection:', err);
  process.exit(1);
});

// Global error handling middleware
app.use((err, req, res, next) => {
  // Log error details securely
  console.error(`🚨 Global Error Handler:`, {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    url: req.url,
    method: req.method,
    ip: req.ip,
    timestamp: new Date().toISOString()
  });

  // Handle specific error types
  if (err.name === 'ValidationError') {
    return res.status(400).json({ 
      error: 'Validation failed',
      message: process.env.NODE_ENV === 'development' ? err.message : 'Invalid input data'
    });
  }

  if (err.name === 'CastError') {
    return res.status(400).json({ 
      error: 'Invalid ID format',
      message: 'Please provide a valid ID'
    });
  }

  if (err.code === 11000) {
    return res.status(409).json({ 
      error: 'Duplicate entry',
      message: 'Resource already exists'
    });
  }

  // Rate limiting errors
  if (err.status === 429) {
    return res.status(429).json({ 
      error: 'Too many requests',
      message: 'Please try again later'
    });
  }

  // CORS errors
  if (err.message && err.message.includes('CORS')) {
    return res.status(403).json({ 
      error: 'CORS policy violation',
      message: 'Origin not allowed'
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ 
      error: 'Authentication failed',
      message: 'Invalid token'
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ 
      error: 'Authentication failed',
      message: 'Token expired'
    });
  }

  // Default error response
  res.status(err.status || 500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' 
      ? err.message 
      : 'Something went wrong on our end',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Handle 404 routes
app.use("*", (req, res) => {
  console.log(`🔍 404 - Route not found: ${req.method} ${req.originalUrl} from IP: ${req.ip}`);
  res.status(404).json({ 
    error: "Route not found",
    message: `Cannot ${req.method} ${req.originalUrl}`,
    availableRoutes: [
      'GET /api/health',
      'POST /api/auth/register',
      'POST /api/auth/login',
      'GET /api/products',
      'GET /api/cart',
      'POST /api/payments/create-checkout-session'
    ]
  });
});

// ========================================
// SERVER STARTUP
// ========================================

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`🚀 Secure EcoStore API running on port ${PORT}`);
  console.log(`🛡️ Security features enabled:`);
  console.log(`   ✅ Helmet security headers`);
  console.log(`   ✅ Rate limiting`);
  console.log(`   ✅ Input validation & sanitization`);
  console.log(`   ✅ XSS protection`);
  console.log(`   ✅ MongoDB injection prevention`);
  console.log(`   ✅ CORS configuration`);
  console.log(`   ✅ Request size limiting`);
  console.log(`   ✅ Security logging`);
  console.log(`📝 Health check: http://localhost:${PORT}/api/health`);
  
  if (process.env.NODE_ENV === 'development') {
    console.log(`🧪 Security test: http://localhost:${PORT}/api/security-test`);
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('💤 Process terminated');
  });
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('💤 Process terminated');
  });
});

module.exports = app;