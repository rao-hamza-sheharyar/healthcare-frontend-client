import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
    // Debug logging for appointment requests
    if (config.url?.includes('appointments')) {
      console.log('🚀 API Request - URL:', config.url);
      console.log('🚀 API Request - Method:', config.method?.toUpperCase());
      console.log('🚀 API Request - Token sent:', token.substring(0, 30) + '...');
      console.log('🚀 API Request - Headers:', {
        'Authorization': 'Bearer ' + token.substring(0, 20) + '...',
        'Content-Type': config.headers['Content-Type']
      });
    }
  } else {
    console.warn('⚠️ No token found in localStorage for request:', config.url);
  }
  return config;
}, (error) => {
  console.error('❌ Request interceptor error:', error);
  return Promise.reject(error);
});

// Handle 401 errors - token expired or invalid
api.interceptors.response.use(
  (response) => {
    // Log successful responses for appointment requests
    if (response.config.url?.includes('appointments')) {
      console.log('✅ API Response - Status:', response.status, 'URL:', response.config.url);
    }
    return response;
  },
  (error) => {
    // Log error responses
    if (error.config?.url?.includes('appointments')) {
      console.error('❌ API Error Response - URL:', error.config.url);
      console.error('❌ API Error Response - Status:', error.response?.status);
      console.error('❌ API Error Response - Data:', error.response?.data);
    }
    
    if (error.response?.status === 401) {
      console.error('❌ 401 Unauthorized - Clearing token');
      const token = localStorage.getItem('token');
      console.error('❌ Token before clearing:', token ? token.substring(0, 20) + '...' : 'NONE');
      
      // Clear invalid token
      localStorage.removeItem('token');
      
      // Redirect to login or show error
      if (window.location.pathname !== '/login') {
        console.error('❌ Authentication failed - please login again');
      }
    }
    return Promise.reject(error);
  }
);

export default api;

