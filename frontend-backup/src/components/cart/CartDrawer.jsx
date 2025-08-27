// src/components/cart/CartDrawer.jsx
import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  ShoppingBag, 
  Minus, 
  Plus, 
  Trash2,
  ArrowRight,
  Package
} from 'lucide-react';

import { 
  closeCartDrawer, 
  fetchCart, 
  updateCartItem, 
  removeFromCart 
} from '../../store/cartSlice';

// Cart Item Component
const CartItem = ({ item, onUpdateQuantity, onRemove }) => {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      whileHover={{ scale: 1.02 }}
      className="flex items-center space-x-4 p-4 bg-white/5 rounded-xl border border-white/10 hover:border-eco-green/30 transition-all duration-300"
      style={{ transformStyle: 'preserve-3d' }}
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
        whileHover={{ scale: 1.1, color: '#ef4444' }}
        whileTap={{ scale: 0.9 }}
        onClick={() => onRemove(item.id)}
        className="p-2 text-gray-400 hover:text-red-400 transition-colors"
      >
        <Trash2 className="w-4 h-4" />
      </motion.button>
    </motion.div>
  );
};

// Empty Cart Component
const EmptyCart = () => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    className="flex flex-col items-center justify-center py-16 text-center"
  >
    <motion.div
      animate={{ 
        rotate: [0, -10, 10, -10, 0],
        scale: [1, 1.05, 1]
      }}
      transition={{ 
        duration: 2, 
        repeat: Infinity, 
        repeatDelay: 3 
      }}
      className="w-24 h-24 bg-gradient-to-br from-gray-600 to-gray-700 rounded-full flex items-center justify-center mb-6"
    >
      <ShoppingBag className="w-12 h-12 text-gray-400" />
    </motion.div>
    
    <h3 className="text-xl font-semibold text-white mb-2">Your cart is empty</h3>
    <p className="text-gray-400 mb-6">Add some eco-friendly products to get started!</p>
    
    <motion.div
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className="px-6 py-3 bg-eco-green hover:bg-eco-leaf text-white font-semibold rounded-xl transition-colors"
    >
      Start Shopping
    </motion.div>
  </motion.div>
);

const CartDrawer = () => {
  const dispatch = useDispatch();
  const { 
    isDrawerOpen, 
    items, 
    totalItems, 
    totalPrice, 
    isLoading, 
    cartId 
  } = useSelector((state) => state.cart);

  useEffect(() => {
    if (isDrawerOpen && cartId) {
      dispatch(fetchCart(cartId));
    }
  }, [dispatch, isDrawerOpen, cartId]);

  const handleClose = () => {
    dispatch(closeCartDrawer());
  };

  const handleUpdateQuantity = async (itemId, newQuantity) => {
    try {
      await dispatch(updateCartItem({ itemId, quantity: newQuantity })).unwrap();
      // Refresh cart after update
      if (cartId) {
        dispatch(fetchCart(cartId));
      }
    } catch (error) {
      console.error('Failed to update cart item:', error);
    }
  };

  const handleRemoveItem = async (itemId) => {
    try {
      await dispatch(removeFromCart(itemId)).unwrap();
      // Refresh cart after removal
      if (cartId) {
        dispatch(fetchCart(cartId));
      }
    } catch (error) {
      console.error('Failed to remove cart item:', error);
    }
  };

  const drawerVariants = {
    closed: { x: '100%', opacity: 0 },
    open: { x: 0, opacity: 1 }
  };

  const overlayVariants = {
    closed: { opacity: 0 },
    open: { opacity: 1 }
  };

  return (
    <AnimatePresence>
      {isDrawerOpen && (
        <>
          {/* Overlay */}
          <motion.div
            variants={overlayVariants}
            initial="closed"
            animate="open"
            exit="closed"
            onClick={handleClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          />

          {/* Cart Drawer */}
          <motion.div
            variants={drawerVariants}
            initial="closed"
            animate="open"
            exit="closed"
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-full sm:w-96 bg-slate-900/95 backdrop-blur-lg border-l border-white/10 shadow-2xl z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <div className="flex items-center space-x-3">
                <motion.div
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="w-10 h-10 bg-gradient-to-r from-eco-green to-eco-leaf rounded-full flex items-center justify-center"
                >
                  <ShoppingBag className="w-5 h-5 text-white" />
                </motion.div>
                <div>
                  <h2 className="text-xl font-bold text-white">Shopping Cart</h2>
                  <p className="text-sm text-gray-400">
                    {totalItems} {totalItems === 1 ? 'item' : 'items'}
                  </p>
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleClose}
                className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-6 h-6" />
              </motion.button>
            </div>

            {/* Cart Content */}
            <div className="flex-1 overflow-y-auto">
              {isLoading ? (
                <div className="flex items-center justify-center py-16">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-8 h-8 border-2 border-eco-green border-t-transparent rounded-full"
                  />
                </div>
              ) : items.length === 0 ? (
                <EmptyCart />
              ) : (
                <div className="p-6 space-y-4">
                  <AnimatePresence>
                    {items.map((item) => (
                      <CartItem
                        key={item.id}
                        item={item}
                        onUpdateQuantity={handleUpdateQuantity}
                        onRemove={handleRemoveItem}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="border-t border-white/10 p-6 bg-black/20"
              >
                {/* Order Summary */}
                <div className="space-y-4 mb-6">
                  <div className="flex justify-between text-gray-300">
                    <span>Subtotal</span>
                    <span>${totalPrice.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-gray-300">
                    <span>Shipping</span>
                    <span className="text-eco-green">Free</span>
                  </div>
                  <div className="flex justify-between text-gray-300">
                    <span>Tax</span>
                    <span>${(totalPrice * 0.1).toFixed(2)}</span>
                  </div>
                  <hr className="border-white/10" />
                  <div className="flex justify-between text-xl font-bold text-white">
                    <span>Total</span>
                    <span className="text-eco-green">
                      ${(totalPrice * 1.1).toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-3">
                  <motion.button
                    whileHover={{ scale: 1.02, boxShadow: "0 10px 40px rgba(16, 185, 129, 0.3)" }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full flex items-center justify-center space-x-2 py-4 bg-gradient-to-r from-eco-green to-eco-leaf text-white font-semibold rounded-xl shadow-lg transition-all duration-300"
                  >
                    <span>Checkout</span>
                    <ArrowRight className="w-5 h-5" />
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleClose}
                    className="w-full py-3 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl border border-white/20 transition-all duration-300"
                  >
                    Continue Shopping
                  </motion.button>
                </div>

                {/* Security Badge */}
                <div className="flex items-center justify-center space-x-2 mt-4 text-xs text-gray-400">
                  <div className="w-4 h-4 bg-eco-green/20 rounded flex items-center justify-center">
                    <div className="w-2 h-2 bg-eco-green rounded" />
                  </div>
                  <span>Secure checkout powered by SSL</span>
                </div>
              </motion.div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default CartDrawer;