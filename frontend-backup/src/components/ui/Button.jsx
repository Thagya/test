import React from "react";
import { motion } from "framer-motion";

const Button = ({ children, onClick, className = "", disabled = false }) => {
  return (
    <motion.button
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      disabled={disabled}
      className={`py-3 px-6 rounded-xl font-semibold transition-all duration-300 ${className}`}
    >
      {children}
    </motion.button>
  );
};

export default Button;
