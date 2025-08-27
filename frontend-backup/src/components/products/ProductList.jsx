// src/components/products/ProductList.jsx
import React from 'react';
import { useSelector } from 'react-redux';
import ProductCard from './productCard';

const ProductList = () => {
  const { filteredProducts, status } = useSelector((state) => state.products);

  if (status === 'loading') {
    return <p className="text-center text-gray-400">Loading products...</p>;
  }

  if (filteredProducts.length === 0) {
    return <p className="text-center text-gray-400">No products found.</p>;
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {filteredProducts.map((product) => (
        <ProductCard key={product._id} product={product} />
      ))}
    </div>
  );
};

export default ProductList;
