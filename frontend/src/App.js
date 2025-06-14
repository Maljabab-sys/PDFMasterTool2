import React, { createContext, useContext, useState, useMemo, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AuthProvider } from './contexts/AuthContext';
import { AIProvider } from './contexts/AIContext';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';
import { SidebarProvider } from './contexts/SidebarContext';
import Navigation from './components/Navigation/Navigation';
import Login from './pages/Login/Login';
import Register from './pages/Register/Register';
import Dashboard from './pages/Dashboard/Dashboard';
import NewCase from './pages/NewCase/NewCase';
import PatientList from './pages/PatientList/PatientList';
import CaseDetail from './pages/CaseDetail/CaseDetail';
import AITest from './pages/AITest/AITest';
import Settings from './pages/Settings/Settings';
import ForgotPassword from './pages/ForgotPassword/ForgotPassword';
import ResetPassword from './pages/ResetPassword/ResetPassword';
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute';
import './App.css';

// Theme Context
const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// Theme Provider Component
const CustomThemeProvider = ({ children }) => {
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : false;
  });

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem('darkMode', JSON.stringify(newMode));
  };

  const theme = useMemo(() => createTheme({
    palette: {
      mode: darkMode ? 'dark' : 'light',
      primary: {
        main: darkMode ? '#90caf9' : '#1976d2',
        light: darkMode ? '#bbdefb' : '#42a5f5',
        dark: darkMode ? '#64b5f6' : '#1565c0',
      },
      secondary: {
        main: darkMode ? '#f48fb1' : '#dc004e',
        light: darkMode ? '#f8bbd9' : '#e91e63',
        dark: darkMode ? '#f06292' : '#c51162',
      },
      background: {
        default: darkMode ? '#0a0a0a' : '#fafafa',
        paper: darkMode ? '#1e1e1e' : '#ffffff',
      },
      surface: {
        main: darkMode ? '#2d2d2d' : '#f5f5f5',
        light: darkMode ? '#3d3d3d' : '#ffffff',
      },
      text: {
        primary: darkMode ? '#ffffff' : '#2c3e50',
        secondary: darkMode ? '#b0b0b0' : '#6c757d',
      },
      divider: darkMode ? '#333333' : '#e0e0e0',
      success: {
        main: darkMode ? '#4caf50' : '#2e7d32',
      },
      warning: {
        main: darkMode ? '#ff9800' : '#ed6c02',
      },
      error: {
        main: darkMode ? '#f44336' : '#d32f2f',
      },
      info: {
        main: darkMode ? '#2196f3' : '#0288d1',
      },
    },
    typography: {
      fontFamily: '"Inter", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      h1: {
        fontWeight: 700,
        fontSize: '2.5rem',
        lineHeight: 1.2,
      },
      h2: {
        fontWeight: 600,
        fontSize: '2rem',
        lineHeight: 1.3,
      },
      h3: {
        fontWeight: 600,
        fontSize: '1.75rem',
        lineHeight: 1.3,
      },
      h4: {
        fontWeight: 600,
        fontSize: '1.5rem',
        lineHeight: 1.4,
      },
      h5: {
        fontWeight: 600,
        fontSize: '1.25rem',
        lineHeight: 1.4,
      },
      h6: {
        fontWeight: 600,
        fontSize: '1rem',
        lineHeight: 1.5,
      },
      body1: {
        fontSize: '1rem',
        lineHeight: 1.6,
      },
      body2: {
        fontSize: '0.875rem',
        lineHeight: 1.6,
      },
      button: {
        fontWeight: 600,
        textTransform: 'none',
        fontSize: '0.875rem',
      },
    },
    shape: {
      borderRadius: 12,
    },
    shadows: darkMode ? [
      'none',
      '0px 2px 4px rgba(0,0,0,0.3)',
      '0px 4px 8px rgba(0,0,0,0.3)',
      '0px 8px 16px rgba(0,0,0,0.3)',
      '0px 12px 24px rgba(0,0,0,0.3)',
      '0px 16px 32px rgba(0,0,0,0.3)',
      // ... more shadows
    ] : [
      'none',
      '0px 2px 4px rgba(0,0,0,0.05)',
      '0px 4px 8px rgba(0,0,0,0.1)',
      '0px 8px 16px rgba(0,0,0,0.1)',
      '0px 12px 24px rgba(0,0,0,0.1)',
      '0px 16px 32px rgba(0,0,0,0.1)',
      // ... more shadows
    ],
    transitions: {
      duration: {
        shortest: 150,
        shorter: 200,
        short: 250,
        standard: 300,
        complex: 375,
        enteringScreen: 225,
        leavingScreen: 195,
      },
      easing: {
        easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
        easeOut: 'cubic-bezier(0.0, 0, 0.2, 1)',
        easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
        sharp: 'cubic-bezier(0.4, 0, 0.6, 1)',
      },
    },
    breakpoints: {
      values: {
        xs: 0,
        sm: 600,
        md: 900,
        lg: 1200,
        xl: 1536,
      },
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            padding: '10px 24px',
            fontSize: '0.875rem',
            fontWeight: 600,
            textTransform: 'none',
            boxShadow: 'none',
            transition: 'all 0.3s cubic-bezier(0.4, 0.0, 0.2, 1)',
            position: 'relative',
            overflow: 'hidden',
            '&:hover': {
              boxShadow: '0px 4px 12px rgba(0,0,0,0.15)',
              transform: 'translateY(-2px)',
            },
            '&:active': {
              transform: 'translateY(0px)',
            },
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: '-100%',
              width: '100%',
              height: '100%',
              background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent)',
              transition: 'left 0.5s',
            },
            '&:hover::before': {
              left: '100%',
            },
          },
          contained: {
            background: darkMode 
              ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
              : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            '&:hover': {
              background: darkMode
                ? 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)'
                : 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
            },
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 16,
            border: darkMode ? '1px solid #333333' : '1px solid #e0e0e0',
            boxShadow: darkMode 
              ? '0px 4px 20px rgba(0,0,0,0.3)'
              : '0px 4px 20px rgba(0,0,0,0.08)',
            transition: 'all 0.3s cubic-bezier(0.4, 0.0, 0.2, 1)',
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: darkMode 
                ? '0px 8px 30px rgba(0,0,0,0.4)'
                : '0px 8px 30px rgba(0,0,0,0.12)',
            },
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            borderRadius: 16,
            border: darkMode ? '1px solid #333333' : '1px solid #e0e0e0',
            transition: 'all 0.3s cubic-bezier(0.4, 0.0, 0.2, 1)',
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              borderRadius: 8,
              backgroundColor: darkMode ? '#2d2d2d' : '#fafafa',
              transition: 'all 0.3s cubic-bezier(0.4, 0.0, 0.2, 1)',
              '&:hover': {
                backgroundColor: darkMode ? '#3d3d3d' : '#f0f0f0',
              },
              '&.Mui-focused': {
                backgroundColor: darkMode ? '#3d3d3d' : '#ffffff',
                transform: 'scale(1.02)',
              },
            },
          },
        },
      },
      MuiIconButton: {
        styleOverrides: {
          root: {
            transition: 'all 0.3s cubic-bezier(0.4, 0.0, 0.2, 1)',
            '&:hover': {
              transform: 'scale(1.1)',
              backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
            },
          },
        },
      },
      MuiListItem: {
        styleOverrides: {
          root: {
            transition: 'all 0.3s cubic-bezier(0.4, 0.0, 0.2, 1)',
            borderRadius: 8,
            margin: '4px 0',
            '&:hover': {
              backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)',
              transform: 'translateX(8px)',
            },
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            transition: 'all 0.3s cubic-bezier(0.4, 0.0, 0.2, 1)',
            '&:hover': {
              transform: 'scale(1.05)',
            },
          },
        },
      },
      MuiAvatar: {
        styleOverrides: {
          root: {
            transition: 'all 0.3s cubic-bezier(0.4, 0.0, 0.2, 1)',
            '&:hover': {
              transform: 'scale(1.1)',
            },
          },
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: {
            transition: 'transform 0.3s cubic-bezier(0.4, 0.0, 0.2, 1)',
          },
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: {
            borderRadius: 16,
            animation: 'slideInUp 0.3s cubic-bezier(0.4, 0.0, 0.2, 1)',
          },
        },
      },
      MuiSnackbar: {
        styleOverrides: {
          root: {
            '& .MuiSnackbarContent-root': {
              borderRadius: 12,
              animation: 'slideInRight 0.3s cubic-bezier(0.4, 0.0, 0.2, 1)',
            },
          },
        },
      },
    },
  }), [darkMode]);

  const contextValue = useMemo(() => ({
    darkMode,
    toggleDarkMode,
    theme,
  }), [darkMode, theme]);

  return (
    <ThemeContext.Provider value={contextValue}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ThemeContext.Provider>
  );
};

export const useCustomTheme = () => useContext(ThemeContext);

function App() {
  return (
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  );
}

function AppContent() {
  const { isRTL } = useLanguage();

  useEffect(() => {
    document.dir = isRTL ? 'rtl' : 'ltr';
    document.documentElement.setAttribute('dir', isRTL ? 'rtl' : 'ltr');
  }, [isRTL]);

  return (
    <CustomThemeProvider>
      <AuthProvider>
        <AIProvider>
          <SidebarProvider>
            <Router>
    <div className="App">
              <Routes>
                {/* Public Routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                
                {/* Protected Routes with Navigation */}
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={
                  <ProtectedRoute>
                    <Navigation>
                      <Dashboard />
                    </Navigation>
                  </ProtectedRoute>
                } />
                <Route path="/new-case" element={
                  <ProtectedRoute>
                    <Navigation>
                      <NewCase />
                    </Navigation>
                  </ProtectedRoute>
                } />
                <Route path="/patients" element={
                  <ProtectedRoute>
                    <Navigation>
                      <PatientList />
                    </Navigation>
                  </ProtectedRoute>
                } />
                <Route path="/case/:id" element={
                  <ProtectedRoute>
                    <Navigation>
                      <CaseDetail />
                    </Navigation>
                  </ProtectedRoute>
                } />
                <Route path="/ai-test" element={
                  <ProtectedRoute>
                    <Navigation>
                      <AITest />
                    </Navigation>
                  </ProtectedRoute>
                } />
                <Route path="/settings" element={
                  <ProtectedRoute>
                    <Navigation>
                      <Settings />
                    </Navigation>
                  </ProtectedRoute>
                } />
              </Routes>
    </div>
          </Router>
          </SidebarProvider>
        </AIProvider>
      </AuthProvider>
    </CustomThemeProvider>
  );
}

export default App;
