import axios from 'axios';
import api from './api.service.js';

// Create auth endpoint - relative path works with proxy in development and production
const AUTH_PATH = '/auth';

// Login user
export const login = async (userData) => {
  try {
    const response = await axios.post(`/api${AUTH_PATH}/login`, userData);
    
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
    }
    
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Register user
export const register = async (userData) => {
  try {
    const response = await axios.post(`/api${AUTH_PATH}/register`, userData);
    
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
    }
    
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Get current user
export const getCurrentUser = async () => {
  try {
    const token = localStorage.getItem('token');
    
    if (!token) {
      return null;
    }
    
    // Use API instance with auth headers already set
    const response = await api.get(`${AUTH_PATH}/me`);
    
    return response.data;
  } catch (error) {
    localStorage.removeItem('token');
    throw error;
  }
};

// Reset password
export const resetPassword = async (passwordData) => {
  try {
    const response = await api.put(`${AUTH_PATH}/reset-password`, passwordData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Logout user
export const logout = () => {
  localStorage.removeItem('token');
};

// Get token from localStorage
export const getToken = () => {
  return localStorage.getItem('token');
};

// Check if user is authenticated
export const isAuthenticated = () => {
  return !!localStorage.getItem('token');
};