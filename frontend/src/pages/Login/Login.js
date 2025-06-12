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
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import {
  Email as EmailIcon,
  Lock as LockIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Login as LoginIcon,
  PersonAdd as PersonAddIcon,
  Language as LanguageIcon,
  CheckCircleOutline as CheckCircleOutlineIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { useCustomTheme } from '../../App';
import { useLanguage } from '../../contexts/LanguageContext';

// Styled Components with Enhanced Animations
const LoginContainer = styled(Container)(({ theme }) => ({
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  position: 'relative',
  background: theme.palette.mode === 'dark'
    ? 'linear-gradient(135deg, #0c0c0c 0%, #1a1a1a 25%, #2d2d2d 50%, #1a1a1a 75%, #0c0c0c 100%)'
    : 'linear-gradient(135deg, #667eea 0%, #764ba2 25%, #f093fb 50%, #f5576c 75%, #4facfe 100%)',
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
      ? 'radial-gradient(circle at 20% 80%, rgba(102, 126, 234, 0.1) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(244, 143, 177, 0.1) 0%, transparent 50%)'
      : 'radial-gradient(circle at 20% 80%, rgba(255, 255, 255, 0.2) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255, 255, 255, 0.1) 0%, transparent 50%)',
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
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
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
      boxShadow: '0 4px 12px rgba(102, 126, 234, 0.2)',
    },
    '&.Mui-focused': {
      transform: 'translateY(-2px)',
      boxShadow: '0 6px 16px rgba(102, 126, 234, 0.3)',
      '& fieldset': {
        borderColor: theme.palette.primary.main,
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
      color: theme.palette.primary.main,
      fontWeight: 600,
    },
  },
}));

const GradientButton = styled(Button)(({ theme, variant = 'primary' }) => {
  const gradients = {
    primary: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    secondary: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
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
    boxShadow: `0 4px 15px ${variant === 'primary' ? 'rgba(102, 126, 234, 0.4)' : 'rgba(240, 147, 251, 0.4)'}`,
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
      boxShadow: `0 8px 25px ${variant === 'primary' ? 'rgba(102, 126, 234, 0.6)' : 'rgba(240, 147, 251, 0.6)'}`,
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
  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  margin: '0 auto 24px',
  boxShadow: '0 8px 25px rgba(102, 126, 234, 0.4)',
  animation: 'pulse 2s ease-in-out infinite',
  '& svg': {
    fontSize: 40,
    color: 'white',
  },
  '@keyframes pulse': {
    '0%': { transform: 'scale(1)', boxShadow: '0 8px 25px rgba(102, 126, 234, 0.4)' },
    '50%': { transform: 'scale(1.05)', boxShadow: '0 12px 35px rgba(102, 126, 234, 0.6)' },
    '100%': { transform: 'scale(1)', boxShadow: '0 8px 25px rgba(102, 126, 234, 0.4)' },
  },
}));

const FloatingElement = styled(Box)(({ theme, delay = 0, size = 60 }) => ({
  position: 'absolute',
  width: size,
  height: size,
  borderRadius: '50%',
  background: theme.palette.mode === 'dark'
    ? 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)'
    : 'linear-gradient(135deg, rgba(255, 255, 255, 0.2) 0%, rgba(255, 255, 255, 0.1) 100%)',
  backdropFilter: 'blur(10px)',
  animation: `float 6s ease-in-out infinite ${delay}s`,
  '@keyframes float': {
    '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
    '50%': { transform: 'translateY(-20px) rotate(180deg)' },
  },
}));

const Login = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const { darkMode } = useCustomTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { login } = useAuth();
  const { t, isRTL, toggleLanguage } = useLanguage();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [animationTrigger, setAnimationTrigger] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  useEffect(() => {
    setAnimationTrigger(true);
    // On mount, check localStorage for remembered email and password
    const remembered = localStorage.getItem('rememberMe') === 'true';
    const rememberedEmail = localStorage.getItem('rememberedEmail') || '';
    const rememberedPassword = localStorage.getItem('rememberedPassword') || '';
    if (remembered && rememberedEmail) {
      setFormData(prev => ({ ...prev, email: rememberedEmail, password: rememberedPassword }));
      setRememberMe(true);
    }
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === 'checkbox') {
      setRememberMe(checked);
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
      if (error) setError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(formData.email, formData.password);
      // Remember Me logic (SECURITY NOTE: Storing passwords in localStorage is not recommended for production)
      if (rememberMe) {
        localStorage.setItem('rememberMe', 'true');
        localStorage.setItem('rememberedEmail', formData.email);
        localStorage.setItem('rememberedPassword', formData.password);
      } else {
        localStorage.removeItem('rememberMe');
        localStorage.removeItem('rememberedEmail');
        localStorage.removeItem('rememberedPassword');
      }
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || t('loginFailed'));
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <LoginContainer maxWidth={false}>
      {/* Language Toggle Button */}
      <Box sx={{ position: 'absolute', top: 20, right: 20, zIndex: 2 }}>
        <IconButton
          onClick={toggleLanguage}
          sx={{
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            color: 'white',
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              transform: 'scale(1.1)',
            },
          }}
        >
          <LanguageIcon />
        </IconButton>
      </Box>

      {/* Floating Background Elements */}
      <FloatingElement 
        style={{ top: '10%', left: '10%' }} 
        delay={0} 
        size={80} 
      />
      <FloatingElement 
        style={{ top: '20%', right: '15%' }} 
        delay={1} 
        size={60} 
      />
      <FloatingElement 
        style={{ bottom: '15%', left: '20%' }} 
        delay={2} 
        size={100} 
      />
      <FloatingElement 
        style={{ bottom: '25%', right: '10%' }} 
        delay={0.5} 
        size={70} 
      />

      <Fade in={animationTrigger} timeout={800}>
        <Box sx={{ width: '100%', maxWidth: 480, position: 'relative', zIndex: 1 }}>
          <Slide direction="up" in={animationTrigger} timeout={1000}>
            <GlassCard elevation={0}>
              <Box component="form" onSubmit={handleSubmit}>
                {/* Logo/Icon */}
                <Zoom in={animationTrigger} timeout={1200} style={{ transitionDelay: '200ms' }}>
                  <AnimatedIcon>
                    <LoginIcon />
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
                        color: theme.palette.primary.main,
                        mb: 1,
                      }}
                    >
                      {t('welcomeBack')}
                    </Typography>
                    <Typography 
                      variant="body1" 
                      color="text.secondary"
                      sx={{ fontWeight: 500 }}
                    >
                      {t('signInAccount')}
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
                  <Slide direction={isRTL ? "left" : "right"} in={animationTrigger} timeout={600} style={{ transitionDelay: '600ms' }}>
                    <StyledTextField
                      fullWidth
                      label={t('email')}
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      autoComplete="email"
                      autoFocus
                      sx={{ mb: 3 }}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <EmailIcon color="primary" />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Slide>

                  <Slide direction={isRTL ? "right" : "left"} in={animationTrigger} timeout={600} style={{ transitionDelay: '700ms' }}>
                    <StyledTextField
                      fullWidth
                      label={t('password')}
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={handleChange}
                      required
                      autoComplete="current-password"
                      sx={{ mb: 2 }}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <LockIcon color="primary" />
                          </InputAdornment>
                        ),
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton onClick={togglePasswordVisibility} edge="end" size="small">
                              {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Slide>

                  {/* Improved Remember Me Checkbox */}
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, mt: -1 }}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={rememberMe}
                          onChange={handleChange}
                          name="rememberMe"
                          color="primary"
                          icon={<CheckCircleOutlineIcon sx={{ fontSize: 28 }} />}
                          checkedIcon={<CheckCircleIcon sx={{ fontSize: 28, color: theme.palette.primary.main }} />}
                          sx={{ p: 0.5 }}
                        />
                      }
                      label={<span style={{ fontSize: 15, color: theme.palette.text.secondary }}>Remember Me</span>}
                      sx={{ ml: 0.5 }}
                    />
                  </Box>
                </Box>

                {/* Submit Button */}
                <Zoom in={animationTrigger} timeout={600} style={{ transitionDelay: '1000ms' }}>
                  <GradientButton
                    type="submit"
                    fullWidth
                    variant="primary"
                    size="large"
                    disabled={loading}
                    startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <LoginIcon />}
                    sx={{ mb: 3 }}
                  >
                    {loading ? t('signingIn') : t('signIn')}
                  </GradientButton>
                </Zoom>

                {/* Register Link */}
                <Fade in={animationTrigger} timeout={600} style={{ transitionDelay: '1200ms' }}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                      {t('dontHaveAccount')}{' '}
                      <Link 
                        to="/register" 
                        style={{ 
                          color: theme.palette.primary.main,
                          textDecoration: 'none',
                          fontWeight: 600,
                          transition: 'all 0.3s ease',
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.textDecoration = 'underline';
                          e.target.style.transform = 'scale(1.05)';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.textDecoration = 'none';
                          e.target.style.transform = 'scale(1)';
                        }}
                      >
                        {t('signUp')}
                      </Link>
                    </Typography>
                  </Box>
                </Fade>
              </Box>
            </GlassCard>
          </Slide>
        </Box>
      </Fade>
    </LoginContainer>
  );
};

export default Login; 