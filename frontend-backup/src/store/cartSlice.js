// src/store/cartSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { cartService } from '../services/cartService';

// Async thunks
export const createCart = createAsyncThunk(
  'cart/createCart',
  async (_, { rejectWithValue }) => {
    try {
      const response = await cartService.createCart();
      localStorage.setItem('cartId', response.cartId);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to create cart');
    }
  }
);

export const fetchCart = createAsyncThunk(
  'cart/fetchCart',
  async (cartId, { rejectWithValue }) => {
    try {
      const response = await cartService.getCart(cartId);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch cart');
    }
  }
);

export const addToCart = createAsyncThunk(
  'cart/addToCart',
  async ({ cartId, productId, quantity = 1 }, { rejectWithValue }) => {
    try {
      const response = await cartService.addToCart(cartId, productId, quantity);
      return { productId, quantity, ...response };
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to add to cart');
    }
  }
);

export const updateCartItem = createAsyncThunk(
  'cart/updateCartItem',
  async ({ itemId, quantity }, { rejectWithValue }) => {
    try {
      const response = await cartService.updateCartItem(itemId, quantity);
      return { itemId, quantity, ...response };
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to update cart item');
    }
  }
);

export const removeFromCart = createAsyncThunk(
  'cart/removeFromCart',
  async (itemId, { rejectWithValue }) => {
    try {
      await cartService.removeFromCart(itemId);
      return itemId;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to remove from cart');
    }
  }
);

const initialState = {
  cartId: localStorage.getItem('cartId'),
  items: [],
  isLoading: false,
  error: null,
  totalItems: 0,
  totalPrice: 0,
  isDrawerOpen: false,
};

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    toggleCartDrawer: (state) => {
      state.isDrawerOpen = !state.isDrawerOpen;
    },
    closeCartDrawer: (state) => {
      state.isDrawerOpen = false;
    },
    openCartDrawer: (state) => {
      state.isDrawerOpen = true;
    },
    clearCart: (state) => {
      state.items = [];
      state.totalItems = 0;
      state.totalPrice = 0;
    },
    updateTotals: (state) => {
      state.totalItems = state.items.reduce((total, item) => total + item.quantity, 0);
      state.totalPrice = state.items.reduce((total, item) => total + (item.price * item.quantity), 0);
    },
  },
  extraReducers: (builder) => {
    builder
      // Create cart
      .addCase(createCart.fulfilled, (state, action) => {
        state.cartId = action.payload.cartId;
      })
      // Fetch cart
      .addCase(fetchCart.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchCart.fulfilled, (state, action) => {
        state.isLoading = false;
        state.items = action.payload;
        cartSlice.caseReducers.updateTotals(state);
      })
      .addCase(fetchCart.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Add to cart
      .addCase(addToCart.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(addToCart.fulfilled, (state, action) => {
        state.isLoading = false;
        // Refresh cart items after adding
        // This will be handled by fetching cart again
      })
      .addCase(addToCart.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Update cart item
      .addCase(updateCartItem.fulfilled, (state, action) => {
        const { itemId, quantity } = action.payload;
        const item = state.items.find(item => item.id === itemId);
        if (item) {
          item.quantity = quantity;
        }
        cartSlice.caseReducers.updateTotals(state);
      })
      // Remove from cart
      .addCase(removeFromCart.fulfilled, (state, action) => {
        const itemId = action.payload;
        state.items = state.items.filter(item => item.id !== itemId);
        cartSlice.caseReducers.updateTotals(state);
      });
  },
});

export const { 
  toggleCartDrawer, 
  closeCartDrawer, 
  openCartDrawer, 
  clearCart, 
  updateTotals 
} = cartSlice.actions;

export default cartSlice.reducer;