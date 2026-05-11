import React, { createContext, useState, useContext, useEffect } from 'react';
import authService from '../services/authService';
import toast from 'react-hot-toast';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    const token = localStorage.getItem('access_token');
    if (token) {
      const storedUser = authService.getUser();
      if (storedUser) {
        setUser(storedUser);
        setIsAuthenticated(true);
      }
    }
    setLoading(false);
  };

  const login = async (email, password) => {
    const result = await authService.login({ email, password });
    if (result.success) {
      setUser(result.data.user);
      setIsAuthenticated(true);
      toast.success('Login successful!');
      return { success: true };
    } else {
      toast.error(result.error);
      return { success: false, error: result.error };
    }
  };

  const register = async (userData) => {
    const result = await authService.register(userData);
    if (result.success) {
      toast.success('Registration successful! Please login.');
      return { success: true };
    } else {
      toast.error(result.error);
      return { success: false, error: result.error };
    }
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
    setIsAuthenticated(false);
    toast.success('Logged out successfully');
  };

  return (
    <AuthContext.Provider value={{ user, loading, isAuthenticated, login, register, logout, loadUser }}>
      {children}
    </AuthContext.Provider>
  );
};