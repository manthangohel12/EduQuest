import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiService, apiUtils } from '../services/api';
import toast from 'react-hot-toast';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));

  // Configure axios defaults
  useEffect(() => {
    if (token) {
      // Token is handled by the API service interceptors
    }
  }, [token]);

  // Check if user is authenticated on app load
  useEffect(() => {
    const checkAuth = async () => {
      if (token) {
        try {
          console.log('Checking authentication with token:', token.substring(0, 20) + '...');
          const response = await apiService.auth.getProfile();
          setUser(response.data);
          console.log('Authentication successful, user:', response.data.email);
        } catch (error) {
          console.error('Auth check failed:', error);
          console.log('Token may be expired or invalid, logging out...');
          logout();
        }
      } else {
        console.log('No token found, user needs to log in');
      }
      setLoading(false);
    };

    checkAuth();
  }, [token]);

  const login = async (email, password) => {
    try {
      const response = await apiService.auth.login({ email, password });
      
      const { access, refresh } = response.data;
      
      localStorage.setItem('token', access);
      localStorage.setItem('refreshToken', refresh);
      
      setToken(access);
      
      // Get user data
      const userResponse = await apiService.auth.getProfile();
      setUser(userResponse.data);
      
      toast.success('Welcome back!');
      return true;
    } catch (error) {
      apiUtils.handleError(error, 'Login failed');
      return false;
    }
  };

  const register = async (userData) => {
    try {
      const response = await apiService.auth.register(userData);
      const { access, refresh } = response.data;
      localStorage.setItem('token', access);
      localStorage.setItem('refreshToken', refresh);
      setToken(access);
      // Get user data
      const userResponse = await apiService.auth.getProfile();
      setUser(userResponse.data);
      toast.success('Account created successfully!');
      return { success: true };
    } catch (error) {
      // Use improved error handler
      const errorDetails = apiUtils.handleError(error, 'Registration failed');
      return { success: false, ...errorDetails };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    setToken(null);
    setUser(null);
    toast.success('Logged out successfully');
  };

  const updateProfile = async (profileData) => {
    try {
      const response = await apiService.auth.updateProfile(profileData);
      setUser(response.data);
      toast.success('Profile updated successfully!');
      return true;
    } catch (error) {
      apiUtils.handleError(error, 'Profile update failed');
      return false;
    }
  };

  const refreshToken = async () => {
    try {
      const refresh = localStorage.getItem('refreshToken');
      if (!refresh) {
        throw new Error('No refresh token');
      }

      const response = await apiService.auth.refreshToken(refresh);

      const { access } = response.data;
      localStorage.setItem('token', access);
      setToken(access);
      return true;
    } catch (error) {
      logout();
      return false;
    }
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    updateProfile,
    refreshToken,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 