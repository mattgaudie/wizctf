import api from './api.service.js';

// Admin API endpoints
const ADMIN_PATH = '/admin';

// Get all users (admin only)
export const getAllUsers = async () => {
  try {
    const response = await api.get(`${ADMIN_PATH}/users`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Get user by ID (admin only)
export const getUserById = async (userId) => {
  try {
    const response = await api.get(`${ADMIN_PATH}/users/${userId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Update user (admin only)
export const updateUser = async (userId, userData) => {
  try {
    const response = await api.put(`${ADMIN_PATH}/users/${userId}`, userData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Create user (admin only)
export const createUser = async (userData) => {
  try {
    const response = await api.post(`${ADMIN_PATH}/users`, userData);
    return response.data;
  } catch (error) {
    throw error;
  }
};