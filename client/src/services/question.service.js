import api from './api.service.js';

// Questions API endpoints
const QUESTIONS_PATH = '/questions';

// Get all questions (admin only)
export const getAllQuestions = async () => {
  try {
    const response = await api.get(QUESTIONS_PATH);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Get question by ID (admin only)
export const getQuestionById = async (questionId) => {
  try {
    const response = await api.get(`${QUESTIONS_PATH}/${questionId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Create question (admin only)
export const createQuestion = async (questionData) => {
  try {
    const response = await api.post(QUESTIONS_PATH, questionData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Update question (admin only)
export const updateQuestion = async (questionId, questionData) => {
  try {
    const response = await api.put(`${QUESTIONS_PATH}/${questionId}`, questionData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Delete question (admin only)
export const deleteQuestion = async (questionId) => {
  try {
    const response = await api.delete(`${QUESTIONS_PATH}/${questionId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};