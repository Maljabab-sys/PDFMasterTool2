import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      // First verify authentication
      const authResponse = await authService.verifyAuth();
      if (authResponse.authenticated) {
        // If authenticated, get full profile data including profile image
        try {
          const profileResponse = await authService.getProfile();
          if (profileResponse.success) {
            console.log('AuthContext: Full profile data loaded:', profileResponse.user);
            setUser(profileResponse.user);
            setIsAuthenticated(true);
          } else {
            // Fallback to basic user data if profile fetch fails
            console.log('AuthContext: Using basic user data as fallback');
            setUser(authResponse.user);
            setIsAuthenticated(true);
          }
        } catch (profileError) {
          console.error('AuthContext: Profile fetch failed, using basic user data:', profileError);
          setUser(authResponse.user);
          setIsAuthenticated(true);
        }
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('Auth verification failed:', error);
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await authService.login(email, password);
      if (response.success) {
        // After successful login, get full profile data
        try {
          const profileResponse = await authService.getProfile();
          if (profileResponse.success) {
            console.log('AuthContext: Full profile data loaded after login:', profileResponse.user);
            setUser(profileResponse.user);
            setIsAuthenticated(true);
          } else {
            // Fallback to login response user data
            setUser(response.user);
            setIsAuthenticated(true);
          }
        } catch (profileError) {
          console.error('AuthContext: Profile fetch failed after login, using login user data:', profileError);
          setUser(response.user);
          setIsAuthenticated(true);
        }
        return { success: true };
      } else {
        return { success: false, error: response.message };
      }
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.message || 'Login failed' 
      };
    }
  };

  const register = async (userData) => {
    try {
      const response = await authService.register(userData);
      if (response.success) {
        setUser(response.user);
        setIsAuthenticated(true);
        return { success: true };
      } else {
        return { success: false, error: response.message };
      }
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.message || 'Registration failed' 
      };
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
    setUser(null);
    setIsAuthenticated(false);
  };

  const forgotPassword = async (email) => {
    try {
      await authService.forgotPassword(email);
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.message || 'Failed to send reset email' 
      };
    }
  };

  const resetPassword = async (token, password) => {
    try {
      await authService.resetPassword(token, password);
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.message || 'Password reset failed' 
      };
    }
  };

  const updateProfile = async (profileData) => {
    try {
      console.log('AuthContext updateProfile called with:', profileData);
      const response = await authService.updateProfile(profileData);
      console.log('AuthContext updateProfile response:', response);
      if (response.success) {
        console.log('Updating user state with new profile data:', response.user);
        console.log('Previous user state:', user);
        
        // Force a complete state update by creating a new user object
        const updatedUser = {
          ...response.user,
          // Add a timestamp to force re-render of components that depend on profile image
          _profileUpdateTimestamp: Date.now()
        };
        
        setUser(updatedUser);
        console.log('User state updated with timestamp:', updatedUser);
        
        // Also force a fresh auth check to ensure consistency
        setTimeout(() => {
          console.log('AuthContext: Performing post-update auth check');
          checkAuthStatus();
        }, 500);
        
        return { success: true, user: updatedUser };
      } else {
        console.error('Profile update failed:', response.message);
        return { success: false, error: response.message };
      }
    } catch (error) {
      console.error('AuthContext updateProfile error:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || 'Profile update failed' 
      };
    }
  };

  const value = {
    user,
    isAuthenticated,
    loading,
    login,
    register,
    logout,
    forgotPassword,
    resetPassword,
    updateProfile,
    checkAuthStatus
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 