// src/pages/ProductDetail.jsx
import React, { useEffect, useState, Suspense } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows, Float } from '@react-three/drei';
import {
  ArrowLeft,
  ShoppingCart,
  Heart,
  Share2,
  Minus,
  Plus,
  Star,
  Shield,
  Truck,
  RotateCcw,
  Leaf,
  Package
} from 'lucide-react';

import { fetchProductById, clearCurrentProduct } from '../store/productsSlice';
import { addToCart } from '../store/cartSlice';
import Loading from '../components/common/Loading';

// 3D Product Model Component
function Product3DModel({ color = "#10b981" }) {
  return (
    <Float speed={1.5} rotationIntensity={0.5} floatIntensity={0.5}>
      <mesh>
        <boxGeometry args={[2, 2, 2]} />
        <meshStandardMaterial 
          color={color}
          roughness={0.3}
          metalness={0.1}
          transparent
          opacity={0.8}
        />
      </mesh>
      
      {/* Additional 3D elements */}
      <mesh position={[0, 0, 1.1]}>
        <circleGeometry args={[0.5, 32]} />
        <meshStandardMaterial 
          color="white"
          transparent
          opacity={0.9}
        />
      </mesh>
    </Float>
  );
}

// 3D Scene Component
function ProductScene({ product }) {
  return (
    <Canvas
      camera={{ position: [0, 0, 6], fov: 45 }}
      style={{ height: '500px' }}
    >
      <ambientLight intensity={0.6} />
      <directionalLight position={[10, 10, 5]} intensity={1} />
      <pointLight position={[-10, -10, -10]} intensity={0.5} color="#10b981" />
      
      <Suspense fallback={null}>
        <Product3DModel color={product?.category === 'Eco Bags' ? '#10b981' : '#0ea5e9'} />
        <Environment preset="city" />
        <ContactShadows
          position={[0, -2, 0]}
          opacity={0.4}
          scale={10}
          blur={2}
          far={4}
        />
      </Suspense>
      
      <OrbitControls
        enablePan={false}
        enableZoom={true}
        minDistance={3}
        maxDistance={8}
        minPolarAngle={Math.PI / 4}
        maxPolarAngle={Math.PI - Math.PI / 4}
      />
    </Canvas>
  );
}

// Quantity Selector Component
const QuantitySelector = ({ quantity, setQuantity, maxStock }) => {
  return (
    <div className="flex items-center space-x-4">
      <span className="text-gray-300">Quantity:</span>
      <div className="flex items-center bg-white/10 rounded-lg border border-white/20">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setQuantity(Math.max(1, quantity - 1))}
          className="p-2 text-gray-300 hover:text-white transition-colors"
        >
          <Minus className="w-4 h-4" />
        </motion.button>
        
        <span className="px-4 py-2 text-white font-semibold min-w-[3rem] text-center">
          {quantity}
        </span>
        
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setQuantity(Math.min(maxStock, quantity + 1))}
          className="p-2 text-gray-300 hover:text-white transition-colors"
        >
          <Plus className="w-4 h-4" />
        </motion.button>
      </div>
      <span className="text-sm text-gray-400">
        {maxStock} in stock
      </span>
    </div>
  );
};

// Feature Badge Component
const FeatureBadge = ({ icon: Icon, title, description }) => (
  <motion.div
    whileHover={{ scale: 1.02 }}
    className="flex items-center space-x-3 p-4 bg-white/5 rounded-lg border border-white/10 hover:border-eco-green/30 transition-all duration-300"
  >
    <div className="w-10 h-10 bg-eco-green/20 rounded-lg flex items-center justify-center">
      <Icon className="w-5 h-5 text-eco-green" />
    </div>
    <div>
      <div className="text-white font-semibold text-sm">{title}</div>
      <div className="text-gray-400 text-xs">{description}</div>
    </div>
  </motion.div>
);

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const { currentProduct, isLoading } = useSelector((state) => state.products);
  const { cartId } = useSelector((state) => state.cart);
  
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [activeTab, setActiveTab] = useState('description');

  useEffect(() => {
    if (id) {
      dispatch(fetchProductById(id));
    }
    
    return () => {
      dispatch(clearCurrentProduct());
    };
  }, [dispatch, id]);

  const handleAddToCart = async () => {
    if (cartId && currentProduct?._id) {
      try {
        await dispatch(addToCart({
          cartId,
          productId: currentProduct._id,
          quantity
        })).unwrap();
        
        // Show success notification (you can implement toast here)
        console.log('Added to cart successfully!');
      } catch (error) {
        console.error('Failed to add to cart:', error);
      }
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: currentProduct?.name,
          text: currentProduct?.description,
          url: window.location.href,
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
    }
  };

  if (isLoading) {
    return <Loading />;
  }

  if (!currentProduct) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Package className="w-24 h-24 text-gray-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Product not found</h2>
          <p className="text-gray-400 mb-6">The product you're looking for doesn't exist.</p>
          <button
            onClick={() => navigate('/products')}
            className="px-6 py-3 bg-eco-green hover:bg-eco-leaf text-white font-semibold rounded-xl transition-colors"
          >
            Back to Products
          </button>
        </div>
      </div>
    );
  }

  const features = [
    {
      icon: Leaf,
      title: "100% Eco-Friendly",
      description: "Sustainably sourced materials"
    },
    {
      icon: Shield,
      title: "Quality Guarantee",
      description: "Premium quality assurance"
    },
    {
      icon: Truck,
      title: "Free Shipping",
      description: "On orders over $50"
    },
    {
      icon: RotateCcw,
      title: "Easy Returns",
      description: "30-day return policy"
    }
  ];

  const tabs = [
    { id: 'description', label: 'Description' },
    { id: 'specifications', label: 'Specifications' },
    { id: 'reviews', label: 'Reviews' }
  ];

  return (
    <div className="min-h-screen pt-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Back Button */}
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          whileHover={{ x: -5 }}
          onClick={() => navigate('/products')}
          className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors mb-8"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Products</span>
        </motion.button>

        {/* Main Product Section */}
        <div className="grid lg:grid-cols-2 gap-12 mb-16">
          
          {/* Left: 3D Product Showcase */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-6"
          >
            {/* 3D Model */}
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 overflow-hidden">
              <ProductScene product={currentProduct} />
            </div>

            {/* Image Thumbnails (if available) */}
            <div className="grid grid-cols-4 gap-4">
              {[...Array(4)].map((_, index) => (
                <motion.div
                  key={index}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`aspect-square bg-white/10 rounded-lg border cursor-pointer transition-all duration-300 ${
                    selectedImage === index ? 'border-eco-green' : 'border-white/20 hover:border-white/40'
                  }`}
                  onClick={() => setSelectedImage(index)}
                >
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="w-8 h-8 text-eco-green" />
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Right: Product Information */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="space-y-8"
          >
            {/* Product Header */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="px-3 py-1 bg-eco-green/20 text-eco-green text-sm rounded-full">
                  {currentProduct.category}
                </span>
                <div className="flex items-center space-x-2">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setIsLiked(!isLiked)}
                    className={`p-2 rounded-full transition-colors ${
                      isLiked ? 'bg-red-500 text-white' : 'bg-white/10 text-gray-300 hover:text-white'
                    }`}
                  >
                    <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
                  </motion.button>
                  
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={handleShare}
                    className="p-2 bg-white/10 text-gray-300 hover:text-white rounded-full transition-colors"
                  >
                    <Share2 className="w-5 h-5" />
                  </motion.button>
                </div>
              </div>

              <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
                {currentProduct.name}
              </h1>

              <div className="flex items-center space-x-4 mb-6">
                <div className="flex items-center space-x-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-5 h-5 ${
                        i < 4 ? 'text-yellow-400 fill-current' : 'text-gray-600'
                      }`}
                    />
                  ))}
                  <span className="text-gray-300 ml-2">(4.2) · 127 reviews</span>
                </div>
              </div>

              <div className="text-4xl font-bold text-eco-green mb-6">
                ${currentProduct.price}
              </div>
            </div>

            {/* Product Description */}
            <div className="prose prose-invert">
              <p className="text-gray-300 text-lg leading-relaxed">
                {currentProduct.description}
              </p>
            </div>

            {/* Quantity Selector */}
            <QuantitySelector
              quantity={quantity}
              setQuantity={setQuantity}
              maxStock={currentProduct.stock}
            />

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleAddToCart}
                disabled={currentProduct.stock === 0}
                className="flex-1 flex items-center justify-center space-x-2 px-8 py-4 bg-gradient-to-r from-eco-green to-eco-leaf text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-eco-green/25 disabled:bg-gray-500 disabled:cursor-not-allowed transition-all duration-300"
              >
                <ShoppingCart className="w-5 h-5" />
                <span>{currentProduct.stock === 0 ? 'Out of Stock' : 'Add to Cart'}</span>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="px-8 py-4 bg-white/10 border border-white/20 text-white font-semibold rounded-xl hover:bg-white/20 transition-all duration-300"
              >
                Buy Now
              </motion.button>
            </div>

            {/* Features */}
            <div className="grid sm:grid-cols-2 gap-4">
              {features.map((feature, index) => (
                <FeatureBadge key={index} {...feature} />
              ))}
            </div>
          </motion.div>
        </div>

        {/* Product Details Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 overflow-hidden"
        >
          {/* Tab Navigation */}
          <div className="flex border-b border-white/10">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-4 font-semibold transition-all duration-300 ${
                  activeTab === tab.id
                    ? 'text-eco-green border-b-2 border-eco-green'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'description' && (
              <div className="prose prose-invert max-w-none">
                <p className="text-gray-300 leading-relaxed">
                  {currentProduct.description}
                </p>
                <p className="text-gray-300 leading-relaxed mt-4">
                  This eco-friendly product is carefully crafted using sustainable materials and ethical manufacturing processes. 
                  Perfect for environmentally conscious consumers who don't want to compromise on quality or style.
                </p>
              </div>
            )}
            
            {activeTab === 'specifications' && (
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-white font-semibold mb-3">Product Details</h4>
                  <div className="space-y-2 text-gray-300">
                    <div className="flex justify-between">
                      <span>Category:</span>
                      <span>{currentProduct.category}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Stock:</span>
                      <span>{currentProduct.stock} units</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Material:</span>
                      <span>100% Recycled</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {activeTab === 'reviews' && (
              <div className="text-center py-8">
                <p className="text-gray-400">Reviews feature coming soon...</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ProductDetail;