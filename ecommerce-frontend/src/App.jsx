// src/App.jsx
import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';

// Components
import Header from './components/common/Header';
import Footer from './components/common/Footer';
import CartDrawer from './components/cart/CartDrawer';
import Loading from './components/common/Loading';
import ParticleBackground from './components/3d/PracticalBackground';

// Pages
import Home from './pages/Home';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';

// Store actions
import { fetchProducts } from './store/productsSlice';
import { createCart, fetchCart } from './store/cartSlice';

// Hooks
import { useAuth } from './hooks/useAuth';

// Styles
import './styles/globals.css';
import './styles/animations.css';
import './styles/components.css';

// Protected Route Component
const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { isAuthenticated, role } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return children;
};

// Page transition variants
const pageVariants = {
  initial: {
    opacity: 0,
    y: 20,
    scale: 0.98
  },
  in: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.4,
      ease: 'easeOut'
    }
  },
  out: {
    opacity: 0,
    y: -20,
    scale: 0.98,
    transition: {
      duration: 0.3,
      ease: 'easeIn'
    }
  }
};

// Animated Route Wrapper
const AnimatedRoute = ({ children }) => {
  const location = useLocation();
  
  return (
    <motion.div
      key={location.pathname}
      initial="initial"
      animate="in"
      exit="out"
      variants={pageVariants}
      className="w-full"
    >
      {children}
    </motion.div>
  );
};

function App() {
  const dispatch = useDispatch();
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const { isLoading: productsLoading } = useSelector((state) => state.products);
  const { isLoading: cartLoading } = useSelector((state) => state.cart);

  // Initialize application data
  useEffect(() => {
    // Always fetch products
    dispatch(fetchProducts());
    
    // Initialize cart for authenticated users
    if (isAuthenticated) {
      const savedCartId = localStorage.getItem('cartId');
      if (savedCartId) {
        dispatch(fetchCart(savedCartId));
      } else {
        dispatch(createCart());
      }
    }
  }, [dispatch, isAuthenticated]);

  // Check for authentication token on app start
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token && !isAuthenticated) {
      // Token exists but user not authenticated in store
      // This could happen after page refresh
      // You might want to validate token here
    }
  }, [isAuthenticated]);

  const isAppLoading = productsLoading || cartLoading;

  return (
    <div className="App min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white overflow-x-hidden">
      {/* Particle Background */}
      <ParticleBackground />
      
      {/* Main Layout */}
      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Header */}
        <Header />
        
        {/* Main Content */}
        <main className="flex-grow pt-16 md:pt-20">
          <AnimatePresence mode="wait" initial={false}>
            <Routes location={location} key={location.pathname}>
              <Route 
                path="/" 
                element={
                  <AnimatedRoute>
                    <Home />
                  </AnimatedRoute>
                } 
              />
              <Route 
                path="/products" 
                element={
                  <AnimatedRoute>
                    <Products />
                  </AnimatedRoute>
                } 
              />
              <Route 
                path="/products/:id" 
                element={
                  <AnimatedRoute>
                    <ProductDetail />
                  </AnimatedRoute>
                } 
              />
              <Route 
                path="/login" 
                element={
                  <AnimatedRoute>
                    <Login />
                  </AnimatedRoute>
                } 
              />
              <Route 
                path="/register" 
                element={
                  <AnimatedRoute>
                    <Register />
                  </AnimatedRoute>
                } 
              />
              <Route 
                path="/dashboard" 
                element={
                  <ProtectedRoute adminOnly>
                    <AnimatedRoute>
                      <Dashboard />
                    </AnimatedRoute>
                  </ProtectedRoute>
                } 
              />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </AnimatePresence>
        </main>
        
        {/* Footer */}
        <Footer />
      </div>

      {/* Cart Drawer */}
      <CartDrawer />

      {/* Global Loading Overlay */}
      <AnimatePresence>
        {isAppLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center"
          >
            <div className="text-center">
              <Loading />
              <motion.p 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="mt-4 text-gray-300 text-sm"
              >
                Loading your eco-friendly experience...
              </motion.p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error Boundary Fallback (you might want to implement a proper ErrorBoundary) */}
      {/* <ErrorBoundary fallback={<ErrorFallback />}>
        {children}
      </ErrorBoundary> */}
    </div>
  );
}

export default App;