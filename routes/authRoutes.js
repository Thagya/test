// routes/authRoutes.js - Enhanced with Security Validations
const express = require("express");
const rateLimit = require('express-rate-limit');
const router = express.Router();

const { 
  register, 
  login, 
  getProfile, 
  updateProfile, 
  changePassword, 
  createAdmin   
} = require("../controllers/authController");

const { verifyToken } = require("../middleware/authMiddleware");
const { validateInput } = require("../middleware/securityMiddleware");

// ========================================
// SPECIFIC RATE LIMITERS FOR AUTH ROUTES
// ========================================

// Strict rate limiting for login attempts
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: { 
    error: 'Too many login attempts, please try again in 15 minutes',
    retryAfter: 15 * 60 
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    console.log(`🔒 Login rate limit exceeded for IP: ${req.ip}, Username: ${req.body?.username}`);
    res.status(429).json({ 
      error: 'Too many login attempts',
      message: 'Account temporarily locked. Try again in 15 minutes.',
      retryAfter: 15 * 60
    });
  },
  // Skip successful requests
  skipSuccessfulRequests: true,
  // Skip failed requests after max attempts
  skipFailedRequests: false
});

// Rate limiting for registration
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 registrations per hour per IP
  message: { 
    error: 'Too many registration attempts, please try again later' 
  },
  handler: (req, res) => {
    console.log(`📝 Registration rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({ 
      error: 'Registration limit exceeded',
      message: 'Too many accounts created from this IP. Try again in 1 hour.'
    });
  }
});

// Rate limiting for password changes
const passwordChangeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3, // 3 password changes per 15 minutes
  message: { 
    error: 'Too many password change attempts, please try again later' 
  },
  handler: (req, res) => {
    console.log(`🔑 Password change rate limit exceeded for user: ${req.user?.username}`);
    res.status(429).json({ 
      error: 'Password change limit exceeded',
      message: 'Too many password change attempts. Try again in 15 minutes.'
    });
  }
});

// ========================================
// ADDITIONAL SECURITY MIDDLEWARE
// ========================================

// Account lockout tracking (in production, use Redis or database)
const accountLockouts = new Map();

const checkAccountLockout = (req, res, next) => {
  const { username } = req.body;
  if (!username) return next();

  const lockoutInfo = accountLockouts.get(username);
  if (lockoutInfo && lockoutInfo.lockedUntil > Date.now()) {
    const minutesLeft = Math.ceil((lockoutInfo.lockedUntil - Date.now()) / (60 * 1000));
    console.log(`🔒 Account locked: ${username}, Minutes left: ${minutesLeft}`);
    return res.status(423).json({
      error: 'Account temporarily locked',
      message: `Account locked due to multiple failed login attempts. Try again in ${minutesLeft} minutes.`
    });
  }

  next();
};

const trackFailedLogin = (req, res, next) => {
  const { username } = req.body;
  if (!username) return next();

  // Intercept the response to check for failed login
  const originalSend = res.send;
  res.send = function(data) {
    const response = typeof data === 'string' ? JSON.parse(data) : data;
    
    if (res.statusCode === 401 && response.error === 'Invalid credentials') {
      let lockoutInfo = accountLockouts.get(username) || { attempts: 0, lockedUntil: 0 };
      lockoutInfo.attempts += 1;
      
      // Lock account after 5 failed attempts
      if (lockoutInfo.attempts >= 5) {
        lockoutInfo.lockedUntil = Date.now() + (30 * 60 * 1000); // 30 minutes
        console.log(`🔒 Account locked: ${username} after ${lockoutInfo.attempts} failed attempts`);
      }
      
      accountLockouts.set(username, lockoutInfo);
    } else if (res.statusCode === 200 && response.token) {
      // Clear failed attempts on successful login
      accountLockouts.delete(username);
    }
    
    originalSend.call(this, data);
  };

  next();
};

// ========================================
// PUBLIC ROUTES
// ========================================

// Registration with validation and rate limiting
router.post("/register", 
  registerLimiter,
  validateInput.validateAuth,
  register
);

// Login with validation, rate limiting, and account lockout protection
router.post("/login", 
  loginLimiter,
  checkAccountLockout,
  validateInput.validateAuth,
  trackFailedLogin,
  login
);

// Admin creation (should be removed in production or protected by additional auth)
router.post("/create-admin", 
  registerLimiter, // Use same rate limiting as register
  validateInput.validateAuth,
  (req, res, next) => {
    // Additional security check for admin creation
    const allowAdminCreation = process.env.ALLOW_ADMIN_CREATION === 'true';
    if (!allowAdminCreation) {
      console.log(`🚫 Admin creation attempt blocked from IP: ${req.ip}`);
      return res.status(403).json({ 
        error: 'Admin creation disabled',
        message: 'Admin creation is not allowed in this environment'
      });
    }
    next();
  },
  createAdmin
);

// ========================================
// PROTECTED ROUTES
// ========================================

// Profile management with additional validation
router.get("/profile", 
  verifyToken, 
  getProfile
);

router.put("/profile", 
  verifyToken,
  (req, res, next) => {
    // Validate profile update data
    const { username } = req.body;
    if (username) {
      if (username.length < 3 || username.length > 20) {
        return res.status(400).json({ 
          error: 'Username must be 3-20 characters long' 
        });
      }
      if (!/^[a-zA-Z0-9]+$/.test(username)) {
        return res.status(400).json({ 
          error: 'Username must contain only letters and numbers' 
        });
      }
    }
    next();
  },
  updateProfile
);

// Password change with rate limiting
router.put("/change-password", 
  verifyToken,
  passwordChangeLimiter,
  (req, res, next) => {
    // Additional password validation
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ 
        error: 'Current password and new password are required' 
      });
    }

    if (newPassword.length < 6 || newPassword.length > 100) {
      return res.status(400).json({ 
        error: 'New password must be 6-100 characters long' 
      });
    }

    // Check if new password is different from current
    if (currentPassword === newPassword) {
      return res.status(400).json({ 
        error: 'New password must be different from current password' 
      });
    }

    // Basic password strength check
    const hasUpper = /[A-Z]/.test(newPassword);
    const hasLower = /[a-z]/.test(newPassword);
    const hasNumber = /\d/.test(newPassword);
    
    if (newPassword.length >= 8 && !(hasUpper && hasLower && hasNumber)) {
      // Not enforcing strong password, but logging weak ones
      console.log(`⚠️ Weak password set by user: ${req.user.username}`);
    }

    next();
  },
  changePassword
);

// ========================================
// UTILITY ROUTES FOR SECURITY
// ========================================

// Check if username is available (with rate limiting)
router.get("/check-username/:username", 
  rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 10, // 10 checks per minute
    message: { error: 'Too many username checks, please try again later' }
  }),
  async (req, res) => {
    try {
      const { username } = req.params;
      
      // Validate username format
      if (!username || username.length < 3 || username.length > 20) {
        return res.status(400).json({ 
          error: 'Invalid username format',
          available: false 
        });
      }

      if (!/^[a-zA-Z0-9]+$/.test(username)) {
        return res.status(400).json({ 
          error: 'Username must contain only letters and numbers',
          available: false 
        });
      }

      const User = require("../models/User");
      const existingUser = await User.findOne({ username });
      
      res.json({ 
        available: !existingUser,
        username: username
      });
    } catch (err) {
      console.error('Username check error:', err);
      res.status(500).json({ 
        error: 'Failed to check username availability',
        available: false 
      });
    }
  }
);

// Logout endpoint (mainly for logging purposes)
router.post("/logout", 
  verifyToken,
  (req, res) => {
    console.log(`👋 User logged out: ${req.user.username} from IP: ${req.ip}`);
    res.json({ 
      message: 'Logged out successfully',
      timestamp: new Date().toISOString()
    });
  }
);

// Security status endpoint
router.get("/security-status", 
  verifyToken,
  (req, res) => {
    const lockoutInfo = accountLockouts.get(req.user.username);
    res.json({
      username: req.user.username,
      role: req.user.role,
      accountLocked: lockoutInfo && lockoutInfo.lockedUntil > Date.now(),
      lastLogin: new Date().toISOString(), // In production, store this in database
      securityFeatures: {
        rateLimiting: 'active',
        accountLockout: 'active',
        inputValidation: 'active',
        secureHeaders: 'active'
      }
    });
  }
);

module.exports = router;