import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Stack,
  Stepper,
  Step,
  StepLabel,
  Card,
  CardContent,
  CardActions,
  Divider,
  FormControlLabel,
  Checkbox,
  FormGroup,
  FormLabel,
  RadioGroup,
  Radio,
  useMediaQuery,
  Fade,
  Slide,
  Zoom,
  styled
} from '@mui/material';
import { CloudUpload, ArrowBack, ArrowForward, CheckCircle, Check } from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { useSidebar } from '../../contexts/SidebarContext';
import { useTheme } from '@mui/material/styles';

// Custom Styled Components for Enhanced Stepper
const CustomStepperContainer = styled(Box)(({ theme, stepCount }) => ({
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'center',
  marginBottom: theme.spacing(stepCount > 2 ? 3 : 4),
  padding: theme.spacing(stepCount > 2 ? 1.5 : 2, 0),
  position: 'relative',
  [theme.breakpoints.down('md')]: {
    flexDirection: 'row',
    gap: stepCount > 2 ? theme.spacing(0.5) : theme.spacing(1),
    alignItems: 'center',
    overflowX: 'auto',
    paddingX: theme.spacing(1),
  },
}));

const StepItem = styled(Box)(({ theme, active, completed, stepCount }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  position: 'relative',
  flex: 1,
  minWidth: stepCount > 2 ? 100 : 120,
  maxWidth: stepCount > 2 ? 130 : 150,
  [theme.breakpoints.down('md')]: {
    minWidth: stepCount > 2 ? 60 : 80,
    width: 'auto',
    flex: '0 0 auto',
    maxWidth: stepCount > 2 ? 90 : 120,
  },
}));

const StepCircle = styled(Box)(({ theme, active, completed, stepCount, shouldAnimate }) => ({
  width: stepCount > 2 ? 32 : 36,
  height: stepCount > 2 ? 32 : 36,
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  marginBottom: theme.spacing(stepCount > 2 ? 0.5 : 1),
  fontWeight: 'bold',
  fontSize: stepCount > 2 ? '0.8rem' : '0.9rem',
  transition: 'all 0.4s cubic-bezier(0.4, 0.0, 0.2, 1)',
  border: `2px solid ${completed || active ? theme.palette.primary.main : theme.palette.grey[300]}`,
  backgroundColor: completed || active ? theme.palette.primary.main : 'transparent',
  color: completed || active ? theme.palette.common.white : theme.palette.text.secondary,
  zIndex: 2,
  position: 'relative',
  flexShrink: 0,
  minWidth: stepCount > 2 ? 32 : 36,
  minHeight: stepCount > 2 ? 32 : 36,
  overflow: 'hidden',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: '-50%',
    left: '-50%',
    width: '200%',
    height: '200%',
    background: 'linear-gradient(45deg, transparent, rgba(255,255,255,0.4), transparent)',
    animation: shouldAnimate ? 'shine 0.8s ease-out' : 'none',
    borderRadius: '50%',
  },
  '& .check-icon': {
    animation: shouldAnimate ? 'checkmarkCircle 0.8s cubic-bezier(0.68, -0.55, 0.265, 1.55)' : 'none',
    transformOrigin: 'center',
  },
  '@keyframes shine': {
    '0%': {
      transform: 'rotate(0deg)',
      opacity: 0,
    },
    '50%': {
      opacity: 1,
    },
    '100%': {
      transform: 'rotate(180deg)',
      opacity: 0,
    },
  },
  '@keyframes checkmarkCircle': {
    '0%': {
      transform: 'scale(0) rotate(-360deg)',
      opacity: 0,
    },
    '60%': {
      transform: 'scale(1.3) rotate(-180deg)',
      opacity: 0.8,
    },
    '80%': {
      transform: 'scale(0.9) rotate(-90deg)',
      opacity: 1,
    },
    '100%': {
      transform: 'scale(1) rotate(0deg)',
      opacity: 1,
    },
  },
}));

const CustomStepLabel = styled(Typography)(({ theme, active, completed, stepCount }) => ({
  textAlign: 'center',
  fontSize: stepCount > 2 ? '0.65rem' : '0.75rem',
  fontWeight: active ? 500 : 400,
  color: active ? theme.palette.primary.main : theme.palette.text.secondary,
  transition: 'all 0.3s ease',
  maxWidth: stepCount > 2 ? 80 : 100,
  lineHeight: 1.1,
  [theme.breakpoints.down('md')]: {
    fontSize: stepCount > 2 ? '0.55rem' : '0.65rem',
    maxWidth: stepCount > 2 ? 60 : 80,
  },
}));

const ConnectorLine = styled(Box)(({ theme, completed, stepCount }) => ({
  position: 'absolute',
  top: '50%',
  transform: 'translateY(-50%)',
  left: stepCount > 2 ? 'calc(50% + 16px)' : 'calc(50% + 18px)',
  right: stepCount > 2 ? 'calc(-50% + 16px)' : 'calc(-50% + 18px)',
  height: 1,
  backgroundColor: theme.palette.grey[300],
  zIndex: 1,
  [theme.breakpoints.down('md')]: {
    top: '50%',
    transform: 'translateY(-50%)',
    left: stepCount > 2 ? 'calc(50% + 16px)' : 'calc(50% + 18px)',
    right: stepCount > 2 ? 'calc(-50% + 16px)' : 'calc(-50% + 18px)',
  },
}));

const MobileConnector = styled(Box)(({ theme, completed }) => ({
  display: 'none',
}));

const NewCase = () => {
  const { user } = useAuth();
  const { collapsed } = useSidebar();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  // Animation trigger - only once per page load
  const [animationTrigger, setAnimationTrigger] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimationTrigger(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []); // Empty dependency array ensures this runs only once

  // Main state management
  const [currentMainStep, setCurrentMainStep] = useState(0); // 0: Specialty Selection, 1: Form Type Selection
  const [currentFormStep, setCurrentFormStep] = useState(0); // 0: Personal Info, 1: Medical & Dental, 2: Extra-oral, 3: Submission
  const [selectedSpecialty, setSelectedSpecialty] = useState('');
  const [selectedFormType, setSelectedFormType] = useState('');
  const [selectedClinic, setSelectedClinic] = useState('');
  const [showFormSteps, setShowFormSteps] = useState(false);
  
  // Track the most recently completed step for animation
  const [lastCompletedStep, setLastCompletedStep] = useState(null);
  const [isMainStepper, setIsMainStepper] = useState(true);

  // Auto-select specialty based on user's specialty
  useEffect(() => {
    if (user?.specialty) {
      // Map user specialty to our specialty options
      const specialtyMapping = {
        'Orthodontics': 'orthodontic',
        'General Dentistry': 'general',
        'Oral and Maxillofacial Surgery': 'oral-surgery',
        'Periodontics': 'periodontics',
        'Endodontics': 'endodontics',
        'Prosthodontics': 'prosthodontics',
        'Pediatric Dentistry': 'pediatric',
        'Oral Pathology': 'oral-pathology',
        'Oral Radiology': 'oral-radiology',
        'Public Health Dentistry': 'public-health',
        'Dental Anesthesiology': 'anesthesiology',
        'Oral Medicine': 'oral-medicine',
        'Cosmetic Dentistry': 'cosmetic',
        'Implant Dentistry': 'implant',
        'Restorative Dentistry': 'restorative'
      };
      
      const mappedSpecialty = specialtyMapping[user.specialty];
      if (mappedSpecialty) {
        setSelectedSpecialty(mappedSpecialty);
        // If orthodontic is auto-selected, skip to case type selection
        if (mappedSpecialty === 'orthodontic') {
          setCurrentMainStep(1);
        }
      }
    }
  }, [user]);
  
  // Form data for orthodontic registration
  const [formData, setFormData] = useState({
    // Personal Information
    fullName: '',
    fileNumber: '',
    gender: '',
    dateOfBirth: '',
    age: '',
    reasonForTreatment: '',
    height: '',
    pubertalStage: '',
    hereditaryPattern: '',
    
    // Medical & Dental History
    medicalCondition: '',
    medicalConditionOther: '',
    medication: '',
    medicationOther: '',
    allergy: '',
    allergyOther: '',
    hospitalization: '',
    hospitalizationOther: '',
    dentalHistory: [],
    dentalHistoryOther: '',
    previousOrthodonticTreatment: '',
    previousOrthodonticTreatmentOther: '',
    breathing: '',
    breathingOther: '',
    eruptionSequenceDeciduous: '',
    eruptionSequenceDeciduousOther: '',
    eruptionSequencePermanent: '',
    eruptionSequencePermanentOther: '',
    traumaInjury: '',
    traumaInjuryOther: '',
    habits: [],
    habitsOther: '',
    
    // Extra-oral Examination
    facialType: '',
    examinationNotes: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Calculate age from date of birth
  const calculateAge = (dob) => {
    if (!dob) return '';
    const today = new Date();
    const birthDate = new Date(dob);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age.toString();
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'dateOfBirth') {
      setFormData({
        ...formData,
        [name]: value,
        age: calculateAge(value)
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  const handleMultiSelectChange = (name, value) => {
    const currentValues = formData[name] || [];
    const newValues = currentValues.includes(value)
      ? currentValues.filter(item => item !== value)
      : [...currentValues, value];
    
    setFormData({
      ...formData,
      [name]: newValues
    });
  };

  const handleMainNext = () => {
    if (currentMainStep === 0 && selectedSpecialty) {
      setLastCompletedStep(0);
      setIsMainStepper(true);
      setCurrentMainStep(1);
      // Clear animation state after animation completes
      setTimeout(() => {
        setLastCompletedStep(null);
      }, 800);
    } else if (currentMainStep === 1 && selectedFormType && selectedClinic) {
      setLastCompletedStep(1);
      setIsMainStepper(true);
      setTimeout(() => {
        setShowFormSteps(true);
        setCurrentFormStep(0);
        setIsMainStepper(false);
        setLastCompletedStep(null);
      }, 800); // Wait for animation to complete
    }
  };

  const handleMainBack = () => {
    if (showFormSteps) {
      setShowFormSteps(false);
      setCurrentFormStep(0);
    } else if (currentMainStep > 0) {
      setCurrentMainStep(currentMainStep - 1);
    }
  };

  const handleFormNext = () => {
    if (currentFormStep < 3) {
      setLastCompletedStep(currentFormStep);
      setIsMainStepper(false);
      setCurrentFormStep(currentFormStep + 1);
      // Clear animation state after animation completes
      setTimeout(() => {
        setLastCompletedStep(null);
      }, 800);
    }
  };

  const handleFormBack = () => {
    if (currentFormStep > 0) {
      setCurrentFormStep(currentFormStep - 1);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      // Here you would submit the form data to your backend
      console.log('Form Data:', {
        specialty: selectedSpecialty,
        formType: selectedFormType,
        clinic: selectedClinic,
        ...formData
      });
      
      setSuccess('Orthodontic registration case created successfully!');
      
      // Reset form
      setCurrentMainStep(0);
      setCurrentFormStep(0);
      setShowFormSteps(false);
      setSelectedSpecialty('');
      setSelectedFormType('');
      setSelectedClinic('');
      setFormData({
        fullName: '',
        fileNumber: '',
        gender: '',
        dateOfBirth: '',
        age: '',
        reasonForTreatment: '',
        height: '',
        pubertalStage: '',
        hereditaryPattern: '',
        medicalCondition: '',
        medicalConditionOther: '',
        medication: '',
        medicationOther: '',
        allergy: '',
        allergyOther: '',
        hospitalization: '',
        hospitalizationOther: '',
        dentalHistory: [],
        dentalHistoryOther: '',
        previousOrthodonticTreatment: '',
        previousOrthodonticTreatmentOther: '',
        breathing: '',
        breathingOther: '',
        eruptionSequenceDeciduous: '',
        eruptionSequenceDeciduousOther: '',
        eruptionSequencePermanent: '',
        eruptionSequencePermanentOther: '',
        traumaInjury: '',
        traumaInjuryOther: '',
        habits: [],
        habitsOther: '',
        facialType: '',
        examinationNotes: ''
      });
    } catch (error) {
      setError('Failed to create case');
    } finally {
      setLoading(false);
    }
  };

  // Specialty Selection Step
  const renderSpecialtySelection = () => (
    <Box>
      <Typography variant="h5" gutterBottom>
        Select Specialty
      </Typography>
      
      {/* Auto-selection notification */}
      {selectedSpecialty && user?.specialty && (
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="body2">
            <strong>Auto-selected:</strong> {user.specialty} specialty detected from your profile
          </Typography>
        </Alert>
      )}
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card 
            sx={{ 
              cursor: 'pointer',
              border: selectedSpecialty === 'orthodontic' ? 3 : 1,
              borderColor: selectedSpecialty === 'orthodontic' ? 'primary.main' : 'divider',
              boxShadow: selectedSpecialty === 'orthodontic' ? 3 : 1,
              backgroundColor: selectedSpecialty === 'orthodontic' ? 'primary.50' : 'background.paper',
              position: 'relative',
              '&:hover': {
                boxShadow: 2
              }
            }}
            onClick={() => setSelectedSpecialty('orthodontic')}
          >
            {selectedSpecialty === 'orthodontic' && (
              <Box
                sx={{
                  position: 'absolute',
                  top: 8,
                  right: 8,
                  backgroundColor: 'primary.main',
                  color: 'white',
                  borderRadius: '50%',
                  width: 24,
                  height: 24,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                ✓
              </Box>
            )}
            <CardContent>
              <Typography variant="h6" gutterBottom color={selectedSpecialty === 'orthodontic' ? 'primary.main' : 'inherit'}>
                Orthodontic
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Comprehensive orthodontic treatment planning and case management
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ opacity: 0.5 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                General Dentistry
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Coming soon...
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ opacity: 0.5 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Oral Surgery
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Coming soon...
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          variant="contained"
          onClick={handleMainNext}
          disabled={!selectedSpecialty}
          endIcon={<ArrowForward />}
        >
          Next
        </Button>
      </Box>
    </Box>
  );

  // Form Type Selection Step
  const renderFormTypeSelection = () => (
    <Box>
      <Typography variant="h5" gutterBottom>
        Select Form Type - Orthodontic
      </Typography>
      
      {/* Clinic Selection */}
      <Box sx={{ mb: 4 }}>
        <FormControl fullWidth>
          <InputLabel>Select Clinic/Practice *</InputLabel>
          <Select
            value={selectedClinic}
            onChange={(e) => setSelectedClinic(e.target.value)}
            label="Select Clinic/Practice *"
            required
          >
            {user?.clinics?.length > 0 ? (
              user.clinics.map((clinic, index) => (
                <MenuItem key={index} value={clinic}>
                  {clinic}
                </MenuItem>
              ))
            ) : (
              <MenuItem disabled>
                No clinics configured. Please add clinics in Settings.
              </MenuItem>
            )}
          </Select>
        </FormControl>
      </Box>

      {/* Form Type Options */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card 
            sx={{ 
              cursor: 'pointer',
              border: selectedFormType === 'registration' ? 2 : 1,
              borderColor: selectedFormType === 'registration' ? 'primary.main' : 'divider'
            }}
            onClick={() => setSelectedFormType('registration')}
          >
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Registration
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Initial patient registration and comprehensive examination
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ opacity: 0.5 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Orthodontic Visit
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Coming soon...
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ opacity: 0.5 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Debond
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Coming soon...
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
        <Button
          variant="outlined"
          onClick={handleMainBack}
          startIcon={<ArrowBack />}
        >
          Back
        </Button>
        <Button
          variant="contained"
          onClick={handleMainNext}
          disabled={!selectedFormType || !selectedClinic}
          endIcon={<ArrowForward />}
        >
          Next
        </Button>
      </Box>
    </Box>
  );

  // Personal Information Step
  const renderPersonalInformation = () => (
    <Fade in={animationTrigger} timeout={600}>
      <Box>
        <Typography variant="h5" gutterBottom sx={{ mb: 3, textAlign: { xs: 'center', md: 'left' } }}>
          Personal Information
        </Typography>
        
        <Paper sx={{ p: { xs: 2, md: 3 }, mb: 3, border: '1px solid', borderColor: 'divider' }}>
          <Grid container spacing={3}>
            {/* Full Name - Full width on mobile, half on desktop */}
            <Grid item xs={12} md={6}>
              <TextField
                required
                fullWidth
                label="Full Name"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                variant="outlined"
              />
            </Grid>
            
            {/* File Number - Auto width based on content */}
            <Grid item xs={12} md={6} lg={4}>
              <TextField
                required
                fullWidth
                label="File Number"
                name="fileNumber"
                value={formData.fileNumber}
                onChange={handleChange}
                variant="outlined"
                placeholder="e.g., FN-2024-001"
              />
            </Grid>
            
            {/* Gender - Smaller width */}
            <Grid item xs={12} sm={6} md={4} lg={3}>
              <FormControl fullWidth>
                <InputLabel>Gender</InputLabel>
                <Select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  label="Gender"
                >
                  <MenuItem value="male">Male</MenuItem>
                  <MenuItem value="female">Female</MenuItem>
                  <MenuItem value="other">Other</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            {/* Date of Birth */}
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                fullWidth
                label="Date of Birth"
                name="dateOfBirth"
                type="date"
                value={formData.dateOfBirth}
                onChange={handleChange}
                InputLabelProps={{ shrink: true }}
                variant="outlined"
              />
            </Grid>
            
            {/* Age - Auto calculated, smaller width */}
            <Grid item xs={6} sm={4} md={3} lg={2}>
              <TextField
                fullWidth
                label="Age"
                name="age"
                value={formData.age}
                InputProps={{ readOnly: true }}
                helperText="Auto-calculated"
                variant="outlined"
                sx={{ '& .MuiInputBase-input': { textAlign: 'center' } }}
              />
            </Grid>
            
            {/* Height - Optimized width */}
            <Grid item xs={6} sm={4} md={3}>
              <TextField
                fullWidth
                label="Height"
                name="height"
                value={formData.height}
                onChange={handleChange}
                placeholder="170 cm"
                variant="outlined"
              />
            </Grid>
            
            {/* Reason for Treatment - Full width */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={isMobile ? 2 : 3}
                label="Reason for Orthodontic Treatment"
                name="reasonForTreatment"
                value={formData.reasonForTreatment}
                onChange={handleChange}
                variant="outlined"
                placeholder="Describe the main reason for seeking orthodontic treatment..."
              />
            </Grid>
            
            {/* Pubertal Stage */}
            <Grid item xs={12} sm={6} md={4}>
              <FormControl fullWidth>
                <InputLabel>Pubertal Stage</InputLabel>
                <Select
                  name="pubertalStage"
                  value={formData.pubertalStage}
                  onChange={handleChange}
                  label="Pubertal Stage"
                >
                  <MenuItem value="pre-pubertal">Pre-pubertal</MenuItem>
                  <MenuItem value="pubertal">Pubertal</MenuItem>
                  <MenuItem value="post-pubertal">Post-pubertal</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            {/* Hereditary Pattern */}
            <Grid item xs={12} sm={6} md={8}>
              <TextField
                fullWidth
                label="Hereditary Pattern"
                name="hereditaryPattern"
                value={formData.hereditaryPattern}
                onChange={handleChange}
                variant="outlined"
                placeholder="Any family history of dental/orthodontic issues"
              />
            </Grid>
          </Grid>
        </Paper>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3, flexDirection: { xs: 'column', sm: 'row' }, gap: { xs: 2, sm: 0 } }}>
          <Button
            variant="outlined"
            onClick={handleMainBack}
            startIcon={<ArrowBack />}
            sx={{ order: { xs: 2, sm: 1 } }}
          >
            Back
          </Button>
          <Button
            variant="contained"
            onClick={handleFormNext}
            endIcon={<ArrowForward />}
            sx={{ order: { xs: 1, sm: 2 } }}
          >
            Next: Medical History
          </Button>
        </Box>
      </Box>
    </Fade>
  );

  // Medical & Dental History Step
  const renderMedicalHistory = () => (
    <Slide in={animationTrigger} direction="up" timeout={800}>
      <Box>
        <Typography variant="h5" gutterBottom sx={{ mb: 3, textAlign: { xs: 'center', md: 'left' } }}>
          Medical & Dental History
        </Typography>
        
        <Paper sx={{ p: { xs: 2, md: 3 }, mb: 3, border: '1px solid', borderColor: 'divider' }}>
          <Grid container spacing={3}>
            {/* Medical Condition */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>Medical Condition</InputLabel>
                <Select
                  name="medicalCondition"
                  value={formData.medicalCondition}
                  onChange={handleChange}
                  label="Medical Condition"
                >
                  <MenuItem value="none">No known medical condition</MenuItem>
                  <MenuItem value="other">Other</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            {formData.medicalCondition === 'other' && (
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Specify Medical Condition"
                  name="medicalConditionOther"
                  value={formData.medicalConditionOther}
                  onChange={handleChange}
                  variant="outlined"
                  placeholder="Please specify the medical condition"
                />
              </Grid>
            )}

            {/* Medication */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Medication</InputLabel>
                <Select
                  name="medication"
                  value={formData.medication}
                  onChange={handleChange}
                  label="Medication"
                >
                  <MenuItem value="none">None</MenuItem>
                  <MenuItem value="other">Other</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            {formData.medication === 'other' && (
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Specify Medication"
                  name="medicationOther"
                  value={formData.medicationOther}
                  onChange={handleChange}
                  variant="outlined"
                  placeholder="Please specify the medication"
                />
              </Grid>
            )}

            {/* Allergy */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Allergy</InputLabel>
                <Select
                  name="allergy"
                  value={formData.allergy}
                  onChange={handleChange}
                  label="Allergy"
                >
                  <MenuItem value="none">None</MenuItem>
                  <MenuItem value="other">Other</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            {formData.allergy === 'other' && (
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Specify Allergy"
                  name="allergyOther"
                  value={formData.allergyOther}
                  onChange={handleChange}
                  variant="outlined"
                  placeholder="Please specify the allergy"
                />
              </Grid>
            )}

            {/* Hospitalization */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Hospitalization</InputLabel>
                <Select
                  name="hospitalization"
                  value={formData.hospitalization}
                  onChange={handleChange}
                  label="Hospitalization"
                >
                  <MenuItem value="none">No previous hospitalization</MenuItem>
                  <MenuItem value="other">Other</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            {formData.hospitalization === 'other' && (
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Specify Hospitalization"
                  name="hospitalizationOther"
                  value={formData.hospitalizationOther}
                  onChange={handleChange}
                  variant="outlined"
                  placeholder="Please specify hospitalization details"
                />
              </Grid>
            )}

            {/* Dental History */}
            <Grid item xs={12}>
              <FormControl component="fieldset" required>
                <FormLabel component="legend" sx={{ mb: 2, fontSize: '1rem', fontWeight: 600 }}>
                  Dental History
                </FormLabel>
                <FormGroup row={!isMobile} sx={{ gap: 1 }}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={formData.dentalHistory.includes('multiple-restored')}
                        onChange={() => handleMultiSelectChange('dentalHistory', 'multiple-restored')}
                      />
                    }
                    label="Multiple restored teeth"
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={formData.dentalHistory.includes('none')}
                        onChange={() => handleMultiSelectChange('dentalHistory', 'none')}
                      />
                    }
                    label="None"
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={formData.dentalHistory.includes('other')}
                        onChange={() => handleMultiSelectChange('dentalHistory', 'other')}
                      />
                    }
                    label="Other"
                  />
                </FormGroup>
                {formData.dentalHistory.includes('other') && (
                  <TextField
                    fullWidth
                    label="Specify Other Dental History"
                    name="dentalHistoryOther"
                    value={formData.dentalHistoryOther}
                    onChange={handleChange}
                    sx={{ mt: 2 }}
                    variant="outlined"
                    placeholder="Please specify other dental history"
                  />
                )}
              </FormControl>
            </Grid>

            {/* Previous Orthodontic Treatment */}
            <Grid item xs={12} sm={6} md={4}>
              <FormControl fullWidth>
                <InputLabel>Previous Orthodontic Treatment</InputLabel>
                <Select
                  name="previousOrthodonticTreatment"
                  value={formData.previousOrthodonticTreatment}
                  onChange={handleChange}
                  label="Previous Orthodontic Treatment"
                >
                  <MenuItem value="yes">Yes</MenuItem>
                  <MenuItem value="no">No</MenuItem>
                  <MenuItem value="other">Other</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            {formData.previousOrthodonticTreatment === 'other' && (
              <Grid item xs={12} sm={6} md={8}>
                <TextField
                  fullWidth
                  label="Specify Previous Treatment"
                  name="previousOrthodonticTreatmentOther"
                  value={formData.previousOrthodonticTreatmentOther}
                  onChange={handleChange}
                  variant="outlined"
                  placeholder="Please specify previous orthodontic treatment"
                />
              </Grid>
            )}

            {/* Breathing */}
            <Grid item xs={12} sm={6} md={4}>
              <FormControl fullWidth>
                <InputLabel>Breathing</InputLabel>
                <Select
                  name="breathing"
                  value={formData.breathing}
                  onChange={handleChange}
                  label="Breathing"
                >
                  <MenuItem value="nose">Nose</MenuItem>
                  <MenuItem value="mouth">Mouth</MenuItem>
                  <MenuItem value="combination">Combination</MenuItem>
                  <MenuItem value="other">Other</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            {formData.breathing === 'other' && (
              <Grid item xs={12} sm={6} md={8}>
                <TextField
                  fullWidth
                  label="Specify Breathing Pattern"
                  name="breathingOther"
                  value={formData.breathingOther}
                  onChange={handleChange}
                  variant="outlined"
                  placeholder="Please specify breathing pattern"
                />
              </Grid>
            )}

            {/* Additional fields... (continuing with improved responsive design) */}
            {/* Eruption Sequence sections and other fields would follow the same pattern */}
          </Grid>
        </Paper>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3, flexDirection: { xs: 'column', sm: 'row' }, gap: { xs: 2, sm: 0 } }}>
          <Button
            variant="outlined"
            onClick={handleFormBack}
            startIcon={<ArrowBack />}
            sx={{ order: { xs: 2, sm: 1 } }}
          >
            Back
          </Button>
          <Button
            variant="contained"
            onClick={handleFormNext}
            endIcon={<ArrowForward />}
            sx={{ order: { xs: 1, sm: 2 } }}
          >
            Next: Examination
          </Button>
        </Box>
      </Box>
    </Slide>
  );

  // Extra-oral Examination Step
  const renderExtraOralExamination = () => (
    <Fade in={animationTrigger} timeout={1000}>
      <Box>
        <Typography variant="h5" gutterBottom sx={{ mb: 3, textAlign: { xs: 'center', md: 'left' } }}>
          Extra-oral Examination
        </Typography>
        
        <Paper sx={{ p: { xs: 2, md: 3 }, mb: 3, border: '1px solid', borderColor: 'divider' }}>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={8} md={6}>
              <FormControl fullWidth required>
                <InputLabel>Facial Type</InputLabel>
                <Select
                  name="facialType"
                  value={formData.facialType}
                  onChange={handleChange}
                  label="Facial Type"
                >
                  <MenuItem value="dolichocephalic">Dolichocephalic (Long face)</MenuItem>
                  <MenuItem value="mesocephalic">Mesocephalic (Average face)</MenuItem>
                  <MenuItem value="brachycephalic">Brachycephalic (Short face)</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            {/* Additional examination fields can be added here */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={isMobile ? 3 : 4}
                label="Additional Examination Notes"
                name="examinationNotes"
                value={formData.examinationNotes || ''}
                onChange={handleChange}
                variant="outlined"
                placeholder="Any additional observations during the extra-oral examination..."
              />
            </Grid>
          </Grid>
        </Paper>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3, flexDirection: { xs: 'column', sm: 'row' }, gap: { xs: 2, sm: 0 } }}>
          <Button
            variant="outlined"
            onClick={handleFormBack}
            startIcon={<ArrowBack />}
            sx={{ order: { xs: 2, sm: 1 } }}
          >
            Back
          </Button>
          <Button
            variant="contained"
            onClick={handleFormNext}
            endIcon={<ArrowForward />}
            sx={{ order: { xs: 1, sm: 2 } }}
          >
            Review & Submit
          </Button>
        </Box>
      </Box>
    </Fade>
  );

  // Submission Step
  const renderSubmission = () => (
    <Zoom in={animationTrigger} timeout={1200}>
      <Box component="form" onSubmit={handleSubmit}>
        <Typography variant="h5" gutterBottom sx={{ mb: 3, textAlign: { xs: 'center', md: 'left' } }}>
          Review and Submit
        </Typography>
        
        <Paper sx={{ p: { xs: 2, md: 3 }, mb: 3, border: '1px solid', borderColor: 'divider' }}>
          <Typography variant="h6" gutterBottom sx={{ mb: 3, color: 'primary.main' }}>
            Form Summary
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="body2" color="text.secondary" gutterBottom>Specialty</Typography>
              <Chip label={selectedSpecialty} color="primary" variant="outlined" />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="body2" color="text.secondary" gutterBottom>Form Type</Typography>
              <Chip label={selectedFormType} color="secondary" variant="outlined" />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="body2" color="text.secondary" gutterBottom>Clinic</Typography>
              <Chip label={selectedClinic} color="success" variant="outlined" />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="body2" color="text.secondary" gutterBottom>Patient Name</Typography>
              <Typography variant="body1" fontWeight={600}>{formData.fullName || 'Not provided'}</Typography>
            </Grid>
            
            {/* Additional summary fields */}
            {formData.dateOfBirth && (
              <Grid item xs={12} sm={6} md={4}>
                <Typography variant="body2" color="text.secondary" gutterBottom>Date of Birth</Typography>
                <Typography variant="body1">{formData.dateOfBirth}</Typography>
              </Grid>
            )}
            {formData.gender && (
              <Grid item xs={12} sm={6} md={4}>
                <Typography variant="body2" color="text.secondary" gutterBottom>Gender</Typography>
                <Typography variant="body1" sx={{ textTransform: 'capitalize' }}>{formData.gender}</Typography>
              </Grid>
            )}
            {formData.facialType && (
              <Grid item xs={12} sm={6} md={4}>
                <Typography variant="body2" color="text.secondary" gutterBottom>Facial Type</Typography>
                <Typography variant="body1" sx={{ textTransform: 'capitalize' }}>{formData.facialType}</Typography>
              </Grid>
            )}
          </Grid>
          
          <Divider sx={{ my: 3 }} />
          
          <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
            Please review the information above. Once submitted, this registration form will be processed and added to the patient records.
          </Typography>
        </Paper>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3, flexDirection: { xs: 'column', sm: 'row' }, gap: { xs: 2, sm: 0 } }}>
          <Button
            variant="outlined"
            onClick={handleFormBack}
            startIcon={<ArrowBack />}
            sx={{ order: { xs: 2, sm: 1 } }}
            disabled={loading}
          >
            Back
          </Button>
          <Button
            type="submit"
            variant="contained"
            size="large"
            disabled={loading}
            sx={{ 
              order: { xs: 1, sm: 2 },
              minWidth: { xs: '100%', sm: 200 },
              py: 1.5
            }}
          >
            {loading ? 'Creating Case...' : 'Create Registration Case'}
          </Button>
        </Box>
      </Box>
    </Zoom>
  );

  const mainSteps = ['Select Specialty', 'Select Form Type'];
  const formSteps = ['Personal Information', 'Medical & Dental History', 'Extra-oral Examination', 'Review & Submit'];

  // Custom Stepper Component
  const CustomStepper = ({ steps, activeStep, isFormSteps = false }) => {
    const stepCount = steps.length;
    
    return (
      <CustomStepperContainer stepCount={stepCount}>
        {steps.map((step, index) => {
          const isActive = activeStep === index;
          const isCompleted = activeStep > index;
          const showConnector = index < steps.length - 1;
          // Only animate if this is the step that was just completed
          const shouldAnimate = isCompleted && 
            lastCompletedStep === index && 
            ((isFormSteps && !isMainStepper) || (!isFormSteps && isMainStepper));
          
          return (
            <React.Fragment key={step}>
              <Zoom in={animationTrigger} timeout={500 + index * 100} appear={false}>
                <StepItem active={isActive} completed={isCompleted} stepCount={stepCount}>
                  <StepCircle 
                    active={isActive} 
                    completed={isCompleted} 
                    stepCount={stepCount}
                    shouldAnimate={shouldAnimate}
                  >
                    {isCompleted ? (
                      <Check 
                        className="check-icon"
                        sx={{ fontSize: stepCount > 2 ? '0.9rem' : '1rem' }} 
                      />
                    ) : (
                      index + 1
                    )}
                  </StepCircle>
                  <CustomStepLabel active={isActive} completed={isCompleted} stepCount={stepCount}>
                    {step}
                  </CustomStepLabel>
                  {showConnector && (
                    <ConnectorLine completed={isCompleted} stepCount={stepCount} />
                  )}
                </StepItem>
              </Zoom>
            </React.Fragment>
          );
        })}
      </CustomStepperContainer>
    );
  };

  return (
    <Box sx={{ 
      width: '100%', 
      m: 0,
      transition: theme.transitions.create(['margin-left'], {
        easing: theme.transitions.easing.easeInOut,
        duration: theme.transitions.duration.standard,
      }),
      width: { xs: '100%', md: 'calc(100% - 64px)' },
      marginLeft: { xs: 0, md: '32px' },
      position: 'relative',
      minHeight: '100vh',
    }}>
      <Container 
        maxWidth="lg" 
        sx={{ 
          py: { xs: 2, md: 4 },
          px: { xs: 2, md: 3 }
        }}
      >
        {/* Header outside of Paper padding */}
        <Fade in={animationTrigger} timeout={400}>
          <Typography 
            variant={isMobile ? "h5" : "h4"} 
            component="h1" 
            gutterBottom 
            sx={{ 
              mt: { xs: 2, md: 4 }, 
              mb: { xs: 2, md: 3 },
              textAlign: 'center',
              fontWeight: 600,
              color: theme.palette.mode === 'dark' ? 'common.white' : 'common.black'
            }}
          >
            Create New Case
          </Typography>
        </Fade>

        <Slide in={animationTrigger} direction="up" timeout={600}>
          <Paper 
            elevation={isMobile ? 1 : 3} 
            sx={{ 
              p: { xs: 2, sm: 3, md: 4 },
              borderRadius: { xs: 2, md: 3 },
              background: theme.palette.mode === 'dark' 
                ? 'linear-gradient(145deg, #1e1e1e 0%, #2d2d2d 100%)'
                : 'linear-gradient(145deg, #ffffff 0%, #f8f9fa 100%)',
              boxShadow: theme.palette.mode === 'dark'
                ? '0 8px 32px rgba(0,0,0,0.3)'
                : '0 8px 32px rgba(0,0,0,0.1)',
            }}
          >
            {/* Custom Stepper */}
            {!showFormSteps ? (
              <CustomStepper steps={mainSteps} activeStep={currentMainStep} />
            ) : (
              <CustomStepper steps={formSteps} activeStep={currentFormStep} isFormSteps={true} />
            )}

            {/* Alert Messages */}
            {error && (
              <Zoom in={!!error} timeout={300}>
                <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
                  {error}
                </Alert>
              </Zoom>
            )}

            {success && (
              <Zoom in={!!success} timeout={300}>
                <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }}>
                  {success}
                </Alert>
              </Zoom>
            )}

            {/* Step Content with animations */}
            <Box sx={{ minHeight: { xs: 'auto', md: '400px' } }}>
              {!showFormSteps ? (
                <>
                  {currentMainStep === 0 && renderSpecialtySelection()}
                  {currentMainStep === 1 && renderFormTypeSelection()}
                </>
              ) : (
                <>
                  {currentFormStep === 0 && renderPersonalInformation()}
                  {currentFormStep === 1 && renderMedicalHistory()}
                  {currentFormStep === 2 && renderExtraOralExamination()}
                  {currentFormStep === 3 && renderSubmission()}
                </>
              )}
            </Box>
          </Paper>
        </Slide>
      </Container>
    </Box>
  );
};

export default NewCase;