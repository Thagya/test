// src/pages/Dashboard.jsx
import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { motion } from 'framer-motion';
import { 
  Plus, 
  Package, 
  Upload, 
  DollarSign, 
  FileText,
  Tag,
  Hash,
  Image as ImageIcon,
  Save,
  X
} from 'lucide-react';

import { addProduct } from '../store/productsSlice';

// Input Field Component
const InputField = ({ 
  icon: Icon, 
  label, 
  type = "text", 
  placeholder, 
  value, 
  onChange, 
  error,
  required = false,
  multiline = false,
  ...props 
}) => (
  <div className="space-y-2">
    <label className="flex items-center space-x-2 text-sm font-medium text-gray-300">
      <Icon className="w-4 h-4" />
      <span>{label} {required && <span className="text-red-400">*</span>}</span>
    </label>
    
    {multiline ? (
      <textarea
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        rows={4}
        className={`w-full px-4 py-3 bg-white/10 backdrop-blur-sm border rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-eco-green resize-none transition-all duration-300 ${
          error ? 'border-red-400' : 'border-white/20 hover:border-white/40'
        }`}
        {...props}
      />
    ) : (
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className={`w-full px-4 py-3 bg-white/10 backdrop-blur-sm border rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-eco-green transition-all duration-300 ${
          error ? 'border-red-400' : 'border-white/20 hover:border-white/40'
        }`}
        {...props}
      />
    )}
    
    {error && (
      <motion.p
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-red-400 text-sm"
      >
        {error}
      </motion.p>
    )}
  </div>
);

// Image Upload Component
const ImageUpload = ({ onImageSelect, preview, onRemoveImage }) => {
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        onImageSelect(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-2">
      <label className="flex items-center space-x-2 text-sm font-medium text-gray-300">
        <ImageIcon className="w-4 h-4" />
        <span>Product Image</span>
      </label>
      
      {preview ? (
        <div className="relative">
          <img
            src={preview}
            alt="Preview"
            className="w-full h-48 object-cover rounded-xl"
          />
          <button
            type="button"
            onClick={onRemoveImage}
            className="absolute top-2 right-2 p-1 bg-red-500 hover:bg-red-600 text-white rounded-full transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-white/20 hover:border-white/40 rounded-xl cursor-pointer transition-colors">
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <Upload className="w-10 h-10 text-gray-400 mb-3" />
            <p className="text-sm text-gray-300">
              <span className="font-semibold">Click to upload</span> or drag and drop
            </p>
            <p className="text-xs text-gray-400">PNG, JPG, GIF up to 10MB</p>
          </div>
          <input
            type="file"
            className="hidden"
            accept="image/*"
            onChange={handleFileSelect}
          />
        </label>
      )}
    </div>
  );
};

const Dashboard = () => {
  const dispatch = useDispatch();
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    image: '',
    stock: ''
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const categories = [
    'Eco Bags',
    'Water Bottles',
    'Home & Garden',
    'Personal Care',
    'Clothing',
    'Electronics',
    'Food & Beverages',
    'Office Supplies'
  ];

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Product name is required';
    }
    
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }
    
    if (!formData.price || formData.price <= 0) {
      newErrors.price = 'Valid price is required';
    }
    
    if (!formData.category) {
      newErrors.category = 'Category is required';
    }
    
    if (!formData.stock || formData.stock < 0) {
      newErrors.stock = 'Valid stock quantity is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsLoading(true);
    
    try {
      await dispatch(addProduct({
        ...formData,
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock)
      })).unwrap();
      
      setIsSuccess(true);
      setFormData({
        name: '',
        description: '',
        price: '',
        category: '',
        image: '',
        stock: ''
      });
      
      setTimeout(() => setIsSuccess(false), 3000);
    } catch (error) {
      console.error('Failed to add product:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field) => (e) => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target.value
    }));
    
    // Clear field error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: null
      }));
    }
  };

  const handleImageSelect = (imageData) => {
    setFormData(prev => ({
      ...prev,
      image: imageData
    }));
  };

  const handleRemoveImage = () => {
    setFormData(prev => ({
      ...prev,
      image: ''
    }));
  };

  return (
    <div className="min-h-screen pt-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="w-20 h-20 bg-gradient-to-r from-eco-green to-eco-leaf rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Package className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Product <span className="text-eco-green">Dashboard</span>
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Add new eco-friendly products to your store and manage your inventory.
          </p>
        </motion.div>

        {/* Success Message */}
        {isSuccess && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="mb-8 p-4 bg-green-500/20 border border-green-500/30 rounded-xl text-green-300 text-center"
          >
            ✅ Product added successfully!
          </motion.div>
        )}

        {/* Add Product Form */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="bg-white/10 backdrop-blur-lg rounded-3xl border border-white/20 p-8 shadow-2xl"
        >
          <div className="flex items-center space-x-3 mb-8">
            <Plus className="w-6 h-6 text-eco-green" />
            <h2 className="text-2xl font-bold text-white">Add New Product</h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              
              {/* Product Name */}
              <InputField
                icon={Package}
                label="Product Name"
                placeholder="Enter product name"
                value={formData.name}
                onChange={handleInputChange('name')}
                error={errors.name}
                required
              />

              {/* Category */}
              <div className="space-y-2">
                <label className="flex items-center space-x-2 text-sm font-medium text-gray-300">
                  <Tag className="w-4 h-4" />
                  <span>Category <span className="text-red-400">*</span></span>
                </label>
                <select
                  value={formData.category}
                  onChange={handleInputChange('category')}
                  className={`w-full px-4 py-3 bg-white/10 backdrop-blur-sm border rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-eco-green transition-all duration-300 ${
                    errors.category ? 'border-red-400' : 'border-white/20 hover:border-white/40'
                  }`}
                >
                  <option value="" className="bg-gray-800">Select a category</option>
                  {categories.map(category => (
                    <option key={category} value={category} className="bg-gray-800">
                      {category}
                    </option>
                  ))}
                </select>
                {errors.category && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-red-400 text-sm"
                  >
                    {errors.category}
                  </motion.p>
                )}
              </div>

              {/* Price */}
              <InputField
                icon={DollarSign}
                label="Price"
                type="number"
                placeholder="0.00"
                value={formData.price}
                onChange={handleInputChange('price')}
                error={errors.price}
                min="0"
                step="0.01"
                required
              />

              {/* Stock */}
              <InputField
                icon={Hash}
                label="Stock Quantity"
                type="number"
                placeholder="0"
                value={formData.stock}
                onChange={handleInputChange('stock')}
                error={errors.stock}
                min="0"
                required
              />
            </div>

            {/* Description */}
            <InputField
              icon={FileText}
              label="Description"
              placeholder="Enter product description"
              value={formData.description}
              onChange={handleInputChange('description')}
              error={errors.description}
              multiline
              required
            />

            {/* Image Upload */}
            <ImageUpload
              onImageSelect={handleImageSelect}
              preview={formData.image}
              onRemoveImage={handleRemoveImage}
            />

            {/* Submit Button */}
            <motion.button
              whileHover={{ scale: 1.02, boxShadow: "0 10px 40px rgba(16, 185, 129, 0.3)" }}
              whileTap={{ scale: 0.98 }}
              disabled={isLoading}
              className="w-full flex items-center justify-center space-x-2 py-4 bg-gradient-to-r from-eco-green to-eco-leaf text-white font-semibold rounded-xl shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
            >
              {isLoading ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                />
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  <span>Add Product</span>
                </>
              )}
            </motion.button>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;