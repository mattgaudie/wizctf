import axios from 'axios';

// Create an axios instance
const api = axios.create({
  baseURL: '',  // Empty base URL will use the proxy in package.json
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add a request interceptor to set the auth token on every request
api.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token');
    console.log('API interceptor - token exists:', token ? 'Yes' : 'No');
    
    if (token) {
      console.log('Setting x-auth-token header');
      config.headers['x-auth-token'] = token;
    }
    
    console.log('Request headers:', config.headers);
    return config;
  },
  error => {
    console.error('API interceptor error:', error);
    return Promise.reject(error);
  }
);

export default api;