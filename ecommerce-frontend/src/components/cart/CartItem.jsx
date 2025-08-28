// src/pages/Cart.jsx
import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  ShoppingCart,
  Package,
  Truck,
  Shield,
  CreditCard,
  Percent,
  Gift
} from 'lucide-react';

import { fetchCart, updateCartItem, removeFromCart } from '../store/cartSlice';
import CartItem from '../components/cart/CartItem';
import Loading from '../components/common/Loading';

// Checkout Summary Component
const CheckoutSummary = ({ totalPrice, totalItems }) => {
  const shipping = 0; // Free shipping
  const tax = totalPrice * 0.08; // 8% tax
  const finalTotal = totalPrice + shipping + tax;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.6 }}
      className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 p-6 h-fit sticky top-8"
    >
      <h3 className="text-xl font-bold text-white mb-6 flex items-center">
        <Package className="w-5 h-5 mr-2" />
        Order Summary
      </h3>

      <div className="space-y-4">
        <div className="flex justify-between text-gray-300">
          <span>Subtotal ({totalItems} items):</span>
          <span>${totalPrice.toFixed(2)}</span>
        </div>
        
        <div className="flex justify-between text-gray-300">
          <span className="flex items-center">
            <Truck className="w-4 h-4 mr-1" />
            Shipping:
          </span>
          <span className="text-eco-green font-semibold">Free</span>
        </div>

        <div className="flex justify-between text-gray-300">
          <span>Tax:</span>
          <span>${tax.toFixed(2)}</span>
        </div>

        <div className="border-t border-white/20 pt-4">
          <div className="flex justify-between text-lg font-bold text-white">
            <span>Total:</span>
            <span className="text-eco-green">${finalTotal.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Promo Code */}
      <div className="mt-6 p-4 bg-white/5 rounded-lg">
        <div className="flex items-center space-x-2 mb-3">
          <Percent className="w-4 h-4 text-eco-green" />
          <span className="text-white font-medium">Promo Code</span>
        </div>
        <div className="flex space-x-2">
          <input
            type="text"
            placeholder="Enter code"
            className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-eco-green"
          />
          <button className="px-4 py-2 bg-eco-green hover:bg-eco-leaf text-white font-medium rounded-lg transition-colors">
            Apply
          </button>
        </div>
      </div>

      {/* Checkout Button */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="w-full mt-6 flex items-center justify-center space-x-2 px-6 py-4 bg-gradient-to-r from-eco-green to-eco-leaf text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-eco-green/25 transition-all duration-300"
      >
        <CreditCard className="w-5 h-5" />
        <span>Proceed to Checkout</span>
      </motion.button>

      {/* Trust Badges */}
      <div className="mt-6 grid grid-cols-2 gap-3">
        <div className="flex items-center space-x-2 text-xs text-gray-400">
          <Shield className="w-4 h-4 text-eco-green" />
          <span>Secure Payment</span>
        </div>
        <div className="flex items-center space-x-2 text-xs text-gray-400">
          <Gift className="w-4 h-4 text-eco-green" />
          <span>Free Returns</span>
        </div>
      </div>
    </motion.div>
  );
};

const Cart = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const { 
    items, 
    cartId, 
    totalItems, 
    totalPrice, 
    isLoading 
  } = useSelector((state) => state.cart);

  useEffect(() => {
    if (cartId) {
      dispatch(fetchCart(cartId));
    }
  }, [dispatch, cartId]);

  const handleQuantityUpdate = async (itemId, newQuantity) => {
    if (newQuantity <= 0) {
      handleRemoveItem(itemId);
      return;
    }
    
    try {
      await dispatch(updateCartItem({ itemId, quantity: newQuantity })).unwrap();
      dispatch(fetchCart(cartId)); // Refresh cart
    } catch (error) {
      console.error('Failed to update quantity:', error);
    }
  };

  const handleRemoveItem = async (itemId) => {
    try {
      await dispatch(removeFromCart(itemId)).unwrap();
      dispatch(fetchCart(cartId)); // Refresh cart
    } catch (error) {
      console.error('Failed to remove item:', error);
    }
  };

  if (isLoading) {
    return <Loading />;
  }

  return (
    <div className="min-h-screen pt-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div className="flex items-center space-x-4">
            <motion.button
              whileHover={{ x: -5 }}
              onClick={() => navigate('/products')}
              className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Continue Shopping</span>
            </motion.button>
          </div>

          <div className="text-right">
            <h1 className="text-3xl md:text-4xl font-bold text-white">
              Shopping <span className="text-eco-green">Cart</span>
            </h1>
            {totalItems > 0 && (
              <p className="text-gray-400 mt-1">
                {totalItems} {totalItems === 1 ? 'item' : 'items'} in your cart
              </p>
            )}
          </div>
        </motion.div>

        {/* Cart Content */}
        {items.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-16"
          >
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 p-12 max-w-md mx-auto">
              <ShoppingCart className="w-24 h-24 text-gray-600 mx-auto mb-6" />
              <h2 className="text-2xl font-bold text-white mb-4">Your cart is empty</h2>
              <p className="text-gray-400 mb-8">
                Discover our eco-friendly products and start building a sustainable future.
              </p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/products')}
                className="px-8 py-3 bg-gradient-to-r from-eco-green to-eco-leaf text-white font-semibold rounded-xl hover:shadow-lg transition-all duration-300"
              >
                Start Shopping
              </motion.button>
            </div>
          </motion.div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            
            {/* Cart Items */}
            <div className="lg:col-span-2">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
                className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 p-6"
              >
                <h2 className="text-xl font-bold text-white mb-6 flex items-center">
                  <ShoppingCart className="w-5 h-5 mr-2" />
                  Cart Items ({totalItems})
                </h2>

                <div className="space-y-4">
                  <AnimatePresence>
                    {items.map((item, index) => (
                      <CartItem
                        key={item.id}
                        item={item}
                        index={index}
                        onQuantityUpdate={handleQuantityUpdate}
                        onRemove={handleRemoveItem}
                      />
                    ))}
                  </AnimatePresence>
                </div>

                {/* Quick Actions */}
                <div className="mt-6 pt-6 border-t border-white/20">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <button
                      onClick={() => navigate('/products')}
                      className="flex items-center justify-center space-x-2 px-6 py-3 bg-white/10 border border-white/20 text-white font-medium rounded-xl hover:bg-white/20 transition-colors"
                    >
                      <Package className="w-4 h-4" />
                      <span>Add More Items</span>
                    </button>
                    
                    <button className="flex items-center justify-center space-x-2 px-6 py-3 bg-white/10 border border-white/20 text-white font-medium rounded-xl hover:bg-white/20 transition-colors">
                      <Gift className="w-4 h-4" />
                      <span>Save for Later</span>
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Checkout Summary */}
            <div className="lg:col-span-1">
              <CheckoutSummary totalPrice={totalPrice} totalItems={totalItems} />
            </div>
          </div>
        )}

        {/* Recommended Products Section */}
        {items.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-16"
          >
            <h2 className="text-2xl font-bold text-white mb-8 text-center">
              You might also <span className="text-eco-green">like</span>
            </h2>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 p-8">
              <div className="text-center text-gray-400">
                <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Recommended products feature coming soon...</p>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Cart;