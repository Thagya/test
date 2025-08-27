// src/services/authService.js
import api from './api';

export const authService = {
  // Login user
  login: async (username, password) => {
    const response = await api.post('/auth/login', { username, password });
    return response.data; // contains { message, token, role }
  },

  // Register user
  register: async (username, password, role = "user") => {
    const response = await api.post('/auth/register', { username, password, role });
    return response.data;
  },

  // Get current user profile (future use if needed)
  getProfile: async () => {
    const response = await api.get('/auth/profile');
    return response.data;
  },

  // Logout (client-side token removal)
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('cartId');
  },

  // Check if token is valid
  isTokenValid: () => {
    const token = localStorage.getItem('token');
    if (!token) return false;

    try {
      const tokenParts = token.split('.');
      if (tokenParts.length !== 3) return false;

      const payload = JSON.parse(atob(tokenParts[1]));
      const currentTime = Date.now() / 1000;

      return payload.exp > currentTime;
    } catch (error) {
      return false;
    }
  },
};
