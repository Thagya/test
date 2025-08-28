// src/components/products/productCard.jsx
import React from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Package } from "lucide-react";

const ProductCard = ({ product }) => {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 overflow-hidden shadow-lg hover:shadow-eco-green/20 transition"
    >
      <Link to={`/products/${product._id}`}>
        <div className="relative w-full h-48 bg-gray-800 flex items-center justify-center">
          {product.image ? (
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <Package className="w-12 h-12 text-eco-green" />
          )}
        </div>
        <div className="p-4">
          <h3 className="text-lg font-semibold text-white truncate">
            {product.name}
          </h3>
          <p className="text-gray-400 text-sm line-clamp-2">
            {product.description}
          </p>
          <div className="flex items-center justify-between mt-3">
            <span className="text-eco-green font-bold">${product.price}</span>
            <span
              className={`text-xs px-2 py-1 rounded-full ${
                product.stock > 10
                  ? "bg-green-500/20 text-green-400"
                  : product.stock > 0
                  ? "bg-yellow-500/20 text-yellow-400"
                  : "bg-red-500/20 text-red-400"
              }`}
            >
              {product.stock > 0 ? `${product.stock} left` : "Out of stock"}
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

export default ProductCard;
