import axios from 'axios';

// 1. DYNAMIC BASE URL
// If we are in production, use Render. If local, use localhost.
const BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://next-js-and-typescript-project-with-auth.onrender.com/api' 
  : 'http://localhost:3500/api';

const api = axios.create({
  baseURL: BASE_URL, 
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// ... keep your interceptors exactly as they are ...


// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    console.log('🔵 API Request:', config.method?.toUpperCase(), config.url);
    
    return config;
  },
  (error) => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor - FIXED
api.interceptors.response.use(
  (response) => {
    console.log('✅ API Success:', response.config.url);
    return response;
  },
  (error) => {
    // FIXED ERROR LOGGING
    const errorDetails = {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      statusText: error.response?.statusText,
      message: error.message
    };
    
    console.error('❌ API Error:', errorDetails);
    
    // Check if it's a network error
    if (!error.response) {
      console.error('❌ Network Error - Backend not responding');
    }
    
    // Auto-logout on 401
    if (error.response?.status === 401) {
      localStorage.clear();
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;