// routes/cartRoutes.js - Enhanced with Security Validations
const express = require("express");
const rateLimit = require('express-rate-limit');
const router = express.Router();

const {
  createCart,
  addToCart,
  getCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  getCartSummary
} = require("../controllers/cartController");

const { verifyToken } = require("../middleware/authMiddleware");
const { validateInput } = require("../middleware/securityMiddleware");

// ========================================
// SPECIFIC RATE LIMITERS FOR CART ROUTES
// ========================================

// Rate limiting for cart modifications
const cartModifyLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20, // 20 modifications per minute
  message: { 
    error: 'Too many cart modifications, please try again later' 
  },
  handler: (req, res) => {
    console.log(`🛒 Cart modification rate limit exceeded for user: ${req.user?.username}`);
    res.status(429).json({ 
      error: 'Cart operation limit exceeded',
      message: 'Too many cart modifications. Please try again in a minute.'
    });
  }
});

// Rate limiting for cart clearing (more restrictive)
const cartClearLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 5, // 5 clear operations per 5 minutes
  message: { 
    error: 'Too many cart clear attempts, please try again later' 
  },
  handler: (req, res) => {
    console.log(`🗑️ Cart clear rate limit exceeded for user: ${req.user?.username}`);
    res.status(429).json({ 
      error: 'Cart clear limit exceeded',
      message: 'Too many cart clear attempts. Please try again in 5 minutes.'
    });
  }
});

// ========================================
// ADDITIONAL SECURITY MIDDLEWARE
// ========================================

// Validate MongoDB ObjectId format for cart operations
const validateObjectId = (req, res, next) => {
  const { id } = req.params;
  const { cartId, productId } = req.body;
  
  if (id && !/^[0-9a-fA-F]{24}$/.test(id)) {
    return res.status(400).json({ 
      error: 'Invalid ID format',
      message: 'Please provide a valid cart item ID'
    });
  }
  
  if (cartId && !/^[0-9a-fA-F]{24}$/.test(cartId)) {
    return res.status(400).json({ 
      error: 'Invalid cart ID format',
      message: 'Please provide a valid cart ID'
    });
  }
  
  if (productId && !/^[0-9a-fA-F]{24}$/.test(productId)) {
    return res.status(400).json({ 
      error: 'Invalid product ID format',
      message: 'Please provide a valid product ID'
    });
  }
  
  next();
};

// Enhanced cart data validation
const validateCartData = (req, res, next) => {
  const { productId, quantity, cartId } = req.body;
  const errors = [];

  // Product ID validation (for add to cart operations)
  if (req.method === 'POST' && req.path === '/items') {
    if (!productId) {
      errors.push('Product ID is required');
    }
  }

  // Quantity validation
  if (quantity !== undefined) {
    const numQuantity = Number(quantity);
    if (isNaN(numQuantity) || numQuantity < 1 || numQuantity > 999 || !Number.isInteger(numQuantity)) {
      errors.push('Quantity must be a valid integer between 1 and 999');
    }
  }

  // Cart ID validation (optional for some operations)
  if (cartId && typeof cartId !== 'string') {
    errors.push('Cart ID must be a string');
  }

  if (errors.length > 0) {
    return res.status(400).json({ 
      error: 'Validation failed',
      details: errors
    });
  }

  next();
};

// Ownership validation - ensure user can only access their own cart
const validateCartOwnership = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { cartId } = req.body || {};
    const { id: itemId } = req.params || {};

    // If cartId is provided, verify ownership
    if (cartId) {
      const Cart = require("../models/Cart");
      const cart = await Cart.findOne({ _id: cartId, user: userId });
      if (!cart) {
        console.log(`🚫 Unauthorized cart access attempt: User ${req.user.username} tried to access cart ${cartId}`);
        return res.status(403).json({ 
          error: 'Access denied',
          message: 'You can only access your own cart'
        });
      }
    }

    // If item ID is provided (for update/delete operations), verify ownership
    if (itemId) {
      const Cart = require("../models/Cart");
      const cart = await Cart.findOne({ "items._id": itemId, user: userId });
      if (!cart) {
        console.log(`🚫 Unauthorized cart item access attempt: User ${req.user.username} tried to access item ${itemId}`);
        return res.status(403).json({ 
          error: 'Access denied',
          message: 'You can only modify your own cart items'
        });
      }
    }

    next();
  } catch (error) {
    console.error('Cart ownership validation error:', error);
    res.status(500).json({ 
      error: 'Validation failed',
      message: 'Unable to verify cart ownership'
    });
  }
};

// Product existence and stock validation
const validateProductExists = async (req, res, next) => {
  try {
    const { productId, quantity } = req.body;
    
    if (!productId) return next();

    const Product = require("../models/Product");
    const product = await Product.findById(productId);
    
    if (!product) {
      return res.status(404).json({ 
        error: 'Product not found',
        message: 'The requested product does not exist'
      });
    }

    // Check if product is available (stock > 0)
    if (product.stock === 0) {
      return res.status(400).json({ 
        error: 'Product out of stock',
        message: `${product.name} is currently out of stock`
      });
    }

    // Check if requested quantity is available
    if (quantity && product.stock < quantity) {
      return res.status(400).json({ 
        error: 'Insufficient stock',
        message: `Only ${product.stock} items available for ${product.name}`
      });
    }

    // Add product info to request for use in controller
    req.productInfo = {
      id: product._id,
      name: product.name,
      price: product.price,
      stock: product.stock
    };

    next();
  } catch (error) {
    console.error('Product validation error:', error);
    res.status(500).json({ 
      error: 'Validation failed',
      message: 'Unable to validate product'
    });
  }
};

// Cart size limitation
const validateCartSize = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const Cart = require("../models/Cart");
    
    const cart = await Cart.findOne({ user: userId });
    
    // Limit cart to maximum 50 different items
    if (cart && cart.items.length >= 50) {
      const { productId } = req.body;
      // Check if it's adding a new product or updating existing
      const existingItem = cart.items.find(item => item.product.toString() === productId);
      
      if (!existingItem && req.method === 'POST' && req.path === '/items') {
        return res.status(400).json({ 
          error: 'Cart limit exceeded',
          message: 'You can have maximum 50 different items in your cart'
        });
      }
    }

    next();
  } catch (error) {
    console.error('Cart size validation error:', error);
    next(); // Continue even if validation fails
  }
};

// ========================================
// ALL CART ROUTES REQUIRE AUTHENTICATION
// ========================================
router.use(verifyToken);

// ========================================
// CART MANAGEMENT ROUTES
// ========================================

// Create new cart
router.post("/", 
  cartModifyLimiter,
  (req, res, next) => {
    console.log(`📦 Creating cart for user: ${req.user.username}`);
    next();
  },
  createCart
);

// Get cart items with pagination support
router.get("/", 
  (req, res, next) => {
    // Add pagination validation for large carts
    const { page, limit } = req.query;
    
    if (page && (isNaN(page) || page < 1 || page > 100)) {
      return res.status(400).json({ 
        error: 'Invalid page number',
        message: 'Page must be a number between 1 and 100'
      });
    }
    
    if (limit && (isNaN(limit) || limit < 1 || limit > 50)) {
      return res.status(400).json({ 
        error: 'Invalid limit',
        message: 'Limit must be a number between 1 and 50'
      });
    }

    next();
  },
  getCart
);

// Clear cart with confirmation
router.delete("/:cartId?", 
  cartClearLimiter,
  validateObjectId,
  validateCartOwnership,
  (req, res, next) => {
    // Require confirmation for cart clearing
    const confirmClear = req.headers['x-confirm-clear'];
    if (confirmClear !== 'true') {
      return res.status(400).json({ 
        error: 'Confirmation required',
        message: 'Please include X-Confirm-Clear: true header to confirm cart clearing'
      });
    }
    
    console.log(`🗑️ Clearing cart for user: ${req.user.username}`);
    next();
  },
  clearCart
);

// Get cart summary
router.get("/summary", 
  getCartSummary
);

// ========================================
// CART ITEMS MANAGEMENT ROUTES
// ========================================

// Add item to cart with comprehensive validation
router.post("/items", 
  cartModifyLimiter,
  validateObjectId,
  validateCartData,
  validateProductExists,
  validateCartSize,
  (req, res, next) => {
    console.log(`➕ Adding item to cart: ${req.productInfo?.name} (${req.body.quantity}) for user: ${req.user.username}`);
    next();
  },
  addToCart
);

// Update cart item quantity
router.put("/items/:id", 
  cartModifyLimiter,
  validateObjectId,
  validateCartData,
  validateCartOwnership,
  async (req, res, next) => {
    try {
      // Additional validation for stock when updating quantity
      const { quantity } = req.body;
      if (quantity) {
        const Cart = require("../models/Cart");
        const cart = await Cart.findOne({ "items._id": req.params.id }).populate("items.product");
        
        if (cart) {
          const item = cart.items.id(req.params.id);
          if (item && item.product && item.product.stock < quantity) {
            return res.status(400).json({ 
              error: 'Insufficient stock',
              message: `Only ${item.product.stock} items available for ${item.product.name}`
            });
          }
        }
      }
      
      console.log(`✏️ Updating cart item: ${req.params.id} to quantity ${quantity} for user: ${req.user.username}`);
      next();
    } catch (error) {
      console.error('Cart item update validation error:', error);
      next();
    }
  },
  updateCartItem
);

// Remove item from cart
router.delete("/items/:id", 
  cartModifyLimiter,
  validateObjectId,
  validateCartOwnership,
  (req, res, next) => {
    console.log(`➖ Removing cart item: ${req.params.id} for user: ${req.user.username}`);
    next();
  },
  removeFromCart
);

// ========================================
// UTILITY ROUTES
// ========================================

// Validate cart before checkout (useful for frontend)
router.post("/validate", 
  async (req, res) => {
    try {
      const userId = req.user.id;
      const Cart = require("../models/Cart");
      
      const cart = await Cart.findOne({ user: userId }).populate("items.product");
      
      if (!cart || cart.items.length === 0) {
        return res.json({ 
          valid: false,
          message: 'Cart is empty'
        });
      }

      const issues = [];
      const validItems = [];

      for (const item of cart.items) {
        if (!item.product) {
          issues.push(`Product no longer exists`);
          continue;
        }

        if (item.product.stock === 0) {
          issues.push(`${item.product.name} is out of stock`);
        } else if (item.product.stock < item.quantity) {
          issues.push(`Only ${item.product.stock} ${item.product.name} available (you have ${item.quantity})`);
        } else {
          validItems.push(item);
        }
      }

      const totalPrice = validItems.reduce((sum, item) => 
        sum + (item.product.price * item.quantity), 0
      );

      res.json({
        valid: issues.length === 0,
        totalItems: cart.items.length,
        validItems: validItems.length,
        totalPrice: Math.round(totalPrice * 100) / 100,
        issues: issues.length > 0 ? issues : undefined,
        message: issues.length === 0 ? 'Cart is valid for checkout' : 'Cart has issues that need to be resolved'
      });

    } catch (error) {
      console.error('Cart validation error:', error);
      res.status(500).json({ 
        valid: false,
        error: 'Failed to validate cart'
      });
    }
  }
);

// Get cart statistics for user
router.get("/statistics", 
  async (req, res) => {
    try {
      const userId = req.user.id;
      const Cart = require("../models/Cart");
      
      const cart = await Cart.findOne({ user: userId }).populate("items.product");
      
      if (!cart) {
        return res.json({
          totalItems: 0,
          totalValue: 0,
          uniqueProducts: 0,
          categories: []
        });
      }

      const validItems = cart.items.filter(item => item.product);
      const totalItems = validItems.reduce((sum, item) => sum + item.quantity, 0);
      const totalValue = validItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
      
      const categories = [...new Set(validItems.map(item => item.product.category))];
      const categoryStats = categories.map(category => {
        const categoryItems = validItems.filter(item => item.product.category === category);
        return {
          category,
          itemCount: categoryItems.length,
          totalQuantity: categoryItems.reduce((sum, item) => sum + item.quantity, 0),
          totalValue: categoryItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0)
        };
      });

      res.json({
        totalItems,
        totalValue: Math.round(totalValue * 100) / 100,
        uniqueProducts: validItems.length,
        categories: categoryStats,
        averageItemPrice: validItems.length > 0 ? Math.round((totalValue / totalItems) * 100) / 100 : 0,
        lastUpdated: cart.updatedAt
      });

    } catch (error) {
      console.error('Cart statistics error:', error);
      res.status(500).json({ 
        error: 'Failed to generate cart statistics'
      });
    }
  }
);

// Emergency cart backup (in case of issues)
router.post("/backup", 
  rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5, // 5 backups per hour
    message: { error: 'Too many backup requests, please try again later' }
  }),
  async (req, res) => {
    try {
      const userId = req.user.id;
      const Cart = require("../models/Cart");
      
      const cart = await Cart.findOne({ user: userId }).populate("items.product");
      
      if (!cart) {
        return res.status(404).json({ 
          error: 'Cart not found'
        });
      }

      // Create a simplified backup object
      const backup = {
        userId: userId,
        items: cart.items.map(item => ({
          productId: item.product ? item.product._id : null,
          productName: item.product ? item.product.name : 'Unknown Product',
          quantity: item.quantity,
          priceAtTime: item.product ? item.product.price : 0
        })),
        createdAt: cart.createdAt,
        backedUpAt: new Date().toISOString()
      };

      console.log(`💾 Cart backup created for user: ${req.user.username}`);

      res.json({
        message: 'Cart backup created successfully',
        backup: backup,
        instructions: 'Save this backup data for your records. Contact support if you need to restore your cart.'
      });

    } catch (error) {
      console.error('Cart backup error:', error);
      res.status(500).json({ 
        error: 'Failed to create cart backup'
      });
    }
  }
);

module.exports = router;