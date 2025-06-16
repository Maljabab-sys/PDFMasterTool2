import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  Alert,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Card,
  CardContent,
  CardMedia,
  Avatar,
  Collapse,
  Grid,
  Divider,
  Button,
  TextField,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Badge
} from '@mui/material';
import { 
  Add, 
  Search, 
  Visibility, 
  Edit, 
  Delete,
  ExpandMore,
  ExpandLess,
  Person,
  Phone,
  Email,
  CalendarToday,
  MedicalServices,
  PhotoCamera,
  Assignment,
  AccessTime,
  LocationOn
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import { useSidebar } from '../../contexts/SidebarContext';
import { useTheme } from '@mui/material/styles';

// Dummy data for visualization
const DUMMY_PATIENTS = [
  {
    id: 1,
    first_name: 'Sarah',
    last_name: 'Johnson',
    mrn: 'MRN001',
    clinic: 'KFMC',
    created_at: '2024-01-15T10:30:00Z'
  },
  {
    id: 2,
    first_name: 'Ahmed',
    last_name: 'Al-Rashid',
    mrn: 'MRN002',
    clinic: 'DC',
    created_at: '2024-02-20T14:15:00Z'
  },
  {
    id: 3,
    first_name: 'Maria',
    last_name: 'Garcia',
    mrn: 'MRN003',
    clinic: 'KFMC',
    created_at: '2024-03-10T09:45:00Z'
  },
  {
    id: 4,
    first_name: 'John',
    last_name: 'Smith',
    mrn: 'MRN004',
    clinic: 'DC',
    created_at: '2024-03-25T16:20:00Z'
  }
];

const DUMMY_EXAMINATIONS = [
  {
    id: 1,
    patient_id: 1,
    full_name: 'Sarah Johnson',
    file_number: 'MRN001',
    age: '16',
    gender: 'Female',
    date_of_birth: '2008-05-15',
    phone_number: '+966-50-123-4567',
    email: 'sarah.johnson@email.com',
    address: '123 King Fahd Road, Riyadh',
    emergency_contact_name: 'Lisa Johnson',
    emergency_contact_phone: '+966-50-987-6543',
    medical_condition: 'No',
    medical_condition_details: '',
    current_medications: 'None',
    allergies: 'None',
    dental_history: '["Regular checkups", "No previous dental work"]',
    previous_orthodontic_treatment: 'No',
    previous_orthodontic_details: '',
    facial_type: 'Mesofacial',
    profile_type: 'Straight',
    vertical_facial_proportion: 'Normal',
    smile_line: 'High',
    facial_asymmetry: 'None',
    midline_upper: 'Centered',
    midline_lower: 'Centered',
    nasolabial: 'Normal',
    nose_size: 'Normal',
    mentolabial_fold: 'Normal',
    lip_in_repose: 'Competent',
    lip_in_contact: 'Normal',
    oral_hygiene: 'Good',
    molar_relation_right: 'Class I',
    molar_relation_left: 'Class I',
    overjet: '3',
    overbite: 'Normal',
    crossbite: 'None',
    space_condition: '["Mild crowding upper"]',
    gingival_impingement: 'No',
    examination_notes: 'Patient presents with mild upper crowding. Good oral hygiene. Suitable candidate for orthodontic treatment.',
    uploaded_photos: '{"extraoralFrontal": "sarah_frontal.jpg", "extraoralSmiling": "sarah_smile.jpg", "intraoralFront": "sarah_intraoral.jpg"}',
    created_at: '2024-06-15T10:30:00Z',
    updated_at: '2024-06-15T10:30:00Z'
  },
  {
    id: 2,
    patient_id: 1,
    full_name: 'Sarah Johnson',
    file_number: 'MRN001',
    age: '16',
    gender: 'Female',
    date_of_birth: '2008-05-15',
    phone_number: '+966-50-123-4567',
    email: 'sarah.johnson@email.com',
    address: '123 King Fahd Road, Riyadh',
    medical_condition: 'No',
    previous_orthodontic_treatment: 'No',
    profile_type: 'Straight',
    molar_relation_right: 'Class I',
    molar_relation_left: 'Class I',
    overjet: '3',
    overbite: 'Normal',
    examination_notes: 'Follow-up visit. Progress check.',
    uploaded_photos: '{"extraoralFrontal": "sarah_frontal_2.jpg"}',
    created_at: '2024-05-15T14:20:00Z',
    updated_at: '2024-05-15T14:20:00Z'
  },
  {
    id: 3,
    patient_id: 2,
    full_name: 'Ahmed Al-Rashid',
    file_number: 'MRN002',
    age: '14',
    gender: 'Male',
    date_of_birth: '2010-08-22',
    phone_number: '+966-55-234-5678',
    email: 'ahmed.alrashid@email.com',
    address: '456 Olaya Street, Riyadh',
    emergency_contact_name: 'Omar Al-Rashid',
    emergency_contact_phone: '+966-55-876-5432',
    medical_condition: 'Asthma',
    medical_condition_details: 'Mild asthma, uses inhaler as needed',
    current_medications: 'Ventolin inhaler',
    allergies: 'Dust',
    dental_history: '["Previous filling", "Regular checkups"]',
    previous_orthodontic_treatment: 'Yes',
    previous_orthodontic_details: 'Had braces for 2 years, completed 1 year ago',
    facial_type: 'Dolichofacial',
    profile_type: 'Convex',
    vertical_facial_proportion: 'Long',
    smile_line: 'Average',
    facial_asymmetry: 'Slight chin deviation to left',
    midline_upper: '2mm to right',
    midline_lower: '1mm to right',
    nasolabial: 'Acute',
    nose_size: 'Large',
    mentolabial_fold: 'Deep',
    lip_in_repose: 'Incompetent',
    lip_in_contact: 'Strained',
    oral_hygiene: 'Fair',
    molar_relation_right: 'Class II',
    molar_relation_left: 'Class I',
    overjet: '6',
    overbite: 'Deep',
    crossbite: 'Posterior left',
    space_condition: '["Spacing lower", "Crowding upper"]',
    gingival_impingement: 'Yes',
    examination_notes: 'Patient shows Class II malocclusion with increased overjet. Previous orthodontic treatment partially successful. Requires comprehensive treatment.',
    uploaded_photos: '{"extraoralFrontal": "ahmed_frontal.jpg", "extraoralRight": "ahmed_right.jpg", "intraoralFront": "ahmed_intraoral.jpg", "upperOcclusal": "ahmed_upper.jpg", "lowerOcclusal": "ahmed_lower.jpg"}',
    created_at: '2024-06-14T09:15:00Z',
    updated_at: '2024-06-14T09:15:00Z'
  },
  {
    id: 4,
    patient_id: 3,
    full_name: 'Maria Garcia',
    file_number: 'MRN003',
    age: '12',
    gender: 'Female',
    date_of_birth: '2012-03-10',
    phone_number: '+966-56-345-6789',
    email: 'maria.garcia@email.com',
    address: '789 King Abdul Aziz Road, Jeddah',
    emergency_contact_name: 'Carlos Garcia',
    emergency_contact_phone: '+966-56-765-4321',
    medical_condition: 'No',
    current_medications: 'None',
    allergies: 'Penicillin',
    dental_history: '["First dental visit"]',
    previous_orthodontic_treatment: 'No',
    facial_type: 'Brachyfacial',
    profile_type: 'Straight',
    vertical_facial_proportion: 'Short',
    smile_line: 'Low',
    facial_asymmetry: 'None',
    midline_upper: 'Centered',
    midline_lower: 'Centered',
    oral_hygiene: 'Excellent',
    molar_relation_right: 'Class I',
    molar_relation_left: 'Class I',
    overjet: '2',
    overbite: 'Normal',
    crossbite: 'None',
    space_condition: '["Normal spacing"]',
    gingival_impingement: 'No',
    examination_notes: 'Young patient with excellent oral hygiene. Normal occlusion. Monitoring recommended.',
    uploaded_photos: '{"extraoralFrontal": "maria_frontal.jpg", "extraoralSmiling": "maria_smile.jpg"}',
    created_at: '2024-06-13T11:45:00Z',
    updated_at: '2024-06-13T11:45:00Z'
  },
  {
    id: 5,
    patient_id: 4,
    full_name: 'John Smith',
    file_number: 'MRN004',
    age: '18',
    gender: 'Male',
    date_of_birth: '2006-11-30',
    phone_number: '+966-57-456-7890',
    email: 'john.smith@email.com',
    address: '321 Prince Sultan Road, Dammam',
    emergency_contact_name: 'Robert Smith',
    emergency_contact_phone: '+966-57-654-3210',
    medical_condition: 'Diabetes Type 1',
    medical_condition_details: 'Well-controlled diabetes, regular monitoring',
    current_medications: 'Insulin',
    allergies: 'None',
    dental_history: '["Multiple fillings", "Root canal treatment"]',
    previous_orthodontic_treatment: 'No',
    facial_type: 'Mesofacial',
    profile_type: 'Concave',
    vertical_facial_proportion: 'Normal',
    smile_line: 'Average',
    facial_asymmetry: 'None',
    midline_upper: 'Centered',
    midline_lower: 'Centered',
    nasolabial: 'Obtuse',
    nose_size: 'Normal',
    mentolabial_fold: 'Shallow',
    lip_in_repose: 'Competent',
    lip_in_contact: 'Normal',
    oral_hygiene: 'Good',
    molar_relation_right: 'Class III',
    molar_relation_left: 'Class III',
    overjet: '-1',
    overbite: 'Edge to edge',
    crossbite: 'Anterior',
    space_condition: '["Adequate space"]',
    gingival_impingement: 'No',
    examination_notes: 'Adult patient with Class III malocclusion and anterior crossbite. Complex case requiring multidisciplinary approach.',
    uploaded_photos: '{"extraoralFrontal": "john_frontal.jpg", "extraoralRight": "john_right.jpg", "extraoralLeft": "john_left.jpg", "intraoralFront": "john_intraoral.jpg"}',
    created_at: '2024-06-12T15:30:00Z',
    updated_at: '2024-06-12T15:30:00Z'
  }
];

const PatientList = () => {
  const { user } = useAuth();
  const { collapsed } = useSidebar();
  const theme = useTheme();
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [examinations, setExaminations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedCards, setExpandedCards] = useState({});
  const [useDummyData, setUseDummyData] = useState(true); // Toggle for dummy data

  useEffect(() => {
    if (useDummyData) {
      // Use dummy data for demonstration
      setTimeout(() => {
        setPatients(DUMMY_PATIENTS);
        setExaminations(DUMMY_EXAMINATIONS);
        setLoading(false);
      }, 1000); // Simulate loading time
    } else {
      fetchPatientsAndExaminations();
    }
  }, [useDummyData]);

  // Refresh data when component mounts or when returning from other pages
  useEffect(() => {
    const handleFocus = () => {
      if (!useDummyData) {
        fetchPatientsAndExaminations();
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [useDummyData]);

  const fetchPatientsAndExaminations = async () => {
    try {
      // Fetch both patients and examinations
      const [patientsResponse, examinationsResponse] = await Promise.all([
        api.get('/api/patients'),
        api.get('/api/orthodontic-examinations')
      ]);
      
      setPatients(patientsResponse.data || []);
      setExaminations(examinationsResponse.data.examinations || []);
    } catch (error) {
      setError('Failed to fetch patient data');
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Group examinations by patient
  const getPatientExaminations = (patientId) => {
    return examinations.filter(exam => exam.patient_id === patientId)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  };

  // Get frontal photo from examination
  const getFrontalPhoto = (patientId) => {
    const patientExams = getPatientExaminations(patientId);
    if (patientExams.length > 0) {
      const photos = JSON.parse(patientExams[0].uploaded_photos || '{}');
      return photos.extraoralFrontal || photos.extraoralFrontalSmiling || null;
    }
    return null;
  };

  // Get latest examination data for patient summary
  const getLatestExamination = (patientId) => {
    const patientExams = getPatientExaminations(patientId);
    return patientExams.length > 0 ? patientExams[0] : null;
  };

  const filteredPatients = patients.filter(patient => {
    const latestExam = getLatestExamination(patient.id);
    const searchLower = searchTerm.toLowerCase();
    
    return (
      patient.first_name?.toLowerCase().includes(searchLower) ||
      patient.last_name?.toLowerCase().includes(searchLower) ||
      patient.mrn?.toLowerCase().includes(searchLower) ||
      latestExam?.full_name?.toLowerCase().includes(searchLower) ||
      latestExam?.file_number?.toLowerCase().includes(searchLower)
    );
  });

  const handleExpandCard = (patientId) => {
    setExpandedCards(prev => ({
      ...prev,
      [patientId]: !prev[patientId]
    }));
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const calculateAge = (dateOfBirth) => {
    if (!dateOfBirth) return 'N/A';
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  if (loading) {
    return (
      <Container>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
          <Typography variant="h6">Loading patients...</Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Box sx={{ 
      width: '100%', 
      m: 0,
      transition: theme.transitions.create(['margin-left'], {
        easing: theme.transitions.easing.easeInOut,
        duration: theme.transitions.duration.standard,
      }),
      width: 'calc(100% - 64px)',
      marginLeft: '32px',
      position: 'relative',
    }}>
      
      <Container maxWidth="xl" sx={{ py: 3, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Box sx={{ mt: 3, mb: 3, width: '100%', maxWidth: '1400px' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h4" component="h1" gutterBottom>
              Patient Management
            </Typography>
            
            {/* Toggle for dummy data */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Button
                variant={useDummyData ? "contained" : "outlined"}
                size="small"
                onClick={() => setUseDummyData(!useDummyData)}
                color={useDummyData ? "primary" : "secondary"}
              >
                {useDummyData ? "Using Demo Data" : "Use Demo Data"}
              </Button>
            </Box>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {useDummyData && (
            <Alert severity="info" sx={{ mb: 2 }}>
              <strong>Demo Mode:</strong> Showing sample patient data for visualization. Click "Use Demo Data" to toggle.
            </Alert>
          )}

          {/* Search and Actions */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
            <TextField
              placeholder="Search patients by name, file number..."
              variant="outlined"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: <Search sx={{ color: 'action.active', mr: 1 }} />
              }}
              sx={{ minWidth: 300, flexGrow: 1, maxWidth: 500 }}
            />
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => navigate('/new-case')}
            >
              Add New Patient
            </Button>
          </Box>

          {/* Patient Cards */}
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center',
            gap: 2,
            width: '100%'
          }}>
            {filteredPatients.length > 0 ? (
              filteredPatients.map((patient) => {
                const latestExam = getLatestExamination(patient.id);
                const patientExams = getPatientExaminations(patient.id);
                const frontalPhoto = getFrontalPhoto(patient.id);
                const isExpanded = expandedCards[patient.id];

                return (
                  <Card 
                    key={patient.id}
                    sx={{ 
                      width: '100%',
                      maxWidth: {
                        xs: '100%',    // Mobile: full width
                        sm: '600px',   // Small tablets: 600px
                        md: '800px',   // Medium screens: 800px
                        lg: '1000px',  // Large screens: 1000px
                        xl: '1200px'   // Extra large: 1200px
                      },
                      minWidth: {
                        xs: '320px',   // Mobile: minimum 320px
                        sm: '600px',   // Small tablets: same as max
                        md: '800px',   // Medium screens: same as max
                        lg: '1000px',  // Large screens: same as max
                        xl: '1200px'   // Extra large: same as max
                      },
                      height: 'auto',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        boxShadow: 4,
                        transform: 'translateY(-1px)'
                      }
                    }}
                  >
                      {/* Patient Header */}
                      <CardContent sx={{ py: 1.5, px: { xs: 2, sm: 3 } }}>
                        <Box sx={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: { xs: 1.5, sm: 2 },
                          flexDirection: { xs: 'column', sm: 'row' },
                          '@media (max-width: 600px)': {
                            flexDirection: 'column',
                            alignItems: 'stretch'
                          }
                        }}>
                          {/* Mobile Layout: Photo and Basic Info Together */}
                          <Box sx={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: 1.5,
                            width: { xs: '100%', sm: 'auto' },
                            flexGrow: { xs: 0, sm: 1 }
                          }}>
                            {/* Patient Photo */}
                            <Avatar
                              sx={{ 
                                width: { xs: 50, sm: 60 }, 
                                height: { xs: 50, sm: 60 }, 
                                border: '2px solid',
                                borderColor: 'primary.main',
                                flexShrink: 0
                              }}
                              src={frontalPhoto ? `/uploads/${frontalPhoto}` : undefined}
                            >
                              {!frontalPhoto && <Person sx={{ fontSize: { xs: 25, sm: 30 } }} />}
                            </Avatar>

                            {/* Basic Info - Closer to photo */}
                            <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                              <Typography 
                                variant="h6" 
                                component="div" 
                                sx={{ 
                                  fontWeight: 600, 
                                  mb: 0.25,
                                  fontSize: { xs: '1.1rem', sm: '1.25rem' },
                                  lineHeight: 1.2,
                                  textAlign: 'left'
                                }}
                              >
                                {latestExam?.full_name || `${patient.first_name} ${patient.last_name}`}
                              </Typography>
                              <Typography 
                                variant="body2" 
                                color="text.secondary" 
                                sx={{ 
                                  mb: 0.75,
                                  fontSize: { xs: '0.8rem', sm: '0.875rem' },
                                  lineHeight: 1.2,
                                  textAlign: 'left'
                                }}
                              >
                                File Number: {latestExam?.file_number || patient.mrn}
                              </Typography>
                              <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
                                <Chip 
                                  label={`Age: ${latestExam?.age || calculateAge(latestExam?.date_of_birth)}`}
                                  size="small" 
                                  color="primary" 
                                  variant="outlined"
                                  sx={{ 
                                    fontSize: { xs: '0.7rem', sm: '0.75rem' },
                                    height: 24
                                  }}
                                />
                                <Chip 
                                  label={latestExam?.gender || 'N/A'}
                                  size="small" 
                                  color="secondary" 
                                  variant="outlined"
                                  sx={{ 
                                    fontSize: { xs: '0.7rem', sm: '0.75rem' },
                                    height: 24
                                  }}
                                />
                                <Chip 
                                  label={patient.clinic}
                                  size="small" 
                                  color="success" 
                                  variant="outlined"
                                  sx={{ 
                                    fontSize: { xs: '0.7rem', sm: '0.75rem' },
                                    height: 24
                                  }}
                                />
                              </Box>
                            </Box>
                          </Box>

                          {/* Stats and Expand Button Container */}
                          <Box sx={{ 
                            display: 'flex', 
                            alignItems: 'center',
                            justifyContent: { xs: 'space-between', sm: 'flex-end' },
                            gap: { xs: 2, sm: 3 },
                            width: { xs: '100%', sm: 'auto' },
                            flexShrink: 0
                          }}>
                            {/* Quick Stats */}
                            <Box sx={{ 
                              display: 'flex', 
                              gap: { xs: 2, sm: 3 },
                              flexShrink: 0
                            }}>
                              <Box sx={{ textAlign: 'center' }}>
                                <Typography 
                                  variant="h6" 
                                  color="primary" 
                                  sx={{ 
                                    fontWeight: 600, 
                                    lineHeight: 1,
                                    fontSize: { xs: '1.1rem', sm: '1.25rem' }
                                  }}
                                >
                                  {patientExams.length}
                                </Typography>
                                <Typography 
                                  variant="caption" 
                                  color="text.secondary"
                                  sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}
                                >
                                  Visits
                                </Typography>
                              </Box>
                              <Box sx={{ textAlign: 'center' }}>
                                <Typography 
                                  variant="body1" 
                                  color="warning.main" 
                                  sx={{ 
                                    fontWeight: 600, 
                                    lineHeight: 1,
                                    fontSize: { xs: '0.9rem', sm: '1rem' }
                                  }}
                                >
                                  {latestExam ? formatDate(latestExam.created_at).split(',')[0] : 'Never'}
                                </Typography>
                                <Typography 
                                  variant="caption" 
                                  color="text.secondary"
                                  sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}
                                >
                                  Last Visit
                                </Typography>
                              </Box>
                            </Box>

                            {/* Expand Button */}
                            <IconButton
                              onClick={() => handleExpandCard(patient.id)}
                              sx={{ 
                                transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                                transition: 'transform 0.3s ease',
                                bgcolor: 'primary.main',
                                color: 'white',
                                flexShrink: 0,
                                width: { xs: 40, sm: 48 },
                                height: { xs: 40, sm: 48 },
                                '&:hover': {
                                  bgcolor: 'primary.dark'
                                }
                              }}
                            >
                              <ExpandMore sx={{ fontSize: { xs: 20, sm: 24 } }} />
                            </IconButton>
                          </Box>
                        </Box>
                      </CardContent>

                      {/* Expandable Details */}
                      <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                        <Divider />
                        <CardContent sx={{ pt: 1.5, pb: 1.5, px: 3 }}>
                          {/* Visit History */}
                          <Box>
                            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: 'primary.main', mb: 1 }}>
                              Visit History ({patientExams.length} visits)
                            </Typography>
                            
                            {patientExams.length > 0 ? (
                              <Box sx={{ maxHeight: 250, overflowY: 'auto' }}>
                                {patientExams.map((exam, index) => (
                                  <Accordion key={exam.id} sx={{ mb: 1, boxShadow: 1 }}>
                                    <AccordionSummary expandIcon={<ExpandMore />} sx={{ py: 0.75, minHeight: 48 }}>
                                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                                        <Badge 
                                          badgeContent={index === 0 ? 'Latest' : ''} 
                                          color="primary"
                                          sx={{ '& .MuiBadge-badge': { fontSize: '0.6rem' } }}
                                        >
                                          <Assignment color={index === 0 ? 'primary' : 'action'} sx={{ fontSize: 24 }} />
                                        </Badge>
                                        <Box sx={{ flexGrow: 1 }}>
                                          <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                            Orthodontic Examination
                                          </Typography>
                                          <Typography variant="body2" color="text.secondary">
                                            {formatDate(exam.created_at)}
                                          </Typography>
                                        </Box>
                                        {exam.examination_notes && (
                                          <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', maxWidth: 200, fontSize: '0.8rem' }}>
                                            {exam.examination_notes.substring(0, 40)}...
                                          </Typography>
                                        )}
                                      </Box>
                                    </AccordionSummary>
                                    <AccordionDetails sx={{ pt: 0.75, pb: 1 }}>
                                      <Grid container spacing={2}>
                                        {/* Medical History Summary */}
                                        <Grid item xs={12} md={4}>
                                          <Typography variant="subtitle2" color="primary" sx={{ fontWeight: 600, mb: 1 }}>
                                            Medical History
                                          </Typography>
                                          <Typography variant="body2" sx={{ mb: 0.5, fontSize: '0.85rem' }}>
                                            <strong>Condition:</strong> {exam.medical_condition || 'None'}
                                          </Typography>
                                          <Typography variant="body2" sx={{ mb: 0.5, fontSize: '0.85rem' }}>
                                            <strong>Medications:</strong> {exam.current_medications || 'None'}
                                          </Typography>
                                          <Typography variant="body2" sx={{ mb: 0.5, fontSize: '0.85rem' }}>
                                            <strong>Allergies:</strong> {exam.allergies || 'None'}
                                          </Typography>
                                          <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>
                                            <strong>Previous Ortho:</strong> {exam.previous_orthodontic_treatment || 'No'}
                                          </Typography>
                                        </Grid>

                                        {/* Examination Summary */}
                                        <Grid item xs={12} md={4}>
                                          <Typography variant="subtitle2" color="primary" sx={{ fontWeight: 600, mb: 1 }}>
                                            Examination Findings
                                          </Typography>
                                          <Typography variant="body2" sx={{ mb: 0.5, fontSize: '0.85rem' }}>
                                            <strong>Profile:</strong> {exam.profile_type || 'N/A'}
                                          </Typography>
                                          <Typography variant="body2" sx={{ mb: 0.5, fontSize: '0.85rem' }}>
                                            <strong>Facial Type:</strong> {exam.facial_type || 'N/A'}
                                          </Typography>
                                          <Typography variant="body2" sx={{ mb: 0.5, fontSize: '0.85rem' }}>
                                            <strong>Molar Relation:</strong> R-{exam.molar_relation_right || 'N/A'}, L-{exam.molar_relation_left || 'N/A'}
                                          </Typography>
                                          <Typography variant="body2" sx={{ mb: 0.5, fontSize: '0.85rem' }}>
                                            <strong>Overjet:</strong> {exam.overjet || 'N/A'}mm
                                          </Typography>
                                          <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>
                                            <strong>Overbite:</strong> {exam.overbite || 'N/A'}
                                          </Typography>
                                        </Grid>

                                        {/* Photos and Notes */}
                                        <Grid item xs={12} md={4}>
                                          <Typography variant="subtitle2" color="primary" sx={{ fontWeight: 600, mb: 1 }}>
                                            Documentation
                                          </Typography>
                                          
                                          {/* Photos */}
                                          {exam.uploaded_photos && Object.keys(JSON.parse(exam.uploaded_photos)).length > 0 && (
                                            <Box sx={{ mb: 1 }}>
                                              <Typography variant="body2" sx={{ fontWeight: 500, mb: 0.5, fontSize: '0.85rem' }}>
                                                Photos ({Object.keys(JSON.parse(exam.uploaded_photos)).length})
                                              </Typography>
                                              <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                                                {Object.entries(JSON.parse(exam.uploaded_photos)).slice(0, 3).map(([type, filename]) => (
                                                  filename && (
                                                    <Chip
                                                      key={type}
                                                      icon={<PhotoCamera />}
                                                      label={type.replace(/([A-Z])/g, ' $1').trim()}
                                                      size="small"
                                                      variant="outlined"
                                                      color="secondary"
                                                      sx={{ fontSize: '0.7rem', height: '24px' }}
                                                    />
                                                  )
                                                ))}
                                                {Object.keys(JSON.parse(exam.uploaded_photos)).length > 3 && (
                                                  <Chip
                                                    label={`+${Object.keys(JSON.parse(exam.uploaded_photos)).length - 3} more`}
                                                    size="small"
                                                    variant="outlined"
                                                    sx={{ fontSize: '0.7rem', height: '24px' }}
                                                  />
                                                )}
                                              </Box>
                                            </Box>
                                          )}

                                          {/* Examination Notes */}
                                          {exam.examination_notes && (
                                            <Box>
                                              <Typography variant="body2" sx={{ fontWeight: 500, mb: 0.5, fontSize: '0.85rem' }}>
                                                Clinical Notes
                                              </Typography>
                                              <Typography variant="body2" sx={{ 
                                                fontStyle: 'italic', 
                                                bgcolor: 'grey.50', 
                                                p: 1, 
                                                borderRadius: 1,
                                                border: '1px solid',
                                                borderColor: 'grey.200',
                                                fontSize: '0.8rem',
                                                lineHeight: 1.3
                                              }}>
                                                {exam.examination_notes.length > 100 
                                                  ? `${exam.examination_notes.substring(0, 100)}...` 
                                                  : exam.examination_notes
                                                }
                                              </Typography>
                                            </Box>
                                          )}
                                        </Grid>
                                      </Grid>
                                    </AccordionDetails>
                                  </Accordion>
                                ))}
                              </Box>
                            ) : (
                              <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', textAlign: 'center', py: 2 }}>
                                No examination records found
                              </Typography>
                            )}

                            {/* Action Buttons */}
                            <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'flex-end', pt: 1.5, mt: 1.5, borderTop: '1px solid', borderColor: 'grey.200' }}>
                              <Button
                                size="small"
                                startIcon={<Visibility />}
                                onClick={() => navigate(`/patient/${patient.id}`)}
                              >
                                View Details
                              </Button>
                              <Button
                                size="small"
                                startIcon={<Edit />}
                                onClick={() => navigate(`/patient/${patient.id}/edit`)}
                              >
                                Edit
                              </Button>
                              <Button
                                size="small"
                                startIcon={<Add />}
                                variant="contained"
                                onClick={() => navigate('/new-case')}
                              >
                                New Exam
                              </Button>
                            </Box>
                          </Box>
                        </CardContent>
                      </Collapse>
                    </Card>
                );
              })
            ) : (
              <Paper sx={{ p: 4, textAlign: 'center', maxWidth: '600px', width: '100%' }}>
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No patients found
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {searchTerm ? 'Try adjusting your search criteria' : 'Start by adding your first patient'}
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={() => navigate('/new-case')}
                >
                  Add First Patient
                </Button>
              </Paper>
            )}
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default PatientList; 