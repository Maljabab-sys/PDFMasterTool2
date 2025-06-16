import api from './api';

export const authService = {
  // Login user
  login: async (email, password) => {
    const response = await api.post('/api/auth/login', {
      email,
      password,
    });
    return response;
  },

  // Register new user
  register: async (userData) => {
    const response = await api.post('/api/auth/register', userData);
    return response;
  },

  // Verify authentication status (session-based)
  verifyAuth: async () => {
    const response = await api.get('/api/auth/verify');
    return response;
  },

  // Forgot password
  forgotPassword: async (email) => {
    const response = await api.post('/api/auth/forgot-password', {
      email,
    });
    return response;
  },

  // Reset password
  resetPassword: async (token, password) => {
    const response = await api.post('/api/auth/reset-password', {
      token,
      password,
    });
    return response;
  },

  // Logout
  logout: async () => {
    const response = await api.post('/api/auth/logout');
    return response;
  },

  // Get current user
  getCurrentUser: async () => {
    const response = await api.get('/api/auth/me');
    return response;
  },

  // Get user profile (full profile data)
  getProfile: async () => {
    const response = await api.get('/api/auth/profile');
    return response;
  },

  // Update user profile
  updateProfile: async (userData) => {
    const response = await api.put('/api/auth/profile', userData);
    return response;
  },

  // Change password
  changePassword: async (currentPassword, newPassword) => {
    const response = await api.post('/api/auth/change-password', {
      current_password: currentPassword,
      new_password: newPassword,
    });
    return response;
  },
}; 