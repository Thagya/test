// src/services/cartService.js
import api from './api';

export const cartService = {
  // Create new cart
  createCart: async () => {
    const response = await api.post('/cart');
    return response.data;
  },

  // Get cart items
  getCart: async (cartId) => {
    const response = await api.get(`/cart?cartId=${cartId}`);
    return response.data;
  },

  // Add item to cart
  addToCart: async (cartId, productId, quantity = 1) => {
    const response = await api.post('/cart/items', {
      cartId,
      productId,
      quantity,
    });
    return response.data;
  },

  // Update cart item quantity
  updateCartItem: async (itemId, quantity) => {
    const response = await api.put(`/cart/items/${itemId}`, {
      quantity,
    });
    return response.data;
  },

  // Remove item from cart
  removeFromCart: async (itemId) => {
    const response = await api.delete(`/cart/items/${itemId}`);
    return response.data;
  },

  // Clear entire cart (if you add this endpoint)
  clearCart: async (cartId) => {
    const response = await api.delete(`/cart/${cartId}`);
    return response.data;
  },

  // Get cart count
  getCartCount: async (cartId) => {
    try {
      const items = await cartService.getCart(cartId);
      return items.reduce((total, item) => total + item.quantity, 0);
    } catch (error) {
      return 0;
    }
  },
};