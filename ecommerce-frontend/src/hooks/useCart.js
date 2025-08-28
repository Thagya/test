// src/hooks/useCart.js
import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { 
  createCart, 
  fetchCart, 
  addToCart as addToCartAction,
  updateCartItem,
  removeFromCart,
  openCartDrawer,
  closeCartDrawer,
  toggleCartDrawer
} from '../store/cartSlice';

export const useCart = () => {
  const dispatch = useDispatch();
  const cart = useSelector((state) => state.cart);
  const { isAuthenticated } = useSelector((state) => state.auth);

  // Initialize cart on mount if user is authenticated
  useEffect(() => {
    if (isAuthenticated && !cart.cartId) {
      dispatch(createCart());
    }
  }, [isAuthenticated, cart.cartId, dispatch]);

  // Auto-fetch cart when cartId is available
  useEffect(() => {
    if (cart.cartId && isAuthenticated) {
      dispatch(fetchCart(cart.cartId));
    }
  }, [cart.cartId, isAuthenticated, dispatch]);

  const addToCart = async (productId, quantity = 1) => {
    if (!cart.cartId) {
      // Create cart first if it doesn't exist
      const result = await dispatch(createCart()).unwrap();
      await dispatch(addToCartAction({
        cartId: result.cartId,
        productId,
        quantity
      })).unwrap();
    } else {
      await dispatch(addToCartAction({
        cartId: cart.cartId,
        productId,
        quantity
      })).unwrap();
    }
    
    // Refresh cart data
    if (cart.cartId) {
      dispatch(fetchCart(cart.cartId));
    }
    
    // Show cart drawer briefly
    dispatch(openCartDrawer());
    setTimeout(() => {
      if (!cart.isDrawerOpen) return; // Don't auto-close if user manually opened
      dispatch(closeCartDrawer());
    }, 3000);
  };

  const updateQuantity = async (itemId, quantity) => {
    await dispatch(updateCartItem({ itemId, quantity })).unwrap();
    if (cart.cartId) {
      dispatch(fetchCart(cart.cartId));
    }
  };

  const removeItem = async (itemId) => {
    await dispatch(removeFromCart(itemId)).unwrap();
    if (cart.cartId) {
      dispatch(fetchCart(cart.cartId));
    }
  };

  const getCartTotal = () => {
    return cart.items.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const getCartItemCount = () => {
    return cart.items.reduce((total, item) => total + item.quantity, 0);
  };

  const isInCart = (productId) => {
    return cart.items.some(item => item.productId === productId);
  };

  const getCartItemQuantity = (productId) => {
    const item = cart.items.find(item => item.productId === productId);
    return item ? item.quantity : 0;
  };

  const toggleDrawer = () => {
    dispatch(toggleCartDrawer());
  };

  const openDrawer = () => {
    dispatch(openCartDrawer());
  };

  const closeDrawer = () => {
    dispatch(closeCartDrawer());
  };

      return {
    // State
    cartId: cart.cartId,
    items: cart.items,
    totalItems: cart.totalItems,
    totalPrice: cart.totalPrice,
    isLoading: cart.isLoading,
    error: cart.error,
    isDrawerOpen: cart.isDrawerOpen,

    // Actions
    addToCart,
    updateQuantity,
    removeItem,
    toggleDrawer,
    openDrawer,
    closeDrawer,

    // Helpers
    getCartTotal,
    getCartItemCount,
    isInCart,
    getCartItemQuantity,
  };
};