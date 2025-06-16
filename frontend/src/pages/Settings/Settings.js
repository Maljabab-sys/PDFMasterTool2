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
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  useMediaQuery
} from '@mui/material';
import { 
  Edit, 
  Save, 
  Cancel, 
  Add,
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
  Tune
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { authService } from '../../services/authService';
import { useSidebar } from '../../contexts/SidebarContext';
import { useTheme } from '@mui/material/styles';
import { useCustomTheme } from '../../App';
import { useLanguage } from '../../contexts/LanguageContext';

const Settings = () => {
  const { user, updateProfile, checkAuthStatus } = useAuth();
  const { collapsed } = useSidebar();
  const theme = useTheme();
  const { darkMode, toggleDarkMode } = useCustomTheme();
  const { language, changeLanguage } = useLanguage();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    email: user?.email || '',
    fullName: user?.fullName || '',
    specialty: user?.specialty || '',
    gender: user?.gender || '',
    notifications: user?.notifications || true,
    autoSave: user?.autoSave || true,
    darkMode: darkMode,
    language: language,
    profileImage: user?.profileImage || null
  });
  
  // Restore clinic management state
  const [clinics, setClinics] = useState(user?.clinics || []);
  const [newClinic, setNewClinic] = useState('');
  const [clinicDialogOpen, setClinicDialogOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [clinicToDelete, setClinicToDelete] = useState('');

  const [imagePreview, setImagePreview] = useState(user?.profileImage || null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
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

  // Auto-dismiss notifications after 5 seconds
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        setSuccess('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError('');
      }, 8000); // Keep errors visible longer
      return () => clearTimeout(timer);
    }
  }, [error]);

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
    { value: 'de', label: 'Deutsch (German)' }
  ];

  // Gender options
  const genderOptions = [
    { value: 'male', label: 'Male' },
    { value: 'female', label: 'Female' },
    { value: 'other', label: 'Other' },
    { value: 'prefer-not-to-say', label: 'Prefer not to say' }
  ];

  // Sync form data with user context when user data changes
  useEffect(() => {
    if (user && !loading) {
      setFormData(prev => ({
        ...prev,
        email: user.email || prev.email,
        fullName: user.fullName || user.full_name || prev.fullName,
        specialty: user.specialty || prev.specialty,
        gender: user.gender || prev.gender,
        notifications: user.notifications !== undefined ? user.notifications : prev.notifications,
        autoSave: user.autoSave !== undefined ? user.autoSave : prev.autoSave,
        darkMode: darkMode,
        language: language,
        profileImage: user.profileImage || prev.profileImage
      }));
      
      // Sync clinics from user context
      setClinics(user.clinics || []);
      
      // Update image preview when user profile image changes, but not during editing or uploading
      if (!isUploadingImage && !editing) {
        setImagePreview(user.profileImage || null);
      }
    }
  }, [user, loading, isUploadingImage, editing, darkMode, language]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;
    
    setFormData(prev => ({
      ...prev,
      [name]: newValue
    }));

    // Apply theme changes immediately
    if (name === 'darkMode') {
      if (newValue !== darkMode) {
        toggleDarkMode();
        setSuccess(`${newValue ? 'Dark' : 'Light'} mode activated`);
        setTimeout(() => setSuccess(''), 3000);
      }
      savePreference(name, newValue);
    }
    
    // Apply language changes immediately
    if (name === 'language') {
      if (newValue !== language) {
        changeLanguage(newValue);
        const languageNames = {
          'en': 'English',
          'ar': 'العربية (Arabic)',
          'fr': 'Français (French)',
          'es': 'Español (Spanish)',
          'de': 'Deutsch (German)'
        };
        setSuccess(`Language changed to ${languageNames[newValue] || newValue}`);
        setTimeout(() => setSuccess(''), 3000);
      }
      savePreference(name, newValue);
    }
    
    // Auto-save other preferences
    if (name === 'notifications' || name === 'autoSave') {
      savePreference(name, newValue);
    }
  };

  // Function to auto-save individual preferences
  const savePreference = async (preferenceKey, preferenceValue) => {
    try {
      const profileData = {
        ...formData,
        [preferenceKey]: preferenceValue,
        clinics: clinics
      };
      
      await updateProfile(profileData);
      
      const preferenceMessages = {
        'darkMode': preferenceValue ? 'Dark mode activated and saved' : 'Light mode activated and saved',
        'language': `Language changed and saved`,
        'notifications': preferenceValue ? 'Email notifications enabled' : 'Email notifications disabled',
        'autoSave': preferenceValue ? 'Auto-save enabled' : 'Auto-save disabled'
      };
      
      const message = preferenceMessages[preferenceKey] || `${preferenceKey} preference saved`;
      setSuccess(message);
      
      setTimeout(() => {
        setSuccess('');
      }, 3000);
    } catch (error) {
      console.error(`Failed to save ${preferenceKey} preference:`, error);
      setError(`Failed to save ${preferenceKey} preference`);
      setTimeout(() => {
        setError('');
      }, 3000);
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

  // Validation functions for required fields
  const validateProfileForm = () => {
    const errors = [];
    
    if (!formData.fullName.trim()) {
      errors.push('Full Name is required');
    }
    
    if (!formData.email.trim()) {
      errors.push('Email is required');
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.push('Please enter a valid email address');
    }
    
    if (!formData.specialty) {
      errors.push('Specialty is required');
    }
    
    if (errors.length > 0) {
      setError(errors.join(', '));
      return false;
    }
    
    setError(''); // Clear any previous errors
    return true;
  };

  const validatePasswordForm = () => {
    const errors = [];
    
    if (!passwordData.currentPassword) {
      errors.push('Current password is required');
    }
    
    if (!passwordData.newPassword) {
      errors.push('New password is required');
    } else if (passwordData.newPassword.length < 8) {
      errors.push('New password must be at least 8 characters long');
    }
    
    if (!passwordData.confirmPassword) {
      errors.push('Password confirmation is required');
    } else if (passwordData.newPassword !== passwordData.confirmPassword) {
      errors.push('New passwords do not match');
    }
    
    if (errors.length > 0) {
      setError(errors.join(', '));
      return false;
    }
    
    setError(''); // Clear any previous errors
    return true;
  };

  const validateClinicForm = () => {
    const clinicName = newClinic.trim();
    
    if (!clinicName) {
      setError('Please enter a clinic name');
      return false;
    }
    
    if (clinics.includes(clinicName)) {
      setError(`Clinic "${clinicName}" already exists`);
      return false;
    }
    
    setError(''); // Clear any previous errors
    return true;
  };

  const handleSaveProfile = async () => {
    // Validate form before saving
    if (!validateProfileForm()) {
      return;
    }

    setLoading(true);
    setIsUploadingImage(true);
    setError('');
    setSuccess('');

    try {
      const profileData = {
        ...formData,
        clinics: clinics
      };
      console.log('Settings: Calling updateProfile with:', profileData);
      const result = await updateProfile(profileData);
      console.log('Settings: updateProfile result:', result);
      
      if (result.success) {
        setSuccess('Profile updated successfully');
        setEditing(false);
        
        // Update preview with the backend response
        if (result.user?.profileImage) {
          console.log('Settings: Updating image preview with:', result.user.profileImage);
          setImagePreview(result.user.profileImage);
          setFormData(prev => ({
            ...prev,
            profileImage: result.user.profileImage
          }));
        } else {
          // If no profile image in response, keep current preview
          console.log('Settings: No profile image in response, keeping current preview');
        }
        
        // Force refresh of auth context to ensure navigation updates
        console.log('Settings: Forcing auth context refresh');
        await checkAuthStatus();
        
      } else {
        setError(result.error || 'Failed to update profile');
        // On error, revert to the original user profile image
        setImagePreview(user?.profileImage || null);
        setFormData(prev => ({
          ...prev,
          profileImage: user?.profileImage || null
        }));
      }
    } catch (error) {
      console.error('Settings: Profile update error:', error);
      setError(error.response?.data?.message || 'Failed to update profile');
      setImagePreview(user?.profileImage || null);
    } finally {
      setLoading(false);
      setIsUploadingImage(false);
    }
  };

  const handleChangePassword = async () => {
    // Validate password form before saving
    if (!validatePasswordForm()) {
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

  // Change: Only update preview and state on image select, do not upload
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageData = e.target.result;
        setImagePreview(imageData); // Show preview
        setFormData(prev => ({
          ...prev,
          profileImage: imageData // Store base64 in formData, but do not upload yet
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Restore clinic management functions
  const handleAddClinic = async () => {
    // Validate clinic form before adding
    if (!validateClinicForm()) {
      return;
    }

    const clinicName = newClinic.trim();
    if (clinicName && !clinics.includes(clinicName)) {
      setClinics(prev => [...prev, clinicName]);
      setNewClinic('');
      setClinicDialogOpen(false);
      
      // Show success notification
      setSuccess(`Clinic "${clinicName}" added successfully`);
      
      // Auto-save the updated clinics list using updateProfile for sync
      try {
        const profileData = {
          ...formData,
          clinics: [...clinics, clinicName]
        };
        
        const result = await updateProfile(profileData);
        if (!result.success) {
          setError(result.error || 'Failed to save clinic changes');
          // Revert the clinic addition on error
          setClinics(prev => prev.filter(clinic => clinic !== clinicName));
        }
      } catch (error) {
        setError('Failed to save clinic changes');
        // Revert the clinic addition on error
        setClinics(prev => prev.filter(clinic => clinic !== clinicName));
      }
    } else if (clinics.includes(clinicName)) {
      setError(`Clinic "${clinicName}" already exists`);
    } else if (!clinicName) {
      setError('Please enter a clinic name');
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

  const confirmDeleteClinic = async () => {
    const clinicName = clinicToDelete;
    setClinics(prev => prev.filter(clinic => clinic !== clinicToDelete));
    setDeleteConfirmOpen(false);
    setClinicToDelete('');
    
    // Show success notification
    setSuccess(`Clinic "${clinicName}" removed successfully`);
    
    // Auto-save the updated clinics list using updateProfile for sync
    try {
      const profileData = {
        ...formData,
        clinics: clinics.filter(clinic => clinic !== clinicName)
      };
      
      const result = await updateProfile(profileData);
      if (!result.success) {
        setError(result.error || 'Failed to save clinic changes');
        // Revert the clinic removal on error
        setClinics(prev => [...prev, clinicName]);
      }
    } catch (error) {
      setError('Failed to save clinic changes');
      // Revert the clinic removal on error
      setClinics(prev => [...prev, clinicName]);
    }
  };

  const cancelDeleteClinic = () => {
    setDeleteConfirmOpen(false);
    setClinicToDelete('');
  };

  const handleCancel = () => {
    setFormData({
      email: user?.email || '',
      fullName: user?.fullName || user?.full_name || '',
      specialty: user?.specialty || '',
      gender: user?.gender || '',
      notifications: user?.notifications !== undefined ? user.notifications : true,
      autoSave: user?.autoSave !== undefined ? user.autoSave : true,
      darkMode: darkMode,
      language: language,
      profileImage: user?.profileImage || null
    });
    setImagePreview(user?.profileImage || null);
    setClinics(user?.clinics || []);
    setEditing(false);
    setError('');
    setSuccess('');
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
            <Alert 
              severity="error" 
              sx={{ 
                mb: 3,
                position: 'sticky',
                top: isMobile ? 70 : 80,
                zIndex: 1000,
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                border: '1px solid',
                borderColor: 'error.main'
              }}
              onClose={() => setError('')}
            >
              {error}
            </Alert>
          )}

          {success && (
            <Alert 
              severity="success" 
              sx={{ 
                mb: 3,
                position: 'sticky',
                top: isMobile ? 70 : 80,
                zIndex: 1000,
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                border: '1px solid',
                borderColor: 'success.main'
              }}
              onClose={() => setSuccess('')}
            >
              {success}
            </Alert>
          )}

          {/* Profile Information */}
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
              flexDirection: isMobile ? 'column' : 'row',
              alignItems: isMobile ? 'center' : 'flex-start',
              mb: 3
            }}>
              <Box sx={{ 
                position: 'relative', 
                mb: isMobile ? 2 : 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center'
              }}>
                <Box sx={{ position: 'relative' }}>
                  <Avatar
                    src={imagePreview || undefined}
                    sx={{
                      width: isMobile ? 80 : 100,
                      height: isMobile ? 80 : 100,
                      bgcolor: 'primary.main',
                      fontSize: isMobile ? '2rem' : '2.5rem',
                      border: '4px solid',
                      borderColor: 'background.paper',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    }}
                  >
                    {!imagePreview && (formData.fullName?.charAt(0) || formData.email?.charAt(0) || 'U')}
                  </Avatar>
                  
                  {editing && (
                    <>
                      <input
                        accept="image/*"
                        style={{ display: 'none' }}
                        id="profile-image-upload"
                        type="file"
                        onChange={handleImageUpload}
                        disabled={!editing}
                      />
                      <label htmlFor="profile-image-upload">
                        <IconButton 
                          color="primary" 
                          aria-label="upload picture" 
                          component="span"
                          disabled={!editing}
                          sx={{
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            backgroundColor: 'rgba(0, 0, 0, 0.6)',
                            color: 'white',
                            '&:hover': {
                              backgroundColor: 'rgba(0, 0, 0, 0.8)',
                            },
                            width: 48,
                            height: 48,
                            zIndex: 1
                          }}
                        >
                          <PhotoCamera fontSize="medium" />
                        </IconButton>
                      </label>
                    </>
                  )}
                </Box>
                
                <Box sx={{ ml: isMobile ? 0 : 3, mt: isMobile ? 0 : 0 }}>
                  <Typography variant="h6" component="h2" sx={{ textAlign: isMobile ? 'center' : 'left' }}>
                    {formData.fullName || 'User Profile'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ textAlign: isMobile ? 'center' : 'left' }}>
                    {formData.email}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ textAlign: isMobile ? 'center' : 'left' }}>
                    {formData.specialty || 'Dental Professional'}
                  </Typography>
                </Box>
              </Box>
              
              <Box sx={{ 
                display: 'flex', 
                gap: 1,
                flexDirection: isMobile ? 'column' : 'row',
                alignItems: 'center'
              }}>
                {!editing ? (
                  <Button
                    variant="contained"
                    startIcon={<Edit />}
                    onClick={() => setEditing(true)}
                    size={isMobile ? "small" : "medium"}
                  >
                    Edit Profile
                  </Button>
                ) : (
                  <>
                    <Button
                      variant="contained"
                      startIcon={<Save />}
                      onClick={handleSaveProfile}
                      disabled={loading || !formData.fullName.trim() || !formData.email.trim() || !formData.specialty}
                      size={isMobile ? "small" : "medium"}
                    >
                      Save Changes
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<Cancel />}
                      onClick={handleCancel}
                      disabled={loading}
                      size={isMobile ? "small" : "medium"}
                    >
                      Cancel
                    </Button>
                  </>
                )}
              </Box>
            </Box>
            
            <Divider sx={{ mb: 3 }} />

            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  required
                  fullWidth
                  label="Full Name *"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  disabled={!editing}
                  InputProps={{
                    startAdornment: <Person sx={{ mr: 1, color: 'text.secondary' }} />
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  required
                  fullWidth
                  label="Email *"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={!editing}
                  InputProps={{
                    startAdornment: <Email sx={{ mr: 1, color: 'text.secondary' }} />
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth disabled={!editing} required>
                  <InputLabel>Specialty *</InputLabel>
                  <Select
                    name="specialty"
                    value={formData.specialty}
                    onChange={handleChange}
                    label="Specialty *"
                    startAdornment={<Work sx={{ mr: 1, color: 'text.secondary' }} />}
                  >
                    {dentalSpecialties.map((specialty) => (
                      <MenuItem key={specialty} value={specialty}>
                        {specialty}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth disabled={!editing}>
                  <InputLabel>Gender</InputLabel>
                  <Select
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    label="Gender"
                  >
                    {genderOptions.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Paper>

          {/* Preferences */}
          <Paper sx={{ p: isMobile ? 2 : 4, mb: isMobile ? 2 : 4 }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
              <Palette sx={{ mr: 1 }} />
              Preferences
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Language</InputLabel>
                  <Select
                    name="language"
                    value={formData.language}
                    onChange={handleChange}
                    label="Language"
                    startAdornment={<Language sx={{ mr: 1, color: 'text.secondary' }} />}
                  >
                    {languageOptions.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.darkMode}
                        onChange={handleChange}
                        name="darkMode"
                      />
                    }
                    label="Dark Mode"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.notifications}
                        onChange={handleChange}
                        name="notifications"
                      />
                    }
                    label="Email Notifications"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.autoSave}
                        onChange={handleChange}
                        name="autoSave"
                      />
                    }
                    label="Auto-save"
                  />
                </Box>
              </Grid>
            </Grid>
          </Paper>

          {/* Clinics */}
          <Paper sx={{ p: isMobile ? 2 : 4, mb: isMobile ? 2 : 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
                <Business sx={{ mr: 1 }} />
                Clinics
              </Typography>
              <Button
                variant="outlined"
                startIcon={<Add />}
                onClick={() => setClinicDialogOpen(true)}
                size="small"
              >
                Add Clinic
              </Button>
            </Box>
            
            {clinics.length > 0 ? (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                {clinics.map((clinic, index) => (
                  <Chip
                    key={index}
                    label={clinic}
                    onDelete={() => handleRemoveClinic(clinic)}
                    deleteIcon={<DeleteOutline />}
                    variant="outlined"
                  />
                ))}
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                No clinics added yet
              </Typography>
            )}
            
            {clinics.length > 0 && (
              <Button
                variant="contained"
                onClick={handleSaveClinics}
                disabled={loading}
                size="small"
              >
                Save Clinics
              </Button>
            )}
          </Paper>

          {/* Change Password */}
          <Paper sx={{ p: isMobile ? 2 : 4 }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
              <Lock sx={{ mr: 1 }} />
              Change Password
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <TextField
                  required
                  fullWidth
                  label="Current Password *"
                  name="currentPassword"
                  type={showPasswords.current ? 'text' : 'password'}
                  value={passwordData.currentPassword}
                  onChange={handlePasswordChange}
                  InputProps={{
                    endAdornment: (
                      <IconButton
                        onClick={() => togglePasswordVisibility('current')}
                        edge="end"
                      >
                        {showPasswords.current ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    )
                  }}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  required
                  fullWidth
                  label="New Password *"
                  name="newPassword"
                  type={showPasswords.new ? 'text' : 'password'}
                  value={passwordData.newPassword}
                  onChange={handlePasswordChange}
                  InputProps={{
                    endAdornment: (
                      <IconButton
                        onClick={() => togglePasswordVisibility('new')}
                        edge="end"
                      >
                        {showPasswords.new ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    )
                  }}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  required
                  fullWidth
                  label="Confirm New Password *"
                  name="confirmPassword"
                  type={showPasswords.confirm ? 'text' : 'password'}
                  value={passwordData.confirmPassword}
                  onChange={handlePasswordChange}
                  InputProps={{
                    endAdornment: (
                      <IconButton
                        onClick={() => togglePasswordVisibility('confirm')}
                        edge="end"
                      >
                        {showPasswords.confirm ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    )
                  }}
                />
              </Grid>
            </Grid>
            
            <Box sx={{ mt: 3 }}>
              <Button
                variant="contained"
                onClick={handleChangePassword}
                disabled={loading || !passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword}
              >
                Change Password
              </Button>
            </Box>
          </Paper>
        </Box>
      </Container>

      {/* Add Clinic Dialog */}
      <Dialog open={clinicDialogOpen} onClose={() => setClinicDialogOpen(false)}>
        <DialogTitle>Add New Clinic</DialogTitle>
        <DialogContent>
          <TextField
            required
            autoFocus
            margin="dense"
            label="Clinic Name *"
            fullWidth
            variant="outlined"
            value={newClinic}
            onChange={(e) => setNewClinic(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setClinicDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleAddClinic} 
            variant="contained"
            disabled={!newClinic.trim() || clinics.includes(newClinic.trim())}
          >
            Add
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Clinic Confirmation */}
      <Dialog open={deleteConfirmOpen} onClose={cancelDeleteClinic}>
        <DialogTitle>Remove Clinic</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to remove "{clinicToDelete}" from your clinics list?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={cancelDeleteClinic}>Cancel</Button>
          <Button onClick={confirmDeleteClinic} color="error" variant="contained">
            Remove
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Settings;
