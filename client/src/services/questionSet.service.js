import api from './api.service.js';

// Question Sets API endpoints
const QUESTION_SETS_PATH = '/questionSets';

// Get all question sets (admin only)
export const getAllQuestionSets = async () => {
  try {
    const response = await api.get(QUESTION_SETS_PATH);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Get question set by ID (admin only)
export const getQuestionSetById = async (questionSetId) => {
  try {
    const response = await api.get(`${QUESTION_SETS_PATH}/${questionSetId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Create question set (admin only)
export const createQuestionSet = async (questionSetData) => {
  try {
    const response = await api.post(QUESTION_SETS_PATH, questionSetData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Update question set (admin only)
export const updateQuestionSet = async (questionSetId, questionSetData) => {
  try {
    const response = await api.put(`${QUESTION_SETS_PATH}/${questionSetId}`, questionSetData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Delete question set (admin only)
export const deleteQuestionSet = async (questionSetId) => {
  try {
    const response = await api.delete(`${QUESTION_SETS_PATH}/${questionSetId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Get all questions for a question set
export const getQuestionSetQuestions = async (questionSetId) => {
  try {
    const response = await api.get(`${QUESTION_SETS_PATH}/${questionSetId}/questions`);
    return response.data;
  } catch (error) {
    throw error;
  }
};