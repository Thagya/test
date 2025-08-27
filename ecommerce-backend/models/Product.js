const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },            
  description: { type: String, required: true },     
  price: { type: Number, required: true },           
  category: { type: String, default: "General" },    
  image: { type: String, default: "" },              // 👈 added image field
  stock: { type: Number, default: 0 },               
  createdAt: { type: Date, default: Date.now },      
});

module.exports = mongoose.model("Product", productSchema);
