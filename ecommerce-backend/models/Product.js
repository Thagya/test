const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },            // Product name
  description: { type: String, required: true },     // Product description
  price: { type: Number, required: true },           // Price
  category: { type: String, default: "General" },    // Category (Eco-friendly bags, bottles, etc.)
  image: { type: String },                           // Product image URL
  stock: { type: Number, default: 0 },               // Inventory count
  createdAt: { type: Date, default: Date.now },      // Timestamp
});

module.exports = mongoose.model("Product", productSchema);
