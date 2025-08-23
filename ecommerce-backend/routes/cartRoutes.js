const express = require("express");
const router = express.Router();
const {
  createCart,
  addToCart,
  getCart,
  updateCartItem,
  removeFromCart,
} = require("../controllers/cartController");

const { verifyToken } = require("../middleware/authMiddleware");

// Protected routes
router.post("/", verifyToken, createCart);
router.post("/items", verifyToken, addToCart);
router.get("/", verifyToken, getCart);
router.put("/items/:id", verifyToken, updateCartItem);
router.delete("/items/:id", verifyToken, removeFromCart);

module.exports = router;
