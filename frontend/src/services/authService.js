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

  // Verify token
  verifyToken: async (token) => {
    const response = await api.get('/api/auth/verify', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
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
    try {
      await api.post('/api/auth/logout');
    } catch (error) {
      // Even if logout fails on server, clear local storage
      console.error('Logout error:', error);
    }
    localStorage.removeItem('auth_token');
  },

  // Get current user
  getCurrentUser: async () => {
    const response = await api.get('/api/auth/me');
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