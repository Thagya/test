// routes/productRoutes.js - Enhanced with Security Validations
const express = require("express");
const rateLimit = require('express-rate-limit');
const router = express.Router();

const {
  getProducts,
  getProductById,
  addProduct,
  updateProduct,
  deleteProduct,
  searchProducts,
  getProductsByCategory,
} = require("../controllers/productController");

const { verifyToken } = require("../middleware/authMiddleware");
const { isAdmin } = require("../middleware/adminMiddleware");
const { validateInput } = require("../middleware/securityMiddleware");

// ========================================
// SPECIFIC RATE LIMITERS FOR PRODUCT ROUTES
// ========================================

// Rate limiting for product creation/modification (admin operations)
const adminProductLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 operations per minute
  message: { 
    error: 'Too many product operations, please try again later' 
  },
  handler: (req, res) => {
    console.log(`⚠️ Admin product operation rate limit exceeded for user: ${req.user?.username}`);
    res.status(429).json({ 
      error: 'Operation limit exceeded',
      message: 'Too many product operations. Try again in a minute.'
    });
  }
});

// Rate limiting for search operations
const searchLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 searches per minute
  message: { 
    error: 'Too many search requests, please try again later' 
  },
  handler: (req, res) => {
    console.log(`🔍 Search rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({ 
      error: 'Search limit exceeded',
      message: 'Too many search requests. Try again in a minute.'
    });
  }
});

// ========================================
// ADDITIONAL SECURITY MIDDLEWARE
// ========================================

// Validate MongoDB ObjectId format
const validateObjectId = (req, res, next) => {
  const { id } = req.params;
  if (id && !/^[0-9a-fA-F]{24}$/.test(id)) {
    return res.status(400).json({ 
      error: 'Invalid ID format',
      message: 'Please provide a valid product ID'
    });
  }
  next();
};

// Enhanced product data validation
const validateProductData = (req, res, next) => {
  const { name, description, price, category, image, stock } = req.body;
  const errors = [];

  // Name validation
  if (name !== undefined) {
    if (!name || typeof name !== 'string') {
      errors.push('Product name is required and must be a string');
    } else if (name.trim().length < 1 || name.trim().length > 100) {
      errors.push('Product name must be 1-100 characters long');
    } else if (!/^[a-zA-Z0-9\s\-_.,()&]+$/.test(name.trim())) {
      errors.push('Product name contains invalid characters');
    }
  }

  // Description validation
  if (description !== undefined) {
    if (!description || typeof description !== 'string') {
      errors.push('Product description is required and must be a string');
    } else if (description.trim().length < 1 || description.trim().length > 1000) {
      errors.push('Product description must be 1-1000 characters long');
    }
  }

  // Price validation
  if (price !== undefined) {
    const numPrice = Number(price);
    if (isNaN(numPrice) || numPrice <= 0 || numPrice > 999999) {
      errors.push('Price must be a valid number between 0.01 and 999999');
    }
  }

  // Stock validation
  if (stock !== undefined) {
    const numStock = Number(stock);
    if (isNaN(numStock) || numStock < 0 || numStock > 999999 || !Number.isInteger(numStock)) {
      errors.push('Stock must be a valid integer between 0 and 999999');
    }
  }

  // Category validation
  const validCategories = ['Eco Bags', 'Water Bottles', 'Reusable Items', 'Solar Products', 'Organic', 'General'];
  if (category !== undefined && !validCategories.includes(category)) {
    errors.push(`Category must be one of: ${validCategories.join(', ')}`);
  }

  // Image validation (basic)
  if (image !== undefined && image !== '') {
    if (typeof image !== 'string') {
      errors.push('Image must be a string (URL or base64)');
    } else if (image.length > 5000000) { // ~5MB limit for base64
      errors.push('Image data too large (max 5MB)');
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({ 
      error: 'Validation failed',
      details: errors
    });
  }

  next();
};

// Search query validation
const validateSearchQuery = (req, res, next) => {
  const { q } = req.query;
  
  if (!q) {
    return res.status(400).json({ 
      error: 'Search query required',
      message: 'Please provide a search query parameter (?q=your-search-term)'
    });
  }

  if (typeof q !== 'string' || q.trim().length < 1) {
    return res.status(400).json({ 
      error: 'Invalid search query',
      message: 'Search query must be a non-empty string'
    });
  }

  if (q.length > 100) {
    return res.status(400).json({ 
      error: 'Search query too long',
      message: 'Search query must be less than 100 characters'
    });
  }

  // Check for suspicious patterns
  const suspiciousPatterns = [
    /(\$where|\$ne|\$in|\$nin|\$gt|\$gte|\$lt|\$lte)/i,
    /(javascript:|vbscript:|onload|onerror)/i,
    /(<script|<\/script|<iframe|<\/iframe)/i,
    /(union|select|drop|delete|insert|update|create|alter)/i
  ];

  for (const pattern of suspiciousPatterns) {
    if (pattern.test(q)) {
      console.log(`🚫 Suspicious search query detected: "${q}" from IP: ${req.ip}`);
      return res.status(400).json({ 
        error: 'Invalid search query',
        message: 'Search query contains invalid characters'
      });
    }
  }

  // Sanitize the search query
  req.query.q = q.trim().replace(/[<>'"]/g, '');
  next();
};

// Category validation
const validateCategory = (req, res, next) => {
  const { category } = req.params;
  const validCategories = ['Eco Bags', 'Water Bottles', 'Reusable Items', 'Solar Products', 'Organic', 'General'];
  
  if (!validCategories.includes(category)) {
    return res.status(400).json({ 
      error: 'Invalid category',
      message: `Category must be one of: ${validCategories.join(', ')}`,
      availableCategories: validCategories
    });
  }
  
  next();
};

// ========================================
// PUBLIC ROUTES
// ========================================

// Get all products with optional filtering and pagination
router.get("/", 
  (req, res, next) => {
    // Add pagination and filtering validation
    const { page, limit, sort, minPrice, maxPrice } = req.query;
    
    if (page && (isNaN(page) || page < 1 || page > 1000)) {
      return res.status(400).json({ 
        error: 'Invalid page number',
        message: 'Page must be a number between 1 and 1000'
      });
    }
    
    if (limit && (isNaN(limit) || limit < 1 || limit > 100)) {
      return res.status(400).json({ 
        error: 'Invalid limit',
        message: 'Limit must be a number between 1 and 100'
      });
    }

    if (sort && !['name', 'price', 'createdAt', '-name', '-price', '-createdAt'].includes(sort)) {
      return res.status(400).json({ 
        error: 'Invalid sort parameter',
        message: 'Sort must be one of: name, price, createdAt (use - for descending)'
      });
    }

    if (minPrice && (isNaN(minPrice) || minPrice < 0)) {
      return res.status(400).json({ 
        error: 'Invalid minimum price',
        message: 'Minimum price must be a non-negative number'
      });
    }

    if (maxPrice && (isNaN(maxPrice) || maxPrice < 0)) {
      return res.status(400).json({ 
        error: 'Invalid maximum price',
        message: 'Maximum price must be a non-negative number'
      });
    }

    if (minPrice && maxPrice && parseFloat(minPrice) > parseFloat(maxPrice)) {
      return res.status(400).json({ 
        error: 'Invalid price range',
        message: 'Minimum price cannot be greater than maximum price'
      });
    }

    next();
  },
  getProducts
);

// Search products with validation and rate limiting
router.get("/search", 
  searchLimiter,
  validateSearchQuery,
  searchProducts
);

// Get products by category
router.get("/category/:category", 
  validateCategory,
  getProductsByCategory
);

// Get product by ID with validation
router.get("/:id", 
  validateObjectId,
  getProductById
);

// ========================================
// ADMIN ONLY ROUTES (PROTECTED)
// ========================================

// Add new product with comprehensive validation
router.post("/", 
  verifyToken, 
  isAdmin, 
  adminProductLimiter,
  validateProductData,
  (req, res, next) => {
    // Log admin product creation
    console.log(`📦 Admin creating product: ${req.body.name} by user: ${req.user.username}`);
    next();
  },
  addProduct
);

// Update product with validation
router.put("/:id", 
  verifyToken, 
  isAdmin, 
  adminProductLimiter,
  validateObjectId,
  validateProductData,
  (req, res, next) => {
    // Log admin product update
    console.log(`✏️ Admin updating product ID: ${req.params.id} by user: ${req.user.username}`);
    next();
  },
  updateProduct
);

// Delete product with additional confirmation
router.delete("/:id", 
  verifyToken, 
  isAdmin, 
  adminProductLimiter,
  validateObjectId,
  (req, res, next) => {
    // Log admin product deletion
    console.log(`🗑️ Admin deleting product ID: ${req.params.id} by user: ${req.user.username}`);
    
    // Additional security check for deletion
    const confirmDelete = req.headers['x-confirm-delete'];
    if (confirmDelete !== 'true') {
      return res.status(400).json({ 
        error: 'Deletion confirmation required',
        message: 'Please include X-Confirm-Delete: true header to confirm deletion'
      });
    }
    
    next();
  },
  deleteProduct
);

// ========================================
// ADMIN UTILITY ROUTES
// ========================================

// Get product statistics (admin only)
router.get("/admin/statistics", 
  verifyToken, 
  isAdmin,
  async (req, res) => {
    try {
      const Product = require("../models/Product");
      
      const totalProducts = await Product.countDocuments();
      const lowStockProducts = await Product.countDocuments({ stock: { $lte: 10, $gt: 0 } });
      const outOfStockProducts = await Product.countDocuments({ stock: 0 });
      
      const categoryStats = await Product.aggregate([
        { $group: { _id: "$category", count: { $sum: 1 }, avgPrice: { $avg: "$price" } } },
        { $sort: { count: -1 } }
      ]);

      res.json({
        totalProducts,
        lowStockProducts,
        outOfStockProducts,
        inStockProducts: totalProducts - outOfStockProducts,
        categoryStatistics: categoryStats,
        generatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Product statistics error:', error);
      res.status(500).json({ 
        error: 'Failed to generate statistics',
        message: 'Unable to fetch product statistics'
      });
    }
  }
);

// Bulk operations endpoint (admin only)
router.post("/admin/bulk-update", 
  verifyToken, 
  isAdmin,
  rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 5, // 5 bulk operations per 5 minutes
    message: { error: 'Too many bulk operations, please try again later' }
  }),
  (req, res) => {
    // Placeholder for bulk operations
    console.log(`🔄 Bulk operation requested by admin: ${req.user.username}`);
    res.json({ 
      message: 'Bulk operations endpoint',
      note: 'This endpoint is reserved for future bulk operations implementation'
    });
  }
);

module.exports = router;