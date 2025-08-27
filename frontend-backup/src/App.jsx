// src/App.jsx
import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';

// Components
import Header from './components/common/Header';
import Footer from './components/common/Footer';
import CartDrawer from './components/cart/CartDrawer';
import Loading from './components/common/Loading';
import ParticleBackground from './components/3d/ParticleBackground';

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

// Styles
import './styles/globals.css';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);
  return isAuthenticated ? children : <Navigate to="/login" />;
};

function App() {
  const dispatch = useDispatch();
  const { isLoading } = useSelector((state) => state.products);
  const { cartId } = useSelector((state) => state.cart);

  useEffect(() => {
    // Initialize app data
    dispatch(fetchProducts());

    // Initialize cart
    const savedCartId = localStorage.getItem('cartId');
    if (savedCartId) {
      dispatch(fetchCart(savedCartId));
    } else {
      dispatch(createCart());
    }
  }, [dispatch]);

  if (isLoading) {
    return <Loading />;
  }

  return (
    <Router>
      <div className="App min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white overflow-x-hidden">
        {/* Particle Background */}
        <ParticleBackground />
        
        {/* Main Layout */}
        <div className="relative z-10">
          <Header />
          
          <AnimatePresence mode="wait">
            <main className="min-h-screen pt-16">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/products" element={<Products />} />
                <Route path="/products/:id" element={<ProductDetail />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route 
                  path="/dashboard" 
                  element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  } 
                />
                <Route path="*" element={<Navigate to="/" />} />
              </Routes>
            </main>
          </AnimatePresence>
          
          <Footer />
        </div>

        {/* Cart Drawer */}
        <CartDrawer />

        {/* Global Loading Overlay */}
        <AnimatePresence>
          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-50 flex items-center justify-center"
            >
              <Loading />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Router>
  );
}

export default App;