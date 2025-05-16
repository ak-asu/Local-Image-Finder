import axios from 'axios';

// Check if we're in development mode
const isDev = process.env.NODE_ENV === 'development';

// Define API base URL - adjust this based on your actual backend setup
const API_BASE_URL = isDev 
  ? 'http://localhost:8000' // Development API URL
  : 'http://localhost:8000'; // Production API URL (change when deployed)

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  // Add a timeout to prevent hanging requests
  timeout: 10000,
});

// Add request interceptor for authentication if needed
api.interceptors.request.use(
  (config) => {
    // Add auth token if available
    // const token = localStorage.getItem('auth_token');
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`;
    // }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Log errors but don't crash the app
    console.error('API Error:', error.message);
    
    // Check if error is due to network issues
    if (!error.response) {
      console.warn('Network error or API server not running');
    }
    
    return Promise.reject(error);
  }
);

export default api;
