const express = require("express");
const router = express.Router();
const {
  getProducts,
  getProductById,
  addProduct,
  updateProduct,
  deleteProduct,
} = require("../controllers/productController");

const { verifyToken } = require("../middleware/authMiddleware");

// Public
router.get("/", getProducts);
router.get("/:id", getProductById);

// Protected
router.post("/", verifyToken, addProduct);
router.put("/:id", verifyToken, updateProduct);
router.delete("/:id", verifyToken, deleteProduct);

module.exports = router;
