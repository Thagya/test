import React from "react";
import { motion } from "framer-motion";
import { Minus, Plus, Trash2, Package } from "lucide-react";

const CartItem = ({ item, onUpdateQuantity, onRemove }) => {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      whileHover={{ scale: 1.02 }}
      className="flex items-center space-x-4 p-4 bg-white/5 rounded-xl border border-white/10 hover:border-eco-green/30 transition-all duration-300"
    >
      {/* Product Image */}
      <div className="w-16 h-16 bg-gradient-to-br from-eco-green/20 to-eco-leaf/20 rounded-lg flex items-center justify-center flex-shrink-0">
        <Package className="w-8 h-8 text-eco-green" />
      </div>

      {/* Product Info */}
      <div className="flex-1 min-w-0">
        <h4 className="text-white font-semibold truncate">{item.name}</h4>
        <p className="text-eco-green font-bold">${item.price}</p>
      </div>

      {/* Quantity Controls */}
      <div className="flex items-center space-x-2 bg-white/10 rounded-lg">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => onUpdateQuantity(item.id, Math.max(1, item.quantity - 1))}
          className="p-1 text-gray-300 hover:text-white transition-colors"
        >
          <Minus className="w-4 h-4" />
        </motion.button>

        <span className="px-2 py-1 text-white font-semibold min-w-[2rem] text-center">
          {item.quantity}
        </span>

        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
          className="p-1 text-gray-300 hover:text-white transition-colors"
        >
          <Plus className="w-4 h-4" />
        </motion.button>
      </div>

      {/* Remove Button */}
      <motion.button
        whileHover={{ scale: 1.1, color: "#ef4444" }}
        whileTap={{ scale: 0.9 }}
        onClick={() => onRemove(item.id)}
        className="p-2 text-gray-400 hover:text-red-400 transition-colors"
      >
        <Trash2 className="w-4 h-4" />
      </motion.button>
    </motion.div>
  );
};

export default CartItem;
