import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  TextField,
  Button,
  Switch,
  FormControlLabel,
  Grid,
  Alert,
  Divider,
  Avatar,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Card,
  CardContent,
  Stack,
  useMediaQuery
} from '@mui/material';
import { 
  Edit, 
  Save, 
  Cancel, 
  Add, 
  Delete, 
  PhotoCamera, 
  Business, 
  Person,
  Email,
  Work,
  Lock,
  Visibility,
  VisibilityOff,
  DeleteOutline,
  Language,
  Palette,
  Notifications
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { authService } from '../../services/authService';
import { useSidebar } from '../../contexts/SidebarContext';
import { useTheme } from '@mui/material/styles';

const Settings = () => {
  const { user, updateProfile } = useAuth();
  const { collapsed } = useSidebar();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.down('lg'));
  
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    email: user?.email || '',
    fullName: user?.fullName || '',
    specialty: user?.specialty || '',
    gender: user?.gender || '',
    notifications: user?.notifications || true,
    autoSave: user?.autoSave || true,
    darkMode: user?.darkMode || false,
    language: user?.language || 'en',
    profileImage: user?.profileImage || null
  });
  const [clinics, setClinics] = useState(user?.clinics || []);
  const [newClinic, setNewClinic] = useState('');
  const [clinicDialogOpen, setClinicDialogOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [clinicToDelete, setClinicToDelete] = useState('');
  const [imagePreview, setImagePreview] = useState(user?.profileImage || null);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Dental specialties list
  const dentalSpecialties = [
    'General Dentistry',
    'Orthodontics',
    'Oral and Maxillofacial Surgery',
    'Periodontics',
    'Endodontics',
    'Prosthodontics',
    'Pediatric Dentistry',
    'Oral Pathology',
    'Oral Radiology',
    'Public Health Dentistry',
    'Dental Anesthesiology',
    'Oral Medicine',
    'Cosmetic Dentistry',
    'Implant Dentistry',
    'Restorative Dentistry'
  ];

  // Language options
  const languageOptions = [
    { value: 'en', label: 'English' },
    { value: 'ar', label: 'العربية (Arabic)' },
    { value: 'fr', label: 'Français (French)' },
    { value: 'es', label: 'Español (Spanish)' },
    { value: 'de', label: 'Deutsch (German)' },
    { value: 'it', label: 'Italiano (Italian)' },
    { value: 'pt', label: 'Português (Portuguese)' },
    { value: 'ru', label: 'Русский (Russian)' },
    { value: 'zh', label: '中文 (Chinese)' },
    { value: 'ja', label: '日本語 (Japanese)' }
  ];

  // Gender options
  const genderOptions = [
    { value: 'male', label: 'Male' },
    { value: 'female', label: 'Female' },
    { value: 'other', label: 'Other' },
    { value: 'prefer-not-to-say', label: 'Prefer not to say' }
  ];

  // Apply theme and language preferences on component mount
  useEffect(() => {
    if (formData.darkMode) {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.setAttribute('data-theme', 'light');
    }
    
    if (formData.language) {
      document.documentElement.setAttribute('lang', formData.language);
    }
  }, [formData.darkMode, formData.language]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;
    
    setFormData(prev => ({
      ...prev,
      [name]: newValue
    }));

    // Apply theme changes immediately
    if (name === 'darkMode') {
      document.documentElement.setAttribute('data-theme', newValue ? 'dark' : 'light');
    }
    
    // Apply language changes immediately
    if (name === 'language') {
      document.documentElement.setAttribute('lang', newValue);
    }
  };

  const handlePasswordChange = (e) => {
    setPasswordData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const handleSaveProfile = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const profileData = {
        ...formData,
        clinics: clinics
      };
      
      const result = await updateProfile(profileData);
      if (result.success) {
        setSuccess('Profile updated successfully');
        setEditing(false);
      } else {
        setError(result.error || 'Failed to update profile');
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 8) {
      setError('New password must be at least 8 characters long');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await authService.changePassword(
        passwordData.currentPassword,
        passwordData.newPassword
      );
      setSuccess('Password changed successfully');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setShowPasswords({
        current: false,
        new: false,
        confirm: false
      });
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const imageData = e.target.result;
        setImagePreview(imageData);
        setFormData(prev => ({
          ...prev,
          profileImage: imageData
        }));

        setLoading(true);
        setError('');
        setSuccess('');

        try {
          const profileData = {
            ...formData,
            profileImage: imageData,
            clinics: clinics
          };
          
          const result = await updateProfile(profileData);
          if (result.success) {
            setSuccess('Profile image updated successfully!');
          } else {
            setError(result.error || 'Failed to update profile image');
          }
        } catch (error) {
          setError('Failed to update profile image');
        } finally {
          setLoading(false);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddClinic = () => {
    if (newClinic.trim() && !clinics.includes(newClinic.trim())) {
      setClinics(prev => [...prev, newClinic.trim()]);
      setNewClinic('');
      setClinicDialogOpen(false);
    }
  };

  const handleSaveClinics = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const profileData = {
        ...formData,
        clinics: clinics
      };
      
      const result = await updateProfile(profileData);
      if (result.success) {
        setSuccess('Clinics saved successfully');
      } else {
        setError(result.error || 'Failed to save clinics');
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to save clinics');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveClinic = (clinicToRemove) => {
    setClinicToDelete(clinicToRemove);
    setDeleteConfirmOpen(true);
  };

  const confirmDeleteClinic = () => {
    setClinics(prev => prev.filter(clinic => clinic !== clinicToDelete));
    setDeleteConfirmOpen(false);
    setClinicToDelete('');
  };

  const cancelDeleteClinic = () => {
    setDeleteConfirmOpen(false);
    setClinicToDelete('');
  };

  const handleCancel = () => {
    setFormData({
      email: user?.email || '',
      fullName: user?.fullName || '',
      specialty: user?.specialty || '',
      gender: user?.gender || '',
      notifications: user?.notifications || true,
      autoSave: user?.autoSave || true,
      darkMode: user?.darkMode || false,
      language: user?.language || 'en',
      profileImage: user?.profileImage || null
    });
    setImagePreview(user?.profileImage || null);
    setClinics(user?.clinics || []);
    setEditing(false);
    setError('');
  };

  return (
    <Box sx={{ 
      width: '100%', 
      m: 0,
      transition: theme.transitions.create(['margin-left'], {
        easing: theme.transitions.easing.easeInOut,
        duration: theme.transitions.duration.standard,
      }),
      width: isMobile ? '100%' : 'calc(100% - 64px)',
      marginLeft: isMobile ? 0 : '32px',
      position: 'relative',
    }}>
      
      <Container maxWidth="lg" sx={{ 
        py: isMobile ? 2 : 4,
        px: isMobile ? 1 : 3
      }}>
        <Box sx={{ mt: isMobile ? 2 : 4, mb: isMobile ? 2 : 4 }}>
          <Typography 
            variant={isMobile ? "h5" : "h4"} 
            component="h1" 
            gutterBottom 
            sx={{ 
              mb: isMobile ? 2 : 4,
              textAlign: isMobile ? 'center' : 'left'
            }}
          >
            Profile Settings
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ mb: 3 }}>
              {success}
            </Alert>
          )}

          {/* Profile Information - Reorganized */}
          <Paper sx={{ 
            p: isMobile ? 2 : 4, 
            mb: isMobile ? 2 : 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: isMobile ? 'center' : 'stretch',
            textAlign: isMobile ? 'center' : 'left'
          }}>
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              mb: isMobile ? 2 : 4,
              flexDirection: isMobile ? 'column' : 'row',
              gap: isMobile ? 1 : 0,
              width: '100%',
              justifyContent: isMobile ? 'center' : 'space-between'
            }}>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                flexGrow: 1,
                mb: isMobile ? 1 : 0,
                justifyContent: isMobile ? 'center' : 'flex-start'
              }}>
                <Person sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant={isMobile ? "h6" : "h5"}>
                  Personal Information
                </Typography>
              </Box>
              <Button
                variant={editing ? "outlined" : "contained"}
                onClick={() => setEditing(!editing)}
                startIcon={editing ? <Cancel /> : <Edit />}
                color={editing ? "secondary" : "primary"}
                size={isMobile ? "small" : "medium"}
                fullWidth={isMobile}
                sx={{
                  maxWidth: isMobile ? '200px' : 'auto'
                }}
              >
                {editing ? 'Cancel' : 'Edit Profile'}
              </Button>
            </Box>

            <Grid container spacing={isMobile ? 2 : 4} sx={{
              width: '100%',
              justifyContent: isMobile ? 'center' : 'flex-start',
              alignItems: isMobile ? 'center' : 'stretch'
            }}>
              {/* Profile Image Section */}
              <Grid item xs={12} sx={{
                display: 'flex',
                justifyContent: isMobile ? 'center' : 'flex-start'
              }}>
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  mb: 3,
                  flexDirection: isMobile ? 'column' : 'row',
                  textAlign: isMobile ? 'center' : 'left',
                  justifyContent: isMobile ? 'center' : 'flex-start',
                  width: isMobile ? 'auto' : '100%'
                }}>
                  <Box sx={{ 
                    position: 'relative', 
                    mr: isMobile ? 0 : 3,
                    mb: isMobile ? 2 : 0,
                    display: 'flex',
                    justifyContent: 'center'
                  }}>
                    <Avatar 
                      sx={{ 
                        width: isMobile ? 100 : 80, 
                        height: isMobile ? 100 : 80,
                        mx: isMobile ? 'auto' : 0
                      }}
                      src={imagePreview}
                    >
                      {!imagePreview && (formData.fullName?.charAt(0) || formData.email?.charAt(0) || 'U')}
                    </Avatar>
                    <IconButton
                      component="label"
                      sx={{
                        position: 'absolute',
                        bottom: -4,
                        right: -4,
                        bgcolor: 'primary.main',
                        color: 'white',
                        width: isMobile ? 36 : 32,
                        height: isMobile ? 36 : 32,
                        '&:hover': { bgcolor: 'primary.dark' }
                      }}
                    >
                      <PhotoCamera sx={{ fontSize: isMobile ? 20 : 16 }} />
                      <input
                        type="file"
                        accept="image/*"
                        hidden
                        onChange={handleImageUpload}
                      />
                    </IconButton>
                  </Box>
                  <Box sx={{
                    textAlign: isMobile ? 'center' : 'left',
                    width: isMobile ? '100%' : 'auto'
                  }}>
                    <Typography variant={isMobile ? "h6" : "h6"} sx={{
                      textAlign: isMobile ? 'center' : 'left'
                    }}>
                      {formData.fullName || 'No name set'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{
                      textAlign: isMobile ? 'center' : 'left'
                    }}>
                      {formData.email}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{
                      textAlign: isMobile ? 'center' : 'left'
                    }}>
                      {formData.specialty || 'No specialty selected'}
                    </Typography>
                    {formData.gender && (
                      <Typography variant="body2" color="text.secondary" sx={{
                        textAlign: isMobile ? 'center' : 'left'
                      }}>
                        {genderOptions.find(g => g.value === formData.gender)?.label}
                      </Typography>
                    )}
                  </Box>
                </Box>
              </Grid>

              {/* Basic Information */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Full Name"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  disabled={!editing}
                  required
                  sx={{ mb: 2 }}
                  size={isMobile ? "small" : "medium"}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Email Address"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={!editing}
                  required
                  sx={{ mb: 2 }}
                  size={isMobile ? "small" : "medium"}
                  helperText="This serves as both your email and username"
                />
              </Grid>

              {/* Professional Information */}
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  select
                  label="Dental Specialty"
                  name="specialty"
                  value={formData.specialty || ''}
                  onChange={handleChange}
                  disabled={!editing}
                  sx={{ 
                    mb: 2,
                    minWidth: isMobile ? '100%' : '280px',
                    width: isMobile ? '100%' : '280px', // Fixed width to prevent changes
                    '& .MuiInputLabel-root': {
                      fontSize: isMobile ? '0.9rem' : '1rem',
                      fontWeight: 500,
                      whiteSpace: 'nowrap',
                      overflow: 'visible'
                    },
                    '& .MuiOutlinedInput-root': {
                      width: '100%', // Ensure input takes full container width
                      '& .MuiSelect-select': {
                        paddingRight: '32px !important'
                      }
                    }
                  }}
                  size={isMobile ? "small" : "medium"}
                  helperText={!editing ? "Click Edit to modify" : ""}
                >
                  <MenuItem value="">
                    <em style={{ color: '#999' }}>Select specialty</em>
                  </MenuItem>
                  {dentalSpecialties.map((specialty) => (
                    <MenuItem key={specialty} value={specialty}>
                      {specialty}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  select
                  label="Gender"
                  name="gender"
                  value={formData.gender || ''}
                  onChange={handleChange}
                  disabled={!editing}
                  sx={{ 
                    mb: isMobile && editing ? 3 : 2,
                    minWidth: isMobile ? '100%' : '200px',
                    width: isMobile ? '100%' : '200px', // Fixed width to prevent changes
                    '& .MuiInputLabel-root': {
                      fontSize: isMobile ? '0.9rem' : '1rem',
                      fontWeight: 500,
                      whiteSpace: 'nowrap',
                      overflow: 'visible'
                    },
                    '& .MuiOutlinedInput-root': {
                      width: '100%', // Ensure input takes full container width
                      '& .MuiSelect-select': {
                        paddingRight: '32px !important'
                      }
                    }
                  }}
                  size={isMobile ? "small" : "medium"}
                  helperText={!editing ? "Click Edit to modify" : ""}
                >
                  <MenuItem value="">
                    <em style={{ color: '#999' }}>Select gender</em>
                  </MenuItem>
                  {genderOptions.map((gender) => (
                    <MenuItem key={gender.value} value={gender.value}>
                      {gender.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

            </Grid>

            {/* Save Changes Button - Positioned below all form fields */}
            {editing && (
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'center',
                pt: isMobile ? 3 : 2,
                pb: isMobile ? 1 : 0
              }}>
                <Button
                  variant="contained"
                  onClick={handleSaveProfile}
                  disabled={loading}
                  startIcon={<Save />}
                  size={isMobile ? "medium" : "large"}
                  sx={{
                    minWidth: isMobile ? 200 : 'auto',
                    maxWidth: isMobile ? 250 : 'none',
                    py: isMobile ? 1.2 : 1,
                    px: isMobile ? 3 : 4,
                    fontSize: isMobile ? '0.9rem' : '0.875rem',
                    fontWeight: 500
                  }}
                >
                  Save Changes
                </Button>
                {!isMobile && (
                  <Button
                    variant="outlined"
                    onClick={handleCancel}
                    disabled={loading}
                    size="large"
                    sx={{ ml: 2 }}
                  >
                    Cancel
                  </Button>
                )}
              </Box>
            )}
          </Paper>

          {/* Clinics Management - Improved */}
          <Paper sx={{ 
            p: isMobile ? 2 : 4, 
            mb: isMobile ? 2 : 4 
          }}>
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              mb: 3,
              flexDirection: isMobile ? 'column' : 'row',
              gap: isMobile ? 1 : 0
            }}>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                flexGrow: 1,
                mb: isMobile ? 1 : 0
              }}>
                <Business sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant={isMobile ? "h6" : "h5"}>
                  Clinic Management
                </Typography>
              </Box>
              <Box sx={{ 
                display: 'flex', 
                gap: 1,
                flexDirection: isMobile ? 'column' : 'row',
                width: isMobile ? '100%' : 'auto'
              }}>
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={() => setClinicDialogOpen(true)}
                  color="primary"
                  size={isMobile ? "small" : "medium"}
                  fullWidth={isMobile}
                >
                  Add Clinic
                </Button>
                {clinics.length > 0 && (
                  <Button
                    variant="outlined"
                    startIcon={<Save />}
                    onClick={handleSaveClinics}
                    color="primary"
                    size={isMobile ? "small" : "medium"}
                    fullWidth={isMobile}
                    disabled={loading}
                  >
                    {loading ? 'Saving...' : 'Save Clinics'}
                  </Button>
                )}
              </Box>
            </Box>

            {clinics.length > 0 ? (
              <Stack spacing={isMobile ? 1 : 2}>
                {clinics.map((clinic, index) => (
                  <Card key={index} variant="outlined" sx={{ 
                    '&:hover': { 
                      boxShadow: 2,
                      borderColor: 'primary.main'
                    }
                  }}>
                    <CardContent sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'space-between',
                      py: isMobile ? 1.5 : 2,
                      px: isMobile ? 2 : 3,
                      '&:last-child': { pb: isMobile ? 1.5 : 2 }
                    }}>
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center',
                        flex: 1,
                        minWidth: 0 // Allow text to truncate if needed
                      }}>
                        <Business sx={{ mr: 2, color: 'text.secondary', flexShrink: 0 }} />
                        <Typography 
                          variant="body1" 
                          sx={{ 
                            fontWeight: 500,
                            fontSize: isMobile ? '0.9rem' : '1rem',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {clinic}
                        </Typography>
                      </Box>
                      <IconButton
                        onClick={() => handleRemoveClinic(clinic)}
                        sx={{ 
                          color: 'error.main',
                          flexShrink: 0,
                          ml: 1,
                          '&:hover': { 
                            bgcolor: 'error.light',
                            color: 'error.dark'
                          }
                        }}
                        size={isMobile ? "small" : "medium"}
                      >
                        <DeleteOutline />
                      </IconButton>
                    </CardContent>
                  </Card>
                ))}
              </Stack>
            ) : (
              <Box sx={{ 
                textAlign: 'center', 
                py: isMobile ? 3 : 4, 
                bgcolor: theme.palette.mode === 'dark' ? 'grey.900' : 'grey.50', 
                borderRadius: 2,
                border: '2px dashed',
                borderColor: theme.palette.mode === 'dark' ? 'grey.700' : 'grey.300'
              }}>
                <Business sx={{ 
                  fontSize: isMobile ? 36 : 48, 
                  color: theme.palette.mode === 'dark' ? 'grey.600' : 'grey.400', 
                  mb: 2 
                }} />
                <Typography 
                  variant={isMobile ? "body1" : "h6"} 
                  color="text.secondary" 
                  gutterBottom
                >
                  No clinics added yet
                </Typography>
                <Typography 
                  variant="body2" 
                  color="text.secondary"
                  sx={{ fontSize: isMobile ? '0.8rem' : '0.875rem' }}
                >
                  Click "Add Clinic" to get started with your clinic management.
                </Typography>
              </Box>
            )}
          </Paper>

          {/* Password Change - Improved */}
          <Paper sx={{ 
            p: isMobile ? 2 : 4, 
            mb: isMobile ? 2 : 4 
          }}>
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              mb: 3,
              flexDirection: isMobile ? 'column' : 'row'
            }}>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center',
                mb: isMobile ? 1 : 0
              }}>
                <Lock sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant={isMobile ? "h6" : "h5"}>
                  Security Settings
                </Typography>
              </Box>
            </Box>
            <Divider sx={{ mb: isMobile ? 3 : 4 }} />

            <Typography 
              variant={isMobile ? "body1" : "h6"} 
              gutterBottom 
              sx={{ mb: 3, fontWeight: 500 }}
            >
              Change Password
            </Typography>

            <Grid container spacing={isMobile ? 2 : 3}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Current Password"
                  name="currentPassword"
                  type={showPasswords.current ? "text" : "password"}
                  value={passwordData.currentPassword}
                  onChange={handlePasswordChange}
                  size={isMobile ? "small" : "medium"}
                  InputProps={{
                    endAdornment: (
                      <IconButton
                        onClick={() => togglePasswordVisibility('current')}
                        edge="end"
                        size={isMobile ? "small" : "medium"}
                      >
                        {showPasswords.current ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    )
                  }}
                  helperText="Enter your current password to verify your identity"
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="New Password"
                  name="newPassword"
                  type={showPasswords.new ? "text" : "password"}
                  value={passwordData.newPassword}
                  onChange={handlePasswordChange}
                  size={isMobile ? "small" : "medium"}
                  InputProps={{
                    endAdornment: (
                      <IconButton
                        onClick={() => togglePasswordVisibility('new')}
                        edge="end"
                        size={isMobile ? "small" : "medium"}
                      >
                        {showPasswords.new ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    )
                  }}
                  helperText="Minimum 8 characters"
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Confirm New Password"
                  name="confirmPassword"
                  type={showPasswords.confirm ? "text" : "password"}
                  value={passwordData.confirmPassword}
                  onChange={handlePasswordChange}
                  size={isMobile ? "small" : "medium"}
                  InputProps={{
                    endAdornment: (
                      <IconButton
                        onClick={() => togglePasswordVisibility('confirm')}
                        edge="end"
                        size={isMobile ? "small" : "medium"}
                      >
                        {showPasswords.confirm ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    )
                  }}
                  helperText="Re-enter your new password"
                  error={passwordData.confirmPassword && passwordData.newPassword !== passwordData.confirmPassword}
                />
              </Grid>
              
              <Grid item xs={12}>
                <Box sx={{ pt: 2 }}>
                  <Button
                    variant="contained"
                    onClick={handleChangePassword}
                    disabled={loading || !passwordData.currentPassword || !passwordData.newPassword || passwordData.newPassword !== passwordData.confirmPassword}
                    startIcon={<Lock />}
                    size={isMobile ? "medium" : "large"}
                    color="secondary"
                    fullWidth={isMobile}
                  >
                    Update Password
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </Paper>

          {/* Application Preferences - Enhanced */}
          <Paper sx={{ 
            p: isMobile ? 2 : 4 
          }}>
            <Typography 
              variant={isMobile ? "h6" : "h5"} 
              gutterBottom 
              sx={{ mb: 3 }}
            >
              Application Preferences
            </Typography>
            <Divider sx={{ mb: 3 }} />

            <Grid container spacing={isMobile ? 2 : 3}>
              <Grid item xs={12} md={4}>
                <Box sx={{ 
                  p: isMobile ? 2 : 3,
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 2,
                  height: '100%'
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Notifications sx={{ mr: 1, color: 'primary.main' }} />
                    <Typography variant="h6" sx={{ fontSize: isMobile ? '1rem' : '1.25rem' }}>
                      Notifications
                    </Typography>
                  </Box>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.notifications}
                        onChange={handleChange}
                        name="notifications"
                        color="primary"
                      />
                    }
                    label={
                      <Box>
                        <Typography variant="body1">Email Notifications</Typography>
                        <Typography variant="body2" color="text.secondary">
                          Receive updates via email
                        </Typography>
                      </Box>
                    }
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.autoSave}
                        onChange={handleChange}
                        name="autoSave"
                        color="primary"
                      />
                    }
                    label={
                      <Box>
                        <Typography variant="body1">Auto-save</Typography>
                        <Typography variant="body2" color="text.secondary">
                          Automatically save your work
                        </Typography>
                      </Box>
                    }
                    sx={{ mt: 2 }}
                  />
                </Box>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <Box sx={{ 
                  p: isMobile ? 2 : 3,
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 2,
                  height: '100%'
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Palette sx={{ mr: 1, color: 'primary.main' }} />
                    <Typography variant="h6" sx={{ fontSize: isMobile ? '1rem' : '1.25rem' }}>
                      Appearance
                    </Typography>
                  </Box>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.darkMode}
                        onChange={handleChange}
                        name="darkMode"
                        color="primary"
                      />
                    }
                    label={
                      <Box>
                        <Typography variant="body1">Dark Mode</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {formData.darkMode ? 'Dark theme active' : 'Light theme active'}
                        </Typography>
                      </Box>
                    }
                  />
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1, fontSize: '0.75rem' }}>
                    Theme preference is automatically applied when you log in
                  </Typography>
                </Box>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <Box sx={{ 
                  p: isMobile ? 2 : 3,
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 2,
                  height: '100%'
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Language sx={{ mr: 1, color: 'primary.main' }} />
                    <Typography variant="h6" sx={{ fontSize: isMobile ? '1rem' : '1.25rem' }}>
                      Language
                    </Typography>
                  </Box>
                  <FormControl 
                    fullWidth 
                    size={isMobile ? "small" : "medium"}
                    sx={{
                      '& .MuiInputLabel-root': {
                        fontSize: isMobile ? '0.9rem' : '1rem',
                        fontWeight: 500
                      },
                      '& .MuiSelect-select': {
                        fontSize: isMobile ? '0.9rem' : '1rem',
                        fontWeight: 500,
                        color: 'text.primary',
                        padding: isMobile ? '10px 12px' : '14px 12px'
                      },
                      '& .MuiOutlinedInput-root': {
                        '& fieldset': {
                          borderWidth: '2px'
                        },
                        '&:hover fieldset': {
                          borderColor: 'primary.main'
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: 'primary.main'
                        }
                      }
                    }}
                  >
                    <InputLabel sx={{ 
                      fontSize: isMobile ? '0.9rem' : '1rem',
                      fontWeight: 500 
                    }}>
                      Language Preference
                    </InputLabel>
                    <Select
                      name="language"
                      value={formData.language}
                      onChange={handleChange}
                      label="Language Preference"
                      MenuProps={{
                        PaperProps: {
                          sx: {
                            maxHeight: 250,
                            '& .MuiMenuItem-root': {
                              fontSize: isMobile ? '0.85rem' : '0.95rem',
                              fontWeight: 500,
                              padding: isMobile ? '8px 12px' : '10px 16px',
                              '&:hover': {
                                backgroundColor: 'primary.light',
                                color: 'primary.contrastText'
                              },
                              '&.Mui-selected': {
                                backgroundColor: 'primary.main',
                                color: 'primary.contrastText',
                                fontWeight: 600,
                                '&:hover': {
                                  backgroundColor: 'primary.dark'
                                }
                              }
                            }
                          }
                        }
                      }}
                    >
                      {languageOptions.map((lang) => (
                        <MenuItem 
                          key={lang.value} 
                          value={lang.value}
                          sx={{
                            fontSize: isMobile ? '0.85rem' : '0.95rem',
                            fontWeight: 500,
                            whiteSpace: 'normal',
                            wordWrap: 'break-word'
                          }}
                        >
                          {lang.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1, fontSize: '0.75rem' }}>
                    Language preference is saved and applied on login
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Paper>

          {/* Add Clinic Dialog */}
          <Dialog 
            open={clinicDialogOpen} 
            onClose={() => setClinicDialogOpen(false)} 
            maxWidth={isMobile ? "xs" : "sm"} 
            fullWidth
            PaperProps={{
              sx: {
                m: isMobile ? 1 : 3,
                width: isMobile ? 'calc(100% - 16px)' : 'auto',
                maxHeight: isMobile ? '90vh' : 'auto'
              }
            }}
          >
            <DialogTitle sx={{ 
              pb: 1,
              px: isMobile ? 2 : 3,
              pt: isMobile ? 2 : 3
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Business sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant={isMobile ? "h6" : "h5"}>
                  Add New Clinic
                </Typography>
              </Box>
            </DialogTitle>
            <DialogContent sx={{ 
              pt: 2,
              px: isMobile ? 2 : 3,
              pb: isMobile ? 1 : 2
            }}>
              <TextField
                autoFocus
                margin="dense"
                label="Clinic Name"
                fullWidth
                variant="outlined"
                value={newClinic}
                onChange={(e) => setNewClinic(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleAddClinic();
                  }
                }}
                placeholder="Enter the name of your clinic or hospital"
                helperText="This will be added to your clinic list for case management"
                size={isMobile ? "small" : "medium"}
                sx={{
                  '& .MuiInputBase-root': {
                    fontSize: isMobile ? '0.9rem' : '1rem'
                  },
                  '& .MuiFormHelperText-root': {
                    fontSize: isMobile ? '0.75rem' : '0.875rem'
                  }
                }}
              />
            </DialogContent>
            <DialogActions sx={{ 
              p: isMobile ? 2 : 3, 
              pt: isMobile ? 1 : 1,
              flexDirection: isMobile ? 'column' : 'row',
              gap: isMobile ? 1 : 0
            }}>
              <Button 
                onClick={() => setClinicDialogOpen(false)} 
                color="inherit"
                fullWidth={isMobile}
                size={isMobile ? "medium" : "large"}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleAddClinic} 
                variant="contained" 
                disabled={!newClinic.trim()}
                startIcon={<Add />}
                fullWidth={isMobile}
                size={isMobile ? "medium" : "large"}
              >
                Add Clinic
              </Button>
            </DialogActions>
          </Dialog>

          {/* Delete Confirmation Dialog */}
          <Dialog
            open={deleteConfirmOpen}
            onClose={cancelDeleteClinic}
            maxWidth={isMobile ? "xs" : "sm"}
            fullWidth
            PaperProps={{
              sx: {
                m: isMobile ? 1 : 3,
                width: isMobile ? 'calc(100% - 16px)' : 'auto',
                maxHeight: isMobile ? '90vh' : 'auto'
              }
            }}
          >
            <DialogTitle sx={{ 
              pb: 1,
              px: isMobile ? 2 : 3,
              pt: isMobile ? 2 : 3
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <DeleteOutline sx={{ mr: 1, color: 'error.main' }} />
                <Typography variant={isMobile ? "h6" : "h5"} color="error.main">
                  Delete Clinic
                </Typography>
              </Box>
            </DialogTitle>
            <DialogContent sx={{ 
              pt: 2,
              px: isMobile ? 2 : 3,
              pb: isMobile ? 1 : 2
            }}>
              <Typography variant="body1" sx={{ mb: 2 }}>
                Are you sure you want to delete this clinic?
              </Typography>
              <Box sx={{ 
                p: 2, 
                bgcolor: theme => theme.palette.mode === 'dark' ? 'grey.800' : 'grey.100',
                borderRadius: 1,
                border: '1px solid',
                borderColor: theme => theme.palette.mode === 'dark' ? 'grey.600' : 'grey.300'
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Business sx={{ mr: 1, color: 'text.secondary' }} />
                  <Typography variant="body1" sx={{ 
                    fontWeight: 500,
                    color: theme => theme.palette.mode === 'dark' ? 'grey.100' : 'text.primary'
                  }}>
                    {clinicToDelete}
                  </Typography>
                </Box>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                This action cannot be undone. The clinic will be permanently removed from your list.
              </Typography>
            </DialogContent>
            <DialogActions sx={{ 
              p: isMobile ? 2 : 3, 
              pt: isMobile ? 1 : 1,
              flexDirection: isMobile ? 'column' : 'row',
              gap: isMobile ? 1 : 0
            }}>
              <Button 
                onClick={cancelDeleteClinic} 
                color="inherit"
                fullWidth={isMobile}
                size={isMobile ? "medium" : "large"}
              >
                Cancel
              </Button>
              <Button 
                onClick={confirmDeleteClinic} 
                variant="contained" 
                color="error"
                startIcon={<DeleteOutline />}
                fullWidth={isMobile}
                size={isMobile ? "medium" : "large"}
              >
                Delete Clinic
              </Button>
            </DialogActions>
          </Dialog>
        </Box>
      </Container>
    </Box>
  );
};

export default Settings; 