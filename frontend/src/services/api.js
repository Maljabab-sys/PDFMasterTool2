import axios from 'axios';

// Create axios instance with session-based authentication
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5001',
  timeout: 30000,
  withCredentials: true,  // CRITICAL: Send cookies with requests
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - no longer need to add auth tokens
api.interceptors.request.use(
  (config) => {
    // Remove token-based auth - we're using session cookies now
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Session expired or invalid - redirect to login
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Create multipart form data axios instance for file uploads
export const apiMultipart = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5001',
  timeout: 60000,
  withCredentials: true,  // CRITICAL: Send cookies with requests
  headers: {
    'Content-Type': 'multipart/form-data',
  },
});

// Request interceptor for multipart requests - no tokens needed
apiMultipart.interceptors.request.use(
  (config) => {
    // Remove token-based auth - we're using session cookies now
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for multipart requests  
apiMultipart.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    if (error.response?.status === 401) {
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api; 