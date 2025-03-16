import axios, { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { store } from '../store';
import { addNotification } from '../store/slices/uiSlice';

// Create axios instance with default config
const api = axios.create({
  baseURL: process.env.NODE_ENV === 'development' 
    ? 'http://localhost:8000' 
    : 'http://localhost:8000',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Request interceptor
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // If the data is FormData, let axios set the correct content-type header
    if (config.data instanceof FormData) {
      config.headers.set('Content-Type', 'multipart/form-data');
    }
    return config;
  },
  (error: AxiosError) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error: AxiosError) => {
    // Handle different error scenarios
    const { response } = error;
    const errorMessage = response?.data || error.message || 'Unknown error occurred';
    
    // Display notification based on error type
    if (response) {
      switch (response.status) {
        case 401:
          console.error('Unauthorized:', errorMessage);
          store.dispatch(addNotification({
            type: 'error',
            message: 'Authentication error. Please try again.',
            duration: 5000,
          }));
          break;
        
        case 404:
          console.error('Not found:', errorMessage);
          store.dispatch(addNotification({
            type: 'error',
            message: `Resource not found: ${errorMessage}`,
            duration: 5000,
          }));
          break;
          
        case 500:
          console.error('Server error:', errorMessage);
          store.dispatch(addNotification({
            type: 'error',
            message: 'Server error occurred. Please try again later.',
            duration: 5000,
          }));
          break;
          
        default:
          console.error('API error:', errorMessage);
          store.dispatch(addNotification({
            type: 'error',
            message: `Error: ${errorMessage}`,
            duration: 5000,
          }));
      }
    } else {
      // Network error
      console.error('Network error:', error);
      store.dispatch(addNotification({
        type: 'error',
        message: 'Network error. Please check your connection.',
        duration: 5000,
      }));
    }
    
    return Promise.reject(error);
  }
);

export default api;
