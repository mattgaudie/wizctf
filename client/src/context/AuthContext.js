import React, { createContext, useReducer, useContext, useEffect } from 'react';
import * as authService from '../services/auth.service';

// Initial state
const initialState = {
  token: localStorage.getItem('token'),
  isAuthenticated: false,
  user: null,
  loading: true,
  error: null
};

// Create context
const AuthContext = createContext(initialState);

// Reducer
const authReducer = (state, action) => {
  switch (action.type) {
    case 'USER_LOADED':
      return {
        ...state,
        isAuthenticated: true,
        user: action.payload,
        loading: false
      };
    case 'LOGIN_SUCCESS':
    case 'REGISTER_SUCCESS':
      return {
        ...state,
        token: action.payload.token,
        user: action.payload.user,
        isAuthenticated: true,
        loading: false,
        error: null
      };
    case 'AUTH_ERROR':
    case 'LOGIN_FAIL':
    case 'REGISTER_FAIL':
    case 'LOGOUT':
      localStorage.removeItem('token');
      return {
        ...state,
        token: null,
        isAuthenticated: false,
        user: null,
        loading: false,
        error: action.payload
      };
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null
      };
    case 'UPDATE_USER':
      return {
        ...state,
        user: action.payload
      };
    default:
      return state;
  }
};

// Provider component
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Load user
  const loadUser = async () => {
    try {
      if (!authService.isAuthenticated()) {
        dispatch({ type: 'AUTH_ERROR' });
        return;
      }

      const user = await authService.getCurrentUser();
      
      dispatch({
        type: 'USER_LOADED',
        payload: user
      });
    } catch (err) {
      dispatch({
        type: 'AUTH_ERROR',
        payload: err.response?.data?.msg || 'Authentication error'
      });
    }
  };

  // Register user
  const register = async (formData) => {
    try {
      const userData = await authService.register(formData);
      
      // Store token in localStorage first
      if (userData.token) {
        localStorage.setItem('token', userData.token);
      }
      
      // Fetch the complete user data from MongoDB
      const fullUserData = await authService.getCurrentUser();
      
      dispatch({
        type: 'REGISTER_SUCCESS',
        payload: {
          token: userData.token,
          user: fullUserData || userData.user || null
        }
      });
    } catch (err) {
      dispatch({
        type: 'REGISTER_FAIL',
        payload: err.response?.data?.msg || 'Registration failed'
      });
    }
  };

  // Login user
  const login = async (formData) => {
    try {
      const userData = await authService.login(formData);
      
      // Store token in localStorage first
      if (userData.token) {
        localStorage.setItem('token', userData.token);
      }
      
      // Use the user data directly from the login response
      // It already has the displayName field set by the server
      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: {
          token: userData.token,
          user: userData.user
        }
      });
    } catch (err) {
      console.error('Login error:', err);
      dispatch({
        type: 'LOGIN_FAIL',
        payload: err.response?.data?.msg || 'Login failed'
      });
    }
  };

  // Logout
  const logout = () => {
    authService.logout();
    dispatch({ type: 'LOGOUT' });
  };

  // Clear error
  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  // Update user
  const updateUser = (userData) => {
    dispatch({
      type: 'UPDATE_USER',
      payload: userData
    });
  };

  // Check authentication status on initial load
  useEffect(() => {
    if (authService.isAuthenticated()) {
      loadUser();
    } else {
      dispatch({ type: 'AUTH_ERROR' });
    }
    // eslint-disable-next-line
  }, []);

  return (
    <AuthContext.Provider
      value={{
        token: state.token,
        isAuthenticated: state.isAuthenticated,
        user: state.user,
        loading: state.loading,
        error: state.error,
        register,
        login,
        logout,
        clearError,
        loadUser,
        updateUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = () => useContext(AuthContext);

export default AuthContext;