// src/pages/Products.jsx
import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Grid, 
  List, 
  Filter, 
  SortAsc, 
  Search,
  ShoppingCart,
  Heart,
  Eye,
  Package
} from 'lucide-react';

import { setSearchTerm, setSelectedCategory } from '../store/productsSlice';
import { addToCart } from '../store/cartSlice';
import Loading from '../components/common/Loading';

// Category Filter Component
const CategoryFilter = () => {
  const dispatch = useDispatch();
  const { categories, selectedCategory } = useSelector((state) => state.products);

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-white flex items-center">
        <Filter className="w-5 h-5 mr-2" />
        Categories
      </h3>
      <div className="space-y-2">
        {categories.map((category) => (
          <motion.button
            key={category}
            whileHover={{ scale: 1.02, x: 5 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => dispatch(setSelectedCategory(category))}
            className={`w-full text-left px-4 py-2 rounded-lg transition-all duration-300 ${
              selectedCategory === category
                ? 'bg-eco-green text-white'
                : 'bg-white/10 text-gray-300 hover:bg-white/20 hover:text-white'
            }`}
          >
            {category}
          </motion.button>
        ))}
      </div>
    </div>
  );
};

// Sort Options Component
const SortOptions = ({ sortBy, setSortBy, sortOrder, setSortOrder }) => {
  const sortOptions = [
    { value: 'name', label: 'Name' },
    { value: 'price', label: 'Price' },
    { value: 'createdAt', label: 'Newest' },
  ];

  return (
    <div className="flex items-center space-x-4">
      <SortAsc className="w-5 h-5 text-gray-400" />
      <select
        value={sortBy}
        onChange={(e) => setSortBy(e.target.value)}
        className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-eco-green"
      >
        {sortOptions.map(option => (
          <option key={option.value} value={option.value} className="bg-gray-800">
            {option.label}
          </option>
        ))}
      </select>
      <button
        onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
        className="px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
      >
        {sortOrder === 'asc' ? '↑' : '↓'}
      </button>
    </div>
  );
};

// Product Card Component
const ProductCard = ({ product, viewMode, onAddToCart }) => {
  const [isLiked, setIsLiked] = useState(false);
  const [imageError, setImageError] = useState(false);

  const cardVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.9 },
    visible: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, scale: 0.9 }
  };

  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      whileHover={{ 
        scale: 1.03,
        rotateX: 2,
        rotateY: 2,
        z: 50
      }}
      transition={{ duration: 0.3 }}
      className={`group relative bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 hover:border-eco-green/50 overflow-hidden transition-all duration-300 ${
        viewMode === 'list' ? 'flex' : ''
      }`}
      style={{ transformStyle: 'preserve-3d' }}
    >
      {/* Product Image */}
      <div className={`relative ${viewMode === 'list' ? 'w-48 h-48' : 'aspect-square'} bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center overflow-hidden`}>
        {product.image && !imageError ? (
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-eco-green/20 to-eco-leaf/20 flex items-center justify-center">
            <Package className="w-16 h-16 text-eco-green group-hover:scale-110 transition-transform" />
          </div>
        )}
        
        {/* Overlay actions */}
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center space-x-4">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsLiked(!isLiked)}
            className={`p-3 rounded-full transition-colors ${
              isLiked ? 'bg-red-500 text-white' : 'bg-white/20 text-white hover:bg-white/30'
            }`}
          >
            <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
          </motion.button>
          
          <Link to={`/products/${product._id}`}>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="p-3 bg-white/20 text-white hover:bg-white/30 rounded-full transition-colors"
            >
              <Eye className="w-5 h-5" />
            </motion.button>
          </Link>
        </div>

        {/* Product category badge */}
        <div className="absolute top-2 left-2 px-2 py-1 bg-eco-green/80 text-white text-xs rounded-lg">
          {product.category}
        </div>

        {/* Stock indicator */}
        {product.stock < 10 && (
          <div className="absolute top-2 right-2 px-2 py-1 bg-orange-500/80 text-white text-xs rounded-lg">
            Low Stock
          </div>
        )}
      </div>

      {/* Product Details */}
      <div className={`p-6 flex-1 ${viewMode === 'list' ? 'flex flex-col justify-between' : ''}`}>
        <div>
          <h3 className="text-lg font-semibold text-white group-hover:text-eco-green transition-colors mb-2">
            {product.name}
          </h3>
          <p className={`text-gray-400 ${viewMode === 'grid' ? 'line-clamp-2' : 'line-clamp-3'} mb-4`}>
            {product.description}
          </p>
        </div>

        <div className={`flex items-center justify-between ${viewMode === 'list' ? 'mt-auto' : ''}`}>
          <div className="flex flex-col">
            <span className="text-2xl font-bold text-eco-green">
              ${product.price}
            </span>
            <span className="text-sm text-gray-400">
              Stock: {product.stock}
            </span>
          </div>

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => onAddToCart(product)}
            disabled={product.stock === 0}
            className="flex items-center space-x-2 px-4 py-2 bg-eco-green hover:bg-eco-leaf disabled:bg-gray-500 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors"
          >
            <ShoppingCart className="w-4 h-4" />
            <span>Add to Cart</span>
          </motion.button>
        </div>
      </div>

      {/* 3D hover effect overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-eco-green/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
    </motion.div>
  );
};

const Products = () => {
  const dispatch = useDispatch();
  const { filteredProducts, isLoading, searchTerm } = useSelector((state) => state.products);
  const { cartId } = useSelector((state) => state.cart);
  
  const [viewMode, setViewMode] = useState('grid');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [localSearchTerm, setLocalSearchTerm] = useState(searchTerm);

  useEffect(() => {
    setLocalSearchTerm(searchTerm);
  }, [searchTerm]);

  const handleSearch = (e) => {
    e.preventDefault();
    dispatch(setSearchTerm(localSearchTerm));
  };

  const handleAddToCart = async (product) => {
    if (cartId && product._id) {
      try {
        await dispatch(addToCart({
          cartId,
          productId: product._id,
          quantity: 1
        })).unwrap();
        // Show success message or toast here
      } catch (error) {
        console.error('Failed to add to cart:', error);
        // Show error message here
      }
    }
  };

  // Sort products
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    let aValue = a[sortBy];
    let bValue = b[sortBy];
    
    if (sortBy === 'price') {
      aValue = parseFloat(aValue);
      bValue = parseFloat(bValue);
    }
    
    if (sortOrder === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  if (isLoading) {
    return <Loading />;
  }

  return (
    <div className="min-h-screen pt-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Our <span className="text-eco-green">Products</span>
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Discover our comprehensive collection of sustainable, eco-friendly products designed for conscious consumers.
          </p>
        </motion.div>

        {/* Search and Filters */}
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Sidebar */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="lg:w-80 space-y-8"
          >
            {/* Search */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 p-6">
              <form onSubmit={handleSearch} className="space-y-4">
                <h3 className="text-lg font-semibold text-white flex items-center">
                  <Search className="w-5 h-5 mr-2" />
                  Search Products
                </h3>
                <div className="relative">
                  <input
                    type="text"
                    value={localSearchTerm}
                    onChange={(e) => setLocalSearchTerm(e.target.value)}
                    placeholder="Search products..."
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-eco-green"
                  />
                  <button
                    type="submit"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 text-gray-400 hover:text-white transition-colors"
                  >
                    <Search className="w-4 h-4" />
                  </button>
                </div>
              </form>
            </div>

            {/* Category Filter */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 p-6">
              <CategoryFilter />
            </div>
          </motion.div>

          {/* Main Content */}
          <div className="flex-1">
            
            {/* Toolbar */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="flex flex-col sm:flex-row items-center justify-between bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 p-6 mb-8"
            >
              <div className="flex items-center space-x-4 mb-4 sm:mb-0">
                <span className="text-gray-300">
                  {sortedProducts.length} products found
                </span>
                {searchTerm && (
                  <span className="text-sm text-eco-green">
                    for "{searchTerm}"
                  </span>
                )}
              </div>

              <div className="flex items-center space-x-4">
                <SortOptions
                  sortBy={sortBy}
                  setSortBy={setSortBy}
                  sortOrder={sortOrder}
                  setSortOrder={setSortOrder}
                />
                
                <div className="flex items-center space-x-2 ml-4 pl-4 border-l border-white/20">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded-lg transition-colors ${
                      viewMode === 'grid'
                        ? 'bg-eco-green text-white'
                        : 'bg-white/10 text-gray-400 hover:text-white hover:bg-white/20'
                    }`}
                  >
                    <Grid className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded-lg transition-colors ${
                      viewMode === 'list'
                        ? 'bg-eco-green text-white'
                        : 'bg-white/10 text-gray-400 hover:text-white hover:bg-white/20'
                    }`}
                  >
                    <List className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </motion.div>

            {/* Products Grid */}
            <AnimatePresence>
              {sortedProducts.length > 0 ? (
                <motion.div
                  className={`grid gap-6 ${
                    viewMode === 'grid'
                      ? 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3'
                      : 'grid-cols-1'
                  }`}
                >
                  {sortedProducts.map((product, index) => (
                    <motion.div
                      key={product._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                    >
                      <ProductCard
                        product={product}
                        viewMode={viewMode}
                        onAddToCart={handleAddToCart}
                      />
                    </motion.div>
                  ))}
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-16"
                >
                  <Package className="w-24 h-24 text-gray-600 mx-auto mb-4" />
                  <h3 className="text-2xl font-semibold text-white mb-2">
                    No products found
                  </h3>
                  <p className="text-gray-400 mb-6">
                    Try adjusting your search or filter criteria.
                  </p>
                  <button
                    onClick={() => {
                      dispatch(setSearchTerm(''));
                      dispatch(setSelectedCategory('All'));
                      setLocalSearchTerm('');
                    }}
                    className="px-6 py-3 bg-eco-green hover:bg-eco-leaf text-white font-semibold rounded-xl transition-colors"
                  >
                    Clear Filters
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Products;