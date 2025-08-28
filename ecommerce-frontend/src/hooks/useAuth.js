// src/hooks/useAuth.js
import { useSelector, useDispatch } from 'react-redux';
import { loginUser, registerUser, logout, clearError } from '../store/authSlice';
import { authService } from '../services/authService';

export const useAuth = () => {
  const dispatch = useDispatch();
  const auth = useSelector((state) => state.auth);

  const login = async (username, password) => {
    try {
      const result = await dispatch(loginUser({ username, password })).unwrap();
      return result;
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const register = async (username, password, role = 'user') => {
    try {
      const result = await dispatch(registerUser({ username, password, role })).unwrap();
      return result;
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    }
  };

  const signOut = () => {
    dispatch(logout());
    authService.logout();
  };

  const clearAuthError = () => {
    dispatch(clearError());
  };

  const isAdmin = () => {
    return auth.role === 'admin';
  };

  const isTokenValid = () => {
    return authService.isTokenValid();
  };

  return {
    // State
    user: auth.user,
    token: auth.token,
    role: auth.role,
    isAuthenticated: auth.isAuthenticated,
    isLoading: auth.isLoading,
    error: auth.error,

    // Actions
    login,
    register,
    signOut,
    clearAuthError,

    // Helpers
    isAdmin,
    isTokenValid
  };
};