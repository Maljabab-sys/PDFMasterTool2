import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  InputAdornment,
  IconButton,
  useTheme,
  useMediaQuery,
  Fade,
  Slide,
  Zoom,
  CircularProgress,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import {
  Person as PersonIcon,
  Email as EmailIcon,
  Lock as LockIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  PersonAdd as PersonAddIcon,
  Login as LoginIcon,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { useCustomTheme } from '../../App';

// Reuse styled components from Login with some modifications
const RegisterContainer = styled(Container)(({ theme }) => ({
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  position: 'relative',
  background: theme.palette.mode === 'dark'
    ? 'linear-gradient(135deg, #0c0c0c 0%, #1a1a1a 25%, #2d2d2d 50%, #1a1a1a 75%, #0c0c0c 100%)'
    : 'linear-gradient(135deg, #f093fb 0%, #f5576c 25%, #667eea 50%, #764ba2 75%, #4facfe 100%)',
  backgroundSize: '400% 400%',
  animation: 'gradientShift 15s ease infinite',
  overflow: 'hidden',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: theme.palette.mode === 'dark'
      ? 'radial-gradient(circle at 80% 20%, rgba(240, 147, 251, 0.1) 0%, transparent 50%), radial-gradient(circle at 20% 80%, rgba(102, 126, 234, 0.1) 0%, transparent 50%)'
      : 'radial-gradient(circle at 80% 20%, rgba(255, 255, 255, 0.2) 0%, transparent 50%), radial-gradient(circle at 20% 80%, rgba(255, 255, 255, 0.1) 0%, transparent 50%)',
    animation: 'float 20s ease-in-out infinite',
  },
  '@keyframes gradientShift': {
    '0%': { backgroundPosition: '0% 50%' },
    '50%': { backgroundPosition: '100% 50%' },
    '100%': { backgroundPosition: '0% 50%' },
  },
  '@keyframes float': {
    '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
    '33%': { transform: 'translateY(-20px) rotate(1deg)' },
    '66%': { transform: 'translateY(10px) rotate(-1deg)' },
  },
}));

const GlassCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  borderRadius: 24,
  background: theme.palette.mode === 'dark'
    ? 'rgba(30, 30, 30, 0.8)'
    : 'rgba(255, 255, 255, 0.9)',
  backdropFilter: 'blur(20px)',
  border: `1px solid ${theme.palette.mode === 'dark' 
    ? 'rgba(255, 255, 255, 0.1)' 
    : 'rgba(255, 255, 255, 0.3)'}`,
  boxShadow: theme.palette.mode === 'dark'
    ? '0 20px 40px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
    : '0 20px 40px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.6)',
  position: 'relative',
  overflow: 'hidden',
  transition: 'all 0.4s cubic-bezier(0.4, 0.0, 0.2, 1)',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2,
    background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 50%, #667eea 100%)',
    animation: 'shimmer 3s ease-in-out infinite',
  },
  '&:hover': {
    transform: 'translateY(-4px) scale(1.01)',
    boxShadow: theme.palette.mode === 'dark'
      ? '0 25px 50px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.15)'
      : '0 25px 50px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.8)',
  },
  '@keyframes shimmer': {
    '0%': { transform: 'translateX(-100%)' },
    '100%': { transform: 'translateX(100%)' },
  },
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(3),
    borderRadius: 16,
    margin: theme.spacing(2),
  },
}));

const StyledTextField = styled(TextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    borderRadius: 12,
    transition: 'all 0.3s cubic-bezier(0.4, 0.0, 0.2, 1)',
    background: theme.palette.mode === 'dark'
      ? 'rgba(255, 255, 255, 0.05)'
      : 'rgba(255, 255, 255, 0.8)',
    backdropFilter: 'blur(10px)',
    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow: '0 4px 12px rgba(240, 147, 251, 0.2)',
    },
    '&.Mui-focused': {
      transform: 'translateY(-2px)',
      boxShadow: '0 6px 16px rgba(240, 147, 251, 0.3)',
      '& fieldset': {
        borderColor: theme.palette.secondary.main,
        borderWidth: 2,
      },
    },
    '& fieldset': {
      borderColor: theme.palette.mode === 'dark'
        ? 'rgba(255, 255, 255, 0.2)'
        : 'rgba(0, 0, 0, 0.1)',
      transition: 'all 0.3s ease',
    },
  },
  '& .MuiInputLabel-root': {
    fontWeight: 500,
    '&.Mui-focused': {
      color: theme.palette.secondary.main,
      fontWeight: 600,
    },
  },
}));

const GradientButton = styled(Button)(({ theme, variant = 'primary' }) => {
  const gradients = {
    primary: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    secondary: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  };
  
  return {
    borderRadius: 12,
    padding: '12px 32px',
    fontSize: '1rem',
    fontWeight: 600,
    textTransform: 'none',
    position: 'relative',
    overflow: 'hidden',
    background: gradients[variant],
    color: 'white',
    border: 'none',
    boxShadow: `0 4px 15px ${variant === 'primary' ? 'rgba(240, 147, 251, 0.4)' : 'rgba(102, 126, 234, 0.4)'}`,
    transition: 'all 0.3s cubic-bezier(0.4, 0.0, 0.2, 1)',
    '&::before': {
      content: '""',
      position: 'absolute',
      top: 0,
      left: '-100%',
      width: '100%',
      height: '100%',
      background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent)',
      transition: 'left 0.5s',
    },
    '&:hover': {
      transform: 'translateY(-2px) scale(1.02)',
      boxShadow: `0 8px 25px ${variant === 'primary' ? 'rgba(240, 147, 251, 0.6)' : 'rgba(102, 126, 234, 0.6)'}`,
      '&::before': {
        left: '100%',
      },
    },
    '&:active': {
      transform: 'translateY(0) scale(1)',
    },
    '&:disabled': {
      background: theme.palette.mode === 'dark' ? '#333' : '#ccc',
      color: theme.palette.mode === 'dark' ? '#666' : '#999',
      boxShadow: 'none',
      transform: 'none',
    },
  };
});

const AnimatedIcon = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 80,
  height: 80,
  borderRadius: '50%',
  background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  margin: '0 auto 24px',
  boxShadow: '0 8px 25px rgba(240, 147, 251, 0.4)',
  animation: 'pulse 2s ease-in-out infinite',
  '& svg': {
    fontSize: 40,
    color: 'white',
  },
  '@keyframes pulse': {
    '0%': { transform: 'scale(1)', boxShadow: '0 8px 25px rgba(240, 147, 251, 0.4)' },
    '50%': { transform: 'scale(1.05)', boxShadow: '0 12px 35px rgba(240, 147, 251, 0.6)' },
    '100%': { transform: 'scale(1)', boxShadow: '0 8px 25px rgba(240, 147, 251, 0.4)' },
  },
}));

const FloatingElement = styled(Box)(({ theme, delay = 0, size = 60 }) => ({
  position: 'absolute',
  width: size,
  height: size,
  borderRadius: '50%',
  background: theme.palette.mode === 'dark'
    ? 'linear-gradient(135deg, rgba(240, 147, 251, 0.1) 0%, rgba(245, 87, 108, 0.1) 100%)'
    : 'linear-gradient(135deg, rgba(255, 255, 255, 0.2) 0%, rgba(255, 255, 255, 0.1) 100%)',
  backdropFilter: 'blur(10px)',
  animation: `float 6s ease-in-out infinite ${delay}s`,
  '@keyframes float': {
    '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
    '50%': { transform: 'translateY(-20px) rotate(180deg)' },
  },
}));

const Register = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const { darkMode } = useCustomTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { register } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [animationTrigger, setAnimationTrigger] = useState(false);

  useEffect(() => {
    setAnimationTrigger(true);
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (error) setError('');
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError('Name is required');
      return false;
    }
    if (!formData.email.trim()) {
      setError('Email is required');
      return false;
    }
    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      setError('Please enter a valid email address');
      return false;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      await register(formData.name, formData.email, formData.password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  return (
    <RegisterContainer maxWidth={false}>
      {/* Floating Background Elements */}
      <FloatingElement 
        style={{ top: '15%', right: '10%' }} 
        delay={0} 
        size={90} 
      />
      <FloatingElement 
        style={{ top: '25%', left: '15%' }} 
        delay={1.5} 
        size={70} 
      />
      <FloatingElement 
        style={{ bottom: '20%', right: '20%' }} 
        delay={2.5} 
        size={110} 
      />
      <FloatingElement 
        style={{ bottom: '30%', left: '10%' }} 
        delay={1} 
        size={80} 
      />

      <Fade in={animationTrigger} timeout={800}>
        <Box sx={{ width: '100%', maxWidth: 520, position: 'relative', zIndex: 1 }}>
          <Slide direction="up" in={animationTrigger} timeout={1000}>
            <GlassCard elevation={0}>
              <Box component="form" onSubmit={handleSubmit}>
                {/* Logo/Icon */}
                <Zoom in={animationTrigger} timeout={1200} style={{ transitionDelay: '200ms' }}>
                  <AnimatedIcon>
                    <PersonAddIcon />
                  </AnimatedIcon>
                </Zoom>

                {/* Title */}
                <Slide direction="down" in={animationTrigger} timeout={800} style={{ transitionDelay: '400ms' }}>
                  <Box sx={{ textAlign: 'center', mb: 4 }}>
                    <Typography 
                      variant={isMobile ? "h4" : "h3"} 
                      component="h1" 
                      sx={{ 
                        fontWeight: 700,
                        background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                        backgroundClip: 'text',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        mb: 1,
                      }}
                    >
                      Join DentalAI
                    </Typography>
                    <Typography 
                      variant="body1" 
                      color="text.secondary"
                      sx={{ fontWeight: 500 }}
                    >
                      Create your account to get started
                    </Typography>
                  </Box>
                </Slide>

                {/* Error Alert */}
                {error && (
                  <Slide direction="left" in={Boolean(error)} timeout={400}>
                    <Alert 
                      severity="error" 
                      sx={{ 
                        mb: 3, 
                        borderRadius: 2,
                        animation: 'shake 0.5s ease-in-out',
                        '@keyframes shake': {
                          '0%, 100%': { transform: 'translateX(0)' },
                          '25%': { transform: 'translateX(-4px)' },
                          '75%': { transform: 'translateX(4px)' },
                        },
                      }}
                    >
                      {error}
                    </Alert>
                  </Slide>
                )}

                {/* Form Fields */}
                <Box sx={{ mb: 3 }}>
                  <Slide direction="right" in={animationTrigger} timeout={600} style={{ transitionDelay: '600ms' }}>
                    <StyledTextField
                      fullWidth
                      label="Full Name"
                      name="name"
                      type="text"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      autoComplete="name"
                      autoFocus
                      sx={{ mb: 3 }}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <PersonIcon color="secondary" />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Slide>

                  <Slide direction="left" in={animationTrigger} timeout={600} style={{ transitionDelay: '700ms' }}>
                    <StyledTextField
                      fullWidth
                      label="Email Address"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      autoComplete="email"
                      sx={{ mb: 3 }}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <EmailIcon color="secondary" />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Slide>

                  <Slide direction="right" in={animationTrigger} timeout={600} style={{ transitionDelay: '800ms' }}>
                    <StyledTextField
                      fullWidth
                      label="Password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={handleChange}
                      required
                      autoComplete="new-password"
                      sx={{ mb: 3 }}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <LockIcon color="secondary" />
                          </InputAdornment>
                        ),
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              onClick={togglePasswordVisibility}
                              edge="end"
                              sx={{
                                transition: 'all 0.3s ease',
                                '&:hover': {
                                  transform: 'scale(1.1)',
                                  color: 'secondary.main',
                                },
                              }}
                            >
                              {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Slide>

                  <Slide direction="left" in={animationTrigger} timeout={600} style={{ transitionDelay: '900ms' }}>
                    <StyledTextField
                      fullWidth
                      label="Confirm Password"
                      name="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      required
                      autoComplete="new-password"
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <LockIcon color="secondary" />
                          </InputAdornment>
                        ),
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              onClick={toggleConfirmPasswordVisibility}
                              edge="end"
                              sx={{
                                transition: 'all 0.3s ease',
                                '&:hover': {
                                  transform: 'scale(1.1)',
                                  color: 'secondary.main',
                                },
                              }}
                            >
                              {showConfirmPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Slide>
                </Box>

                {/* Submit Button */}
                <Zoom in={animationTrigger} timeout={600} style={{ transitionDelay: '1000ms' }}>
                  <GradientButton
                    type="submit"
                    fullWidth
                    size="large"
                    disabled={loading}
                    sx={{ mb: 3 }}
                  >
                    {loading ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CircularProgress size={20} color="inherit" />
                        Creating Account...
                      </Box>
                    ) : (
                      'Create Account'
                    )}
                  </GradientButton>
                </Zoom>

                {/* Login Link */}
                <Fade in={animationTrigger} timeout={800} style={{ transitionDelay: '1200ms' }}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Already have an account?
                    </Typography>
                    <GradientButton
                      component={Link}
                      to="/login"
                      variant="secondary"
                      startIcon={<LoginIcon />}
                      sx={{ 
                        textDecoration: 'none',
                        display: 'inline-flex',
                        alignItems: 'center',
                      }}
                    >
                      Sign In
                    </GradientButton>
                  </Box>
                </Fade>
              </Box>
            </GlassCard>
          </Slide>
        </Box>
      </Fade>
    </RegisterContainer>
  );
};

export default Register; 