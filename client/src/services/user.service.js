import api from './api.service.js';

// User API endpoints
const USERS_PATH = '/users';

// Update user profile
export const updateProfile = async (profileData) => {
  try {
    const response = await api.put(`${USERS_PATH}/profile`, profileData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Upload profile picture
export const uploadProfilePicture = async (formData) => {
  try {
    const response = await api.post(`${USERS_PATH}/profile-picture`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Delete user
export const deleteUser = async (userId) => {
  try {
    const response = await api.delete(`${USERS_PATH}/${userId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};