// src/components/common/CategoryFilter.jsx
import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setCategory } from '../../store/productsSlice';
import { motion } from 'framer-motion';
import { Leaf, Droplets, Package, Coffee } from 'lucide-react';

const categories = [
  { label: 'All', value: 'all', icon: Package },
  { label: 'Bags', value: 'bags', icon: Leaf },
  { label: 'Bottles', value: 'bottles', icon: Droplets },
  { label: 'Cups', value: 'cups', icon: Coffee },
];

const CategoryFilter = () => {
  const dispatch = useDispatch();
  const { selectedCategory } = useSelector((state) => state.products);

  const handleCategoryClick = (value) => {
    dispatch(setCategory(value));
  };

  return (
    <div className="flex flex-wrap items-center gap-3 mb-6">
      {categories.map(({ label, value, icon: Icon }) => (
        <motion.button
          key={value}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => handleCategoryClick(value)}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            selectedCategory === value
              ? 'bg-eco-green text-white shadow-md'
              : 'bg-white/10 text-gray-300 hover:bg-white/20'
          }`}
        >
          <Icon className="w-4 h-4" />
          <span>{label}</span>
        </motion.button>
      ))}
    </div>
  );
};

export default CategoryFilter;
