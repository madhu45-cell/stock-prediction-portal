import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// Auth Components
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import ForgotPassword from './components/Auth/ForgotPassword';
import ResetPassword from './components/Auth/ResetPassword';
import PrivateRoute from './components/Auth/PrivateRoute';

// Layout Components
import Navbar from './components/Layout/Navbar';

// Page Components
import Dashboard from './components/Dashboard/Dashboard';
import StockSearch from './components/Stocks/StockSearch';
import StockDetail from './components/Stocks/StockDetail';
import PredictionPanel from './components/Predictions/PredictionPanel';
import Watchlist from './components/Watchlist/Watchlist';
import NewsPage from './components/News/NewsPage';
import Profile from './components/Profile/Profile';

function App() {
  return (
    <>
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 3000,
          },
          error: {
            duration: 4000,
          },
        }}
      />
      
      <Routes>
        {/* Public Routes - No Navbar */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        
        {/* Protected Routes - With Navbar */}
        <Route path="/dashboard" element={
          <PrivateRoute>
            <>
              <Navbar />
              <Dashboard />
            </>
          </PrivateRoute>
        } />
        
        <Route path="/stocks" element={
          <PrivateRoute>
            <>
              <Navbar />
              <StockSearch />
            </>
          </PrivateRoute>
        } />
        
        <Route path="/stocks/:symbol" element={
          <PrivateRoute>
            <>
              <Navbar />
              <StockDetail />
            </>
          </PrivateRoute>
        } />
        
        <Route path="/predictions" element={
          <PrivateRoute>
            <>
              <Navbar />
              <PredictionPanel />
            </>
          </PrivateRoute>
        } />
        
        <Route path="/watchlist" element={
          <PrivateRoute>
            <>
              <Navbar />
              <Watchlist />
            </>
          </PrivateRoute>
        } />
        
        <Route path="/news" element={
          <PrivateRoute>
            <>
              <Navbar />
              <NewsPage />
            </>
          </PrivateRoute>
        } />
        
        {/* Profile Page - Shows user account settings */}
        <Route path="/profile" element={
          <PrivateRoute>
            <>
              <Navbar />
              <Profile />
            </>
          </PrivateRoute>
        } />
        
        {/* Portfolio - Now redirects to Profile (User Portfolio/Settings) */}
        <Route path="/portfolio" element={
          <PrivateRoute>
            <>
              <Navbar />
              <Profile />
            </>
          </PrivateRoute>
        } />
        
        {/* Settings - Redirects to Profile */}
        <Route path="/settings" element={
          <PrivateRoute>
            <>
              <Navbar />
              <Profile />
            </>
          </PrivateRoute>
        } />
        
        {/* Default Route */}
        <Route path="/" element={<Navigate to="/dashboard" />} />
        
        {/* 404 Not Found */}
        <Route path="*" element={
          <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
              <p className="text-xl text-gray-600 mb-8">Page not found</p>
              <a href="/dashboard" className="text-blue-600 hover:text-blue-700">Go to Dashboard →</a>
            </div>
          </div>
        } />
      </Routes>
    </>
  );
}

export default App;