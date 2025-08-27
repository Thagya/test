// src/components/products/ProductCard.jsx
import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ShoppingCart } from 'lucide-react';
import { useDispatch } from 'react-redux';
import { addToCart } from '../../store/cartSlice';

const ProductCard = ({ product }) => {
  const dispatch = useDispatch();

  return (
    <motion.div
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      className="bg-black/20 backdrop-blur-lg rounded-xl border border-white/10 shadow-lg overflow-hidden group"
    >
      {/* Product Image */}
      <Link to={`/products/${product._id}`}>
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-56 object-cover group-hover:opacity-90 transition-opacity"
        />
      </Link>

      {/* Content */}
      <div className="p-4 flex flex-col gap-2">
        <Link to={`/products/${product._id}`}>
          <h3 className="text-lg font-semibold text-white hover:text-eco-green transition-colors">
            {product.name}
          </h3>
        </Link>
        <p className="text-sm text-gray-400 line-clamp-2">{product.description}</p>

        <div className="flex items-center justify-between mt-2">
          <span className="text-lg font-bold text-eco-green">${product.price}</span>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => dispatch(addToCart(product))}
            className="p-2 bg-eco-green/20 rounded-lg hover:bg-eco-green/40 transition-colors"
          >
            <ShoppingCart className="w-5 h-5 text-eco-green" />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

export default ProductCard;
