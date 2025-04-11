import axios from 'axios';

// Create an axios instance
const api = axios.create({
  baseURL: '/api',  // Relative URL will work with proxy in development and with production build
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add a request interceptor to add the auth token to every request
api.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token');
    
    if (token) {
      config.headers['x-auth-token'] = token;
    }
    
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle common errors
api.interceptors.response.use(
  response => response,
  error => {
    // Handle 401 (Unauthorized) errors
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    
    return Promise.reject(error);
  }
);

export default api;