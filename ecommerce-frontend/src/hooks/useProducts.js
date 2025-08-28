// src/hooks/useProducts.js
import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  fetchProducts,
  fetchProductById,
  addProduct,
  updateProduct,
  deleteProduct,
  setSearchTerm,
  setSelectedCategory,
  clearCurrentProduct,
  clearError
} from '../store/productsSlice';

export const useProducts = () => {
  const dispatch = useDispatch();
  const products = useSelector((state) => state.products);

  // Auto-fetch products on mount
  useEffect(() => {
    if (products.products.length === 0 && !products.isLoading) {
      dispatch(fetchProducts());
    }
  }, [dispatch, products.products.length, products.isLoading]);

  const loadProducts = async () => {
    try {
      await dispatch(fetchProducts()).unwrap();
    } catch (error) {
      console.error('Failed to fetch products:', error);
      throw error;
    }
  };

  const loadProductById = async (id) => {
    try {
      const product = await dispatch(fetchProductById(id)).unwrap();
      return product;
    } catch (error) {
      console.error('Failed to fetch product:', error);
      throw error;
    }
  };

  const createProduct = async (productData) => {
    try {
      const product = await dispatch(addProduct(productData)).unwrap();
      return product;
    } catch (error) {
      console.error('Failed to create product:', error);
      throw error;
    }
  };

  const modifyProduct = async (id, productData) => {
    try {
      const product = await dispatch(updateProduct({ id, productData })).unwrap();
      return product;
    } catch (error) {
      console.error('Failed to update product:', error);
      throw error;
    }
  };

  const removeProduct = async (id) => {
    try {
      await dispatch(deleteProduct(id)).unwrap();
    } catch (error) {
      console.error('Failed to delete product:', error);
      throw error;
    }
  };

  const searchProducts = (term) => {
    dispatch(setSearchTerm(term));
  };

  const filterByCategory = (category) => {
    dispatch(setSelectedCategory(category));
  };

  const resetFilters = () => {
    dispatch(setSearchTerm(''));
    dispatch(setSelectedCategory('All'));
  };

  const clearProduct = () => {
    dispatch(clearCurrentProduct());
  };

  const clearErrors = () => {
    dispatch(clearError());
  };

  // Helper functions
  const getProductById = (id) => {
    return products.products.find(product => product._id === id);
  };

  const getProductsByCategory = (category) => {
    if (category === 'All') return products.products;
    return products.products.filter(product => product.category === category);
  };

  const searchInProducts = (query) => {
    if (!query) return products.products;
    const searchTerm = query.toLowerCase();
    return products.products.filter(product =>
      product.name.toLowerCase().includes(searchTerm) ||
      product.description.toLowerCase().includes(searchTerm) ||
      product.category.toLowerCase().includes(searchTerm)
    );
  };

  const getLowStockProducts = (threshold = 10) => {
    return products.products.filter(product => product.stock < threshold);
  };

  const getOutOfStockProducts = () => {
    return products.products.filter(product => product.stock === 0);
  };

  const getProductStats = () => {
    const total = products.products.length;
    const totalValue = products.products.reduce((sum, p) => sum + (p.price * p.stock), 0);
    const lowStock = getLowStockProducts().length;
    const outOfStock = getOutOfStockProducts().length;
    const categories = [...new Set(products.products.map(p => p.category))].length;
    const avgPrice = total > 0 ? products.products.reduce((sum, p) => sum + p.price, 0) / total : 0;

    return {
      total,
      totalValue,
      lowStock,
      outOfStock,
      categories,
      avgPrice: Math.round(avgPrice * 100) / 100
    };
  };

  const sortProducts = (products, sortBy = 'name', sortOrder = 'asc') => {
    return [...products].sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];

      if (sortBy === 'price' || sortBy === 'stock') {
        aValue = Number(aValue);
        bValue = Number(bValue);
      } else if (sortBy === 'createdAt') {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      } else {
        aValue = String(aValue).toLowerCase();
        bValue = String(bValue).toLowerCase();
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
  };

  return {
    // State
    products: products.products,
    filteredProducts: products.filteredProducts,
    currentProduct: products.currentProduct,
    categories: products.categories,
    selectedCategory: products.selectedCategory,
    searchTerm: products.searchTerm,
    isLoading: products.isLoading,
    error: products.error,

    // Actions
    loadProducts,
    loadProductById,
    createProduct,
    modifyProduct,
    removeProduct,
    searchProducts,
    filterByCategory,
    resetFilters,
    clearProduct,
    clearErrors,

    // Helpers
    getProductById,
    getProductsByCategory,
    searchInProducts,
    getLowStockProducts,
    getOutOfStockProducts,
    getProductStats,
    sortProducts
  };
};