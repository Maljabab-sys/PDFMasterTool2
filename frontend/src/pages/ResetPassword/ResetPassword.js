import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert
} from '@mui/material';
import { Lock, CheckCircle } from '@mui/icons-material';
import { authService } from '../../services/authService';

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [tokenValid, setTokenValid] = useState(null);

  useEffect(() => {
    // Verify token validity on component mount
    const verifyToken = async () => {
      try {
        await authService.verifyResetToken(token);
        setTokenValid(true);
      } catch (error) {
        setTokenValid(false);
        setError('Invalid or expired reset token');
      }
    };

    if (token) {
      verifyToken();
    } else {
      setTokenValid(false);
      setError('No reset token provided');
    }
  }, [token]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setLoading(true);

    try {
      await authService.resetPassword(token, formData.password);
      setSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  if (tokenValid === false) {
    return (
      <Container component="main" maxWidth="sm">
        <Box
          sx={{
            marginTop: 8,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <Paper elevation={3} sx={{ padding: 4, width: '100%', textAlign: 'center' }}>
            <Typography component="h1" variant="h4" gutterBottom color="error">
              Invalid Reset Link
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              This password reset link is invalid or has expired.
            </Typography>
            <Box sx={{ mt: 3 }}>
              <Link to="/forgot-password">
                <Button variant="contained" sx={{ mr: 2 }}>
                  Request New Link
                </Button>
              </Link>
              <Link to="/login">
                <Button variant="outlined">
                  Back to Login
                </Button>
              </Link>
            </Box>
          </Paper>
        </Box>
      </Container>
    );
  }

  if (success) {
    return (
      <Container component="main" maxWidth="sm">
        <Box
          sx={{
            marginTop: 8,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <Paper elevation={3} sx={{ padding: 4, width: '100%', textAlign: 'center' }}>
            <CheckCircle sx={{ fontSize: 48, color: 'success.main', mb: 2 }} />
            <Typography component="h1" variant="h4" gutterBottom>
              Password Reset Successful
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              Your password has been successfully reset. You will be redirected to the login page in a few seconds.
            </Typography>
            <Box sx={{ mt: 3 }}>
              <Link to="/login">
                <Button variant="contained">
                  Go to Login
                </Button>
              </Link>
            </Box>
          </Paper>
        </Box>
      </Container>
    );
  }

  if (tokenValid === null) {
    return (
      <Container component="main" maxWidth="sm">
        <Box
          sx={{
            marginTop: 8,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <Typography>Verifying reset token...</Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container component="main" maxWidth="sm">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper elevation={3} sx={{ padding: 4, width: '100%' }}>
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Lock sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
            <Typography component="h1" variant="h4" gutterBottom>
              Reset Password
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Enter your new password below
            </Typography>
          </Box>
          
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="New Password"
              type="password"
              id="password"
              autoComplete="new-password"
              autoFocus
              value={formData.password}
              onChange={handleChange}
              helperText="Password must be at least 6 characters long"
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="confirmPassword"
              label="Confirm New Password"
              type="password"
              id="confirmPassword"
              autoComplete="new-password"
              value={formData.confirmPassword}
              onChange={handleChange}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              disabled={loading || !formData.password || !formData.confirmPassword}
            >
              {loading ? 'Resetting...' : 'Reset Password'}
            </Button>
            <Box textAlign="center">
              <Link to="/login">
                Remember your password? Sign In
              </Link>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default ResetPassword; 