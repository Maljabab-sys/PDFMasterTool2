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

  styled,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Tooltip,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import { CloudUpload, ArrowBack, ArrowForward, CheckCircle, Check, Add, LocalHospital, CalendarToday, Close, Save as SaveIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import { useAuth } from '../../contexts/AuthContext';
import { useSidebar } from '../../contexts/SidebarContext';
import { useTheme } from '@mui/material/styles';

// Custom Styled Components for Enhanced Stepper
const CustomStepperContainer = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'stepCount',
})(({ theme, stepCount }) => ({
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

const StepItem = styled(Box, {
  shouldForwardProp: (prop) => !['active', 'completed', 'stepCount'].includes(prop),
})(({ theme, active, completed, stepCount }) => ({
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

const StepCircle = styled(Box, {
  shouldForwardProp: (prop) => !['active', 'completed', 'stepCount', 'shouldAnimate'].includes(prop),
})(({ theme, active, completed, stepCount, shouldAnimate }) => ({
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
  '& .check-icon': {
    animation: shouldAnimate ? 'checkmarkCircle 0.8s cubic-bezier(0.68, -0.55, 0.265, 1.55)' : 'none',
    transformOrigin: 'center',
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

const CustomStepLabel = styled(Typography, {
  shouldForwardProp: (prop) => !['active', 'completed', 'stepCount'].includes(prop),
})(({ theme, active, completed, stepCount }) => ({
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

const ConnectorLine = styled(Box, {
  shouldForwardProp: (prop) => !['completed', 'stepCount'].includes(prop),
})(({ theme, completed, stepCount }) => ({
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

const MobileConnector = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'completed',
})(({ theme, completed }) => ({
  display: 'none',
}));

const NewCase = () => {
  const { user, updateProfile } = useAuth();
  const { collapsed } = useSidebar();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  


  // Main state management
  const [currentMainStep, setCurrentMainStep] = useState(0); // 0: Specialty Selection, 1: Form Type Selection
  const [currentFormStep, setCurrentFormStep] = useState(0); // 0: Personal Info, 1: Medical & Dental, 2: Extra-oral, 3: Intra-oral, 4: Photo Upload, 5: Submission
  const [selectedSpecialty, setSelectedSpecialty] = useState('');
  const [selectedFormType, setSelectedFormType] = useState('');
  const [selectedClinic, setSelectedClinic] = useState('');
  
  // Draft management
  const [drafts, setDrafts] = useState([]);
  const [currentDraftId, setCurrentDraftId] = useState(null);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  const [lastSaved, setLastSaved] = useState(null);
  
  // Form data for orthodontic registration - moved here to be available for useEffect
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
    profileType: '',
    profileTypeOther: '',
    verticalFacialProportion: '',
    smileLine: '',
    facialAsymmetry: '',
    facialAsymmetryOther: '',
    midlineUpper: '',
    midlineUpperSide: '',
    midlineUpperMm: '',
    midlineLower: '',
    midlineLowerSide: '',
    midlineLowerMm: '',
    nasolabial: '',
    noseSize: '',
    mentolabialFold: '',
    mentolabialFoldOther: '',
    lipInRepose: '',
    lipInContact: '',
    jawFunctionMuscleTenderness: '',
    jawFunctionMuscleTendernessText: '',
    tmjSound: '',
    tmjSoundText: '',
    mandibularShift: '',
    mandibularShiftText: '',
    
    // Intra-oral Examination
    oralHygiene: '',
    frenulumAttachmentMaxilla: '',
    tongueSize: '',
    palpationUnruptedCanines: '',
    molarRelationRight: '',
    molarRelationLeft: '',
    overjet: '',
    overbite: '',
    overbiteOther: '',
    crossbite: '',
    crossbiteOther: '',
    spaceCondition: [],
    spaceConditionOther: '',
    gingivalImpingement: '',
    
    examinationNotes: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Photo upload states
  const [uploadedImages, setUploadedImages] = useState({
    extraoralRight: null,
    extraoralFrontal: null,
    extraoralFrontalSmiling: null,
    extraoralZoomSmile: null,
    intraoralRight: null,
    intraoralFrontal: null,
    intraoralLeft: null,
    upperOcclusal: null,
    lowerOcclusal: null
  });
  
  // Field validation states for highlighting
  const [fieldErrors, setFieldErrors] = useState({
    specialty: false,
    formType: false,
    clinic: false,
    fullName: false,
    fileNumber: false,
    medicalCondition: false,
    dentalHistory: false,
    facialType: false,
    profileType: false,
    molarRelationRight: false,
    molarRelationLeft: false,
    overjet: false,
    overbite: false,
    spaceCondition: false
  });
  
  // Enhanced setters that clear field errors
  const setSelectedSpecialtyWithErrorClear = (value) => {
    setSelectedSpecialty(value);
    if (fieldErrors.specialty && value) {
      setFieldErrors({ ...fieldErrors, specialty: false });
    }
  };
  
  const setSelectedFormTypeWithErrorClear = (value) => {
    setSelectedFormType(value);
    if (fieldErrors.formType && value) {
      setFieldErrors({ ...fieldErrors, formType: false });
    }
  };
  
  const setSelectedClinicWithErrorClear = (value) => {
    setSelectedClinic(value);
    if (fieldErrors.clinic && value) {
      setFieldErrors({ ...fieldErrors, clinic: false });
    }
  };
  const [showFormSteps, setShowFormSteps] = useState(false);
  
  // Clinic management
  const [clinicDialogOpen, setClinicDialogOpen] = useState(false);
  const [newClinicName, setNewClinicName] = useState('');
  const [clinicError, setClinicError] = useState('');
  const [clinicSuccess, setClinicSuccess] = useState('');
  
  // Track the most recently completed step for animation
  const [lastCompletedStep, setLastCompletedStep] = useState(null);
  const [isMainStepper, setIsMainStepper] = useState(true);

  // Reset component to initial state when component mounts
  useEffect(() => {
    // Always start at step 0 when component loads
    setCurrentMainStep(0);
    setCurrentFormStep(0);
    setShowFormSteps(false);
    setIsMainStepper(true);
    setLastCompletedStep(null);
    
    // Load drafts
    loadDrafts();
  }, []); // Empty dependency array ensures this only runs on mount

  // Auto-select specialty based on user's specialty (but don't auto-advance steps)
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
        // Don't auto-advance steps - let user manually proceed
      }
    }
  }, [user]);

  // Load drafts on component mount and check for existing draft to continue
  useEffect(() => {
    // Check if we should continue with an existing draft
    const existingDrafts = JSON.parse(localStorage.getItem('newCaseDrafts') || '[]');
    if (existingDrafts.length > 0) {
      // Find the most recent draft that matches current form state
      const currentFormState = {
        selectedSpecialty,
        selectedFormType,
        selectedClinic,
        currentMainStep,
        currentFormStep
      };
      
      // Look for a draft that matches our current basic selections
      const matchingDraft = existingDrafts.find(draft => 
        draft.selectedSpecialty === currentFormState.selectedSpecialty &&
        draft.selectedFormType === currentFormState.selectedFormType &&
        draft.selectedClinic === currentFormState.selectedClinic &&
        draft.currentMainStep === currentFormState.currentMainStep &&
        draft.currentFormStep === currentFormState.currentFormStep
      );
      
      if (matchingDraft) {
        // Continue with existing draft instead of creating new one
        setCurrentDraftId(matchingDraft.id);
        console.log('Continuing with existing draft:', matchingDraft.id);
      }
    }
  }, []);

  // Auto-save functionality - enhanced to save at every step
  useEffect(() => {
    const hasFormData = Object.values(formData).some(value => {
      if (Array.isArray(value)) {
        return value.length > 0;
      }
      return value !== '';
    });
    
    const hasUploadedImages = Object.values(uploadedImages).some(image => image !== null);
    
    // Only save if we have MEANINGFUL progress - not just selections
    const hasMeaningfulProgress = hasFormData || hasUploadedImages || currentFormStep > 0;
    
    // Don't auto-save just for specialty/clinic selections unless user has progressed further
    const shouldSave = autoSaveEnabled && hasMeaningfulProgress;
    
    if (shouldSave) {
      const timeoutId = setTimeout(() => {
        saveDraft();
      }, 2000); // Reduced to 2 seconds for more responsive saving

      return () => clearTimeout(timeoutId);
    }
  }, [selectedSpecialty, selectedFormType, selectedClinic, formData, uploadedImages, currentMainStep, currentFormStep, autoSaveEnabled]);

  // Additional auto-save trigger for step changes - only for form steps, not main steps
  useEffect(() => {
    if (autoSaveEnabled && currentFormStep > 0) {
      const timeoutId = setTimeout(() => {
        saveDraft();
      }, 500); // Quick save when form steps change

      return () => clearTimeout(timeoutId);
    }
  }, [currentFormStep, autoSaveEnabled]);

  // Draft management functions
  const generateDraftId = () => {
    return `draft_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  const saveDraft = async (forceManualSave = false) => {
    try {
      // Check if we have meaningful progress before saving (unless forced)
      const hasFormData = Object.values(formData).some(value => {
        if (Array.isArray(value)) return value.length > 0;
        return value !== '';
      });
      const hasUploadedImages = Object.values(uploadedImages).some(image => image !== null);
      const hasMeaningfulProgress = hasFormData || hasUploadedImages || currentFormStep > 0;
      
      // Don't save if we only have basic selections without any form progress (unless forced)
      if (!forceManualSave && !hasMeaningfulProgress) {
        console.log('Skipping draft save - no meaningful progress yet');
        return;
      }

      // Get existing drafts from localStorage first
      const existingDrafts = JSON.parse(localStorage.getItem('newCaseDrafts') || '[]');
      
      // Check if we should update an existing draft instead of creating a new one
      let draftId = currentDraftId;
      
      if (!draftId) {
        // Look for existing draft with similar form state to avoid duplicates
        const similarDraft = existingDrafts.find(draft => 
          draft.selectedSpecialty === selectedSpecialty &&
          draft.selectedFormType === selectedFormType &&
          draft.selectedClinic === selectedClinic &&
          Math.abs(draft.currentMainStep - currentMainStep) <= 1 &&
          Math.abs(draft.currentFormStep - currentFormStep) <= 1
        );
        
        if (similarDraft) {
          draftId = similarDraft.id;
          setCurrentDraftId(draftId);
          console.log('Updating existing similar draft instead of creating new one:', draftId);
        } else {
          draftId = generateDraftId();
          setCurrentDraftId(draftId);
        }
      }

      const draftData = {
        id: draftId,
        timestamp: new Date().toISOString(),
        currentMainStep,
        currentFormStep,
        selectedSpecialty,
        selectedFormType,
        selectedClinic,
        formData,
        uploadedImages,
        showFormSteps,
        lastSaved: new Date().toLocaleString(),
        // Additional metadata for better tracking
        progress: {
          mainStep: currentMainStep,
          formStep: currentFormStep,
          totalSteps: 6, // 0: Personal, 1: Medical, 2: Extra-oral, 3: Intra-oral, 4: Photos, 5: Review
          completedFields: Object.values(formData).filter(value => {
            if (Array.isArray(value)) return value.length > 0;
            return value !== '';
          }).length,
          totalFields: Object.keys(formData).length,
          hasImages: Object.values(uploadedImages).some(image => image !== null)
        }
      };
      
      // Update or add current draft
      const draftIndex = existingDrafts.findIndex(draft => draft.id === draftData.id);
      if (draftIndex >= 0) {
        existingDrafts[draftIndex] = draftData;
      } else {
        existingDrafts.push(draftData);
      }

      // Keep only the 5 most recent drafts
      const sortedDrafts = existingDrafts.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      const recentDrafts = sortedDrafts.slice(0, 5);

      localStorage.setItem('newCaseDrafts', JSON.stringify(recentDrafts));
      setDrafts(recentDrafts);
      setLastSaved(new Date().toLocaleString());
      
      console.log('Draft saved successfully:', {
        id: draftData.id,
        step: `${currentMainStep}-${currentFormStep}`,
        fields: draftData.progress.completedFields,
        images: draftData.progress.hasImages
      });
    } catch (error) {
      console.error('Error saving draft:', error);
    }
  };

  const loadDrafts = () => {
    try {
      const savedDrafts = JSON.parse(localStorage.getItem('newCaseDrafts') || '[]');
      
      // Remove duplicate drafts (same specialty, form type, clinic, and similar progress)
      const uniqueDrafts = [];
      const seen = new Map();
      
      for (const draft of savedDrafts) {
        const key = `${draft.selectedSpecialty}-${draft.selectedFormType}-${draft.selectedClinic}-${draft.currentMainStep}-${draft.currentFormStep}`;
        
        // Check if we have a similar draft
        const existingDraft = seen.get(key);
        if (!existingDraft) {
          seen.set(key, draft);
          uniqueDrafts.push(draft);
        } else {
          // Keep the one with more progress (more form data or more recent)
          const existingProgress = existingDraft.progress?.completedFields || 0;
          const currentProgress = draft.progress?.completedFields || 0;
          
          if (currentProgress > existingProgress || 
              (currentProgress === existingProgress && new Date(draft.timestamp) > new Date(existingDraft.timestamp))) {
            // Replace the existing draft with this one
            const index = uniqueDrafts.findIndex(d => d.id === existingDraft.id);
            if (index >= 0) {
              uniqueDrafts[index] = draft;
              seen.set(key, draft);
            }
            console.log('Replacing draft with more progress:', existingDraft.id, '→', draft.id);
          } else {
            console.log('Removing duplicate draft:', draft.id);
          }
        }
      }
      
      // Sort by timestamp, most recent first
      const sortedDrafts = uniqueDrafts.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      
      // Update localStorage with cleaned drafts
      if (uniqueDrafts.length !== savedDrafts.length) {
        localStorage.setItem('newCaseDrafts', JSON.stringify(sortedDrafts));
      }
      
      setDrafts(sortedDrafts);
    } catch (error) {
      console.error('Error loading drafts:', error);
      setDrafts([]);
    }
  };

  const loadDraft = (draft) => {
    try {
      setCurrentMainStep(draft.currentMainStep);
      setCurrentFormStep(draft.currentFormStep);
      setSelectedSpecialty(draft.selectedSpecialty);
      setSelectedFormType(draft.selectedFormType);
      setSelectedClinic(draft.selectedClinic);
      setFormData(draft.formData);
      setUploadedImages(draft.uploadedImages || {
        extraoralRight: null,
        extraoralFrontal: null,
        extraoralFrontalSmiling: null,
        extraoralZoomSmile: null,
        intraoralRight: null,
        intraoralFrontal: null,
        intraoralLeft: null,
        upperOcclusal: null,
        lowerOcclusal: null
      });
      setShowFormSteps(draft.showFormSteps);
      setCurrentDraftId(draft.id);
      setLastSaved(draft.lastSaved);
      
      console.log('Draft loaded successfully:', draft.id);
    } catch (error) {
      console.error('Error loading draft:', error);
    }
  };

  const deleteDraft = (draftId) => {
    try {
      const existingDrafts = JSON.parse(localStorage.getItem('newCaseDrafts') || '[]');
      const updatedDrafts = existingDrafts.filter(draft => draft.id !== draftId);
      localStorage.setItem('newCaseDrafts', JSON.stringify(updatedDrafts));
      setDrafts(updatedDrafts);
      
      if (currentDraftId === draftId) {
        setCurrentDraftId(null);
      }
      
      console.log('Draft deleted successfully:', draftId);
    } catch (error) {
      console.error('Error deleting draft:', error);
    }
  };

  const clearAllDrafts = () => {
    localStorage.removeItem('newCaseDrafts');
    setDrafts([]);
    setCurrentDraftId(null);
    setLastSaved(null);
  };

  const startNewForm = () => {
    // Reset all form state
    setCurrentMainStep(0);
    setCurrentFormStep(0);
    setSelectedSpecialty('');
    setSelectedFormType('');
    setSelectedClinic('');
    setFormData({
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
      profileType: '',
      profileTypeOther: '',
      verticalFacialProportion: '',
      smileLine: '',
      facialAsymmetry: '',
      facialAsymmetryOther: '',
      midlineUpper: '',
      midlineUpperSide: '',
      midlineUpperMm: '',
      midlineLower: '',
      midlineLowerSide: '',
      midlineLowerMm: '',
      nasolabial: '',
      noseSize: '',
      mentolabialFold: '',
      mentolabialFoldOther: '',
      lipInRepose: '',
      lipInContact: '',
      jawFunctionMuscleTenderness: '',
      jawFunctionMuscleTendernessText: '',
      tmjSound: '',
      tmjSoundText: '',
      mandibularShift: '',
      mandibularShiftText: '',
      
      // Intra-oral Examination
      oralHygiene: '',
      frenulumAttachmentMaxilla: '',
      tongueSize: '',
      palpationUnruptedCanines: '',
      molarRelationRight: '',
      molarRelationLeft: '',
      overjet: '',
      overbite: '',
      overbiteOther: '',
      crossbite: '',
      crossbiteOther: '',
      spaceCondition: [],
      spaceConditionOther: '',
      gingivalImpingement: '',
      
      examinationNotes: ''
    });
    setUploadedImages({
      extraoralRight: null,
      extraoralFrontal: null,
      extraoralFrontalSmiling: null,
      extraoralZoomSmile: null,
      intraoralRight: null,
      intraoralFrontal: null,
      intraoralLeft: null,
      upperOcclusal: null,
      lowerOcclusal: null
    });
    setShowFormSteps(false);
    setCurrentDraftId(null);
    setLastSaved(null);
    setError('');
    setSuccess('');
    
    // Clear field errors
    setFieldErrors({
      specialty: false,
      formType: false,
      clinic: false,
      fullName: false,
      fileNumber: false,
      medicalCondition: false,
      dentalHistory: false,
      facialType: false,
      profileType: false,
      molarRelationRight: false,
      molarRelationLeft: false,
      overjet: false,
      overbite: false,
      spaceCondition: false
    });
  };

  const getDraftTitle = (draft) => {
    if (draft.formData?.fullName) {
      return `${draft.formData.fullName} - ${draft.selectedSpecialty || 'Unknown'}`;
    }
    if (draft.selectedSpecialty && draft.selectedFormType) {
      return `${draft.selectedSpecialty} - ${draft.selectedFormType}`;
    }
    if (draft.selectedSpecialty) {
      return `${draft.selectedSpecialty} Draft`;
    }
    return 'Untitled Draft';
  };

  const getStepName = (mainStep, formStep) => {
    if (mainStep === 0) return 'Specialty Selection';
    if (mainStep === 1) return 'Form Type Selection';
    
    const stepNames = [
      'Personal Information',
      'Medical & Dental History', 
      'Extra-oral Examination',
      'Intra-oral Examination',
      'Photo Upload',
      'Review & Submit'
    ];
    return stepNames[formStep] || 'Unknown Step';
  };
  


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
    
    // Clear field error when user starts typing/selecting
    if (fieldErrors[name]) {
      setFieldErrors({
        ...fieldErrors,
        [name]: false
      });
    }
    
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
    
    // Auto-save is triggered by useEffect when formData changes
  };

  const handleMultiSelectChange = (name, value) => {
    const currentValues = formData[name] || [];
    const newValues = currentValues.includes(value)
      ? currentValues.filter(item => item !== value)
      : [...currentValues, value];
    
    // Clear field error when user makes selection
    if (fieldErrors[name]) {
      setFieldErrors({
        ...fieldErrors,
        [name]: false
      });
    }
    
    setFormData({
      ...formData,
      [name]: newValues
    });
    
    // Auto-save is triggered by useEffect when formData changes
  };

  // Handle image upload
  const handleImageUpload = (imageType, event) => {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        setError('Please upload only JPEG, PNG, or WebP images');
        return;
      }
      
      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size must be less than 5MB');
        return;
      }
      
      // Create preview URL
      const reader = new FileReader();
      reader.onload = (e) => {
        setUploadedImages(prev => ({
          ...prev,
          [imageType]: {
            file: file,
            preview: e.target.result,
            name: file.name
          }
        }));
        setError(''); // Clear any previous errors
        
        // Trigger auto-save when image is uploaded
        if (autoSaveEnabled) {
          setTimeout(() => saveDraft(), 500);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Remove uploaded image
  const handleRemoveImage = (imageType) => {
    setUploadedImages(prev => ({
      ...prev,
      [imageType]: null
    }));
    
    // Trigger auto-save when image is removed
    if (autoSaveEnabled) {
      setTimeout(() => saveDraft(), 500);
    }
  };

  // Validation functions for required fields with error highlighting
  const validateSpecialtyStep = () => {
    const newFieldErrors = { ...fieldErrors };
    let isValid = true;
    
    if (!selectedSpecialty) {
      newFieldErrors.specialty = true;
      setError('Please select a specialty to continue');
      isValid = false;
    } else {
      newFieldErrors.specialty = false;
    }
    
    setFieldErrors(newFieldErrors);
    if (isValid) setError(''); // Clear any previous errors
    return isValid;
  };

  const validateFormTypeStep = () => {
    const newFieldErrors = { ...fieldErrors };
    const errors = [];
    let isValid = true;
    
    if (!selectedFormType) {
      newFieldErrors.formType = true;
      errors.push('Please select a form type');
      isValid = false;
    } else {
      newFieldErrors.formType = false;
    }
    
    if (!selectedClinic) {
      newFieldErrors.clinic = true;
      errors.push('Please select a clinic/practice');
      isValid = false;
    } else {
      newFieldErrors.clinic = false;
    }
    
    setFieldErrors(newFieldErrors);
    if (errors.length > 0) {
      setError(errors.join(' and '));
      return false;
    }
    if (isValid) setError(''); // Clear any previous errors
    return true;
  };

  const validatePersonalInformation = () => {
    const newFieldErrors = { ...fieldErrors };
    const errors = [];
    let isValid = true;
    
    if (!formData.fullName.trim()) {
      newFieldErrors.fullName = true;
      errors.push('Full Name is required');
      isValid = false;
    } else {
      newFieldErrors.fullName = false;
    }
    
    if (!formData.fileNumber.trim()) {
      newFieldErrors.fileNumber = true;
      errors.push('File Number is required');
      isValid = false;
    } else {
      newFieldErrors.fileNumber = false;
    }
    
    setFieldErrors(newFieldErrors);
    if (errors.length > 0) {
      setError(errors.join(', '));
      return false;
    }
    if (isValid) setError(''); // Clear any previous errors
    return true;
  };

  const validateMedicalHistory = () => {
    const newFieldErrors = { ...fieldErrors };
    const errors = [];
    let isValid = true;
    
    if (!formData.medicalCondition) {
      newFieldErrors.medicalCondition = true;
      errors.push('Medical Condition is required');
      isValid = false;
    } else {
      newFieldErrors.medicalCondition = false;
    }
    
    if (formData.dentalHistory.length === 0) {
      newFieldErrors.dentalHistory = true;
      errors.push('Please select at least one dental history option');
      isValid = false;
    } else {
      newFieldErrors.dentalHistory = false;
    }
    
    setFieldErrors(newFieldErrors);
    if (errors.length > 0) {
      setError(errors.join(', '));
      return false;
    }
    if (isValid) setError(''); // Clear any previous errors
    return true;
  };

  const validateExtraOralExamination = () => {
    const newFieldErrors = { ...fieldErrors };
    const errors = [];
    let isValid = true;
    
    if (!formData.facialType) {
      newFieldErrors.facialType = true;
      errors.push('Facial Type is required');
      isValid = false;
    } else {
      newFieldErrors.facialType = false;
    }
    
    if (!formData.profileType) {
      newFieldErrors.profileType = true;
      errors.push('Profile Type is required');
      isValid = false;
    } else {
      newFieldErrors.profileType = false;
    }
    
    setFieldErrors(newFieldErrors);
    if (errors.length > 0) {
      setError(errors.join(', '));
      return false;
    }
    if (isValid) setError(''); // Clear any previous errors
    return true;
  };

  const validateIntraOralExamination = () => {
    const newFieldErrors = { ...fieldErrors };
    const errors = [];
    let isValid = true;
    
    if (!formData.molarRelationRight) {
      newFieldErrors.molarRelationRight = true;
      errors.push('Molar Relation Right is required');
      isValid = false;
    } else {
      newFieldErrors.molarRelationRight = false;
    }
    
    if (!formData.molarRelationLeft) {
      newFieldErrors.molarRelationLeft = true;
      errors.push('Molar Relation Left is required');
      isValid = false;
    } else {
      newFieldErrors.molarRelationLeft = false;
    }
    
    if (!formData.overjet) {
      newFieldErrors.overjet = true;
      errors.push('Overjet is required');
      isValid = false;
    } else {
      newFieldErrors.overjet = false;
    }
    
    if (!formData.overbite) {
      newFieldErrors.overbite = true;
      errors.push('Overbite is required');
      isValid = false;
    } else {
      newFieldErrors.overbite = false;
    }
    
    if (!formData.spaceCondition || formData.spaceCondition.length === 0) {
      newFieldErrors.spaceCondition = true;
      errors.push('Space Condition is required');
      isValid = false;
    } else {
      newFieldErrors.spaceCondition = false;
    }
    
    setFieldErrors(newFieldErrors);
    if (errors.length > 0) {
      setError(errors.join(', '));
      return false;
    }
    if (isValid) setError(''); // Clear any previous errors
    return true;
  };

  const handleMainNext = () => {
    if (currentMainStep === 0) {
      if (!validateSpecialtyStep()) return;
      setLastCompletedStep(0);
      setIsMainStepper(true);
      setCurrentMainStep(1);
      
      // Don't auto-save on main step changes - only save when user actually starts filling forms
      
      // Clear animation state after animation completes
      setTimeout(() => {
        setLastCompletedStep(null);
      }, 800);
    } else if (currentMainStep === 1) {
      if (!validateFormTypeStep()) return;
      setLastCompletedStep(1);
      setIsMainStepper(true);
      
      // Don't auto-save on main step changes - only save when user actually starts filling forms
      
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
    if (currentFormStep < 5) {
      // Validate current step before proceeding
      let isValid = true;
      
      switch (currentFormStep) {
        case 0: // Personal Information
          isValid = validatePersonalInformation();
          break;
        case 1: // Medical History
          isValid = validateMedicalHistory();
          break;
        case 2: // Extra-oral Examination
          isValid = validateExtraOralExamination();
          break;
        case 3: // Intra-oral Examination
          isValid = validateIntraOralExamination();
          break;
        case 4: // Photo Upload
          isValid = true; // Photos are optional
          break;
        default:
          isValid = true;
      }
      
      if (!isValid) return;
      
      setLastCompletedStep(currentFormStep);
      setIsMainStepper(false);
      setCurrentFormStep(currentFormStep + 1);
      
      // Save draft immediately when moving to next step
      if (autoSaveEnabled) {
        setTimeout(() => saveDraft(), 100);
      }
      
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

  // Clinic management functions
  const handleAddClinic = async () => {
    const clinicName = newClinicName.trim();
    if (!clinicName) {
      setClinicError('Please enter a clinic name');
      return;
    }

    if (user?.clinics?.includes(clinicName)) {
      setClinicError('This clinic already exists');
      return;
    }

    try {
      // Update user clinics via AuthContext updateProfile
      const result = await updateProfile({
        ...user,
        clinics: [...(user?.clinics || []), clinicName]
      });

      if (result.success) {
        // User context is automatically updated by AuthContext
        setClinicSuccess(`Clinic "${clinicName}" added successfully!`);
        setSelectedClinic(clinicName); // Auto-select the new clinic
        setNewClinicName('');
        setClinicError('');
        
        // Close dialog after a short delay
        setTimeout(() => {
          setClinicDialogOpen(false);
          setClinicSuccess('');
        }, 1500);
      } else {
        setClinicError(result.error || 'Failed to add clinic. Please try again.');
      }
    } catch (error) {
      setClinicError('Failed to add clinic. Please try again.');
    }
  };

  const handleCloseClinicDialog = () => {
    setClinicDialogOpen(false);
    setNewClinicName('');
    setClinicError('');
    setClinicSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      // Prepare data for submission
      const submissionData = {
        selectedSpecialty,
        selectedFormType,
        selectedClinic,
        formData,
        uploadedImages
      };
      
      console.log('Submitting orthodontic examination:', submissionData);
      console.log('Form data details:', {
        fullName: formData.fullName,
        fileNumber: formData.fileNumber,
        selectedClinic,
        selectedSpecialty,
        selectedFormType
      });
      
      // Submit to backend API
      const response = await fetch('/api/orthodontic-examination', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(submissionData)
      });
      
      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);
      
      // Check if response is ok
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Response error:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      
      const result = await response.json();
      console.log('Response result:', result);
      
      if (result.success) {
        setSuccess(`Orthodontic examination saved successfully! Patient ID: ${result.patient_id}, Case ID: ${result.case_id}`);
        
        // Clear current draft after successful submission
        if (currentDraftId) {
          deleteDraft(currentDraftId);
        }
        
        // Reset form after successful submission
        setTimeout(() => {
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
          setUploadedImages({
            extraoralRight: null,
            extraoralFrontal: null,
            extraoralFrontalSmiling: null,
            extraoralZoomSmile: null,
            intraoralRight: null,
            intraoralFrontal: null,
            intraoralLeft: null,
            upperOcclusal: null,
            lowerOcclusal: null
          });
          setSuccess('');
        }, 5000);
      } else {
        console.error('Submission failed:', result);
        setError(result.message || 'Failed to submit examination. Please try again.');
      }
      
    } catch (error) {
      console.error('Submission error:', error);
      setError(`Failed to submit examination: ${error.message}. Please check your connection and try again.`);
    } finally {
      setLoading(false);
    }
  };

  // Specialty Selection Step
  const renderSpecialtySelection = () => (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">
          Select Specialty
        </Typography>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <FormControlLabel
            control={
              <Checkbox
                checked={autoSaveEnabled}
                onChange={(e) => setAutoSaveEnabled(e.target.checked)}
                size="small"
              />
            }
            label="Auto-save"
            sx={{ m: 0 }}
          />
          <Button
            variant="outlined"
            size="small"
            startIcon={<SaveIcon />}
            onClick={saveDraft}
            disabled={!selectedSpecialty && !selectedFormType && !selectedClinic && !Object.values(formData).some(value => Array.isArray(value) ? value.length > 0 : value !== '')}
          >
            Save Draft
          </Button>
        </Box>
      </Box>
      
      {/* Auto-selection notification */}
      {selectedSpecialty && user?.specialty && (
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="body2">
            <strong>Auto-selected:</strong> {user.specialty} specialty detected from your profile
          </Typography>
        </Alert>
      )}

      {/* Select Specialty Section */}
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card 
            sx={{ 
              cursor: 'pointer',
              border: fieldErrors.specialty ? 3 : (selectedSpecialty === 'orthodontic' ? 3 : 1),
              borderColor: fieldErrors.specialty ? 'error.main' : (selectedSpecialty === 'orthodontic' ? 'primary.main' : 'divider'),
              boxShadow: fieldErrors.specialty ? '0 0 0 2px rgba(211, 47, 47, 0.2)' : (selectedSpecialty === 'orthodontic' ? 3 : 1),
              backgroundColor: fieldErrors.specialty ? 'error.50' : (selectedSpecialty === 'orthodontic' ? 'primary.50' : 'background.paper'),
              position: 'relative',
              animation: fieldErrors.specialty ? 'shake 0.5s ease-in-out' : 'none',
              '&:hover': {
                boxShadow: 2
              },
              '@keyframes shake': {
                '0%, 100%': { transform: 'translateX(0)' },
                '25%': { transform: 'translateX(-5px)' },
                '75%': { transform: 'translateX(5px)' },
              }
            }}
            onClick={() => setSelectedSpecialtyWithErrorClear('orthodontic')}
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
        <Grid size={{ xs: 12, md: 4 }}>
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
        <Grid size={{ xs: 12, md: 4 }}>
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
        <FormControl fullWidth error={fieldErrors.clinic}>
          <InputLabel sx={{ 
            color: fieldErrors.clinic ? 'error.main' : 'inherit',
            fontWeight: fieldErrors.clinic ? 600 : 500,
            '&.Mui-focused': { 
              color: fieldErrors.clinic ? 'error.main' : 'primary.main', 
              fontWeight: 600 
            } 
          }}>
            Select Clinic/Practice *
          </InputLabel>
          <Select
            value={selectedClinic}
            onChange={(e) => setSelectedClinicWithErrorClear(e.target.value)}
            label="Select Clinic/Practice *"
            required
            error={fieldErrors.clinic}
            sx={{
              '& .MuiSelect-select': {
                display: 'flex',
                alignItems: 'center',
                gap: 1,
              },
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: fieldErrors.clinic ? 'error.main' : 'divider',
                borderWidth: fieldErrors.clinic ? 2 : 1,
              },
              '&:hover .MuiOutlinedInput-notchedOutline': {
                borderColor: fieldErrors.clinic ? 'error.main' : 'primary.main',
              },
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                borderColor: fieldErrors.clinic ? 'error.main' : 'primary.main',
                borderWidth: 2,
              },
              animation: fieldErrors.clinic ? 'shake 0.5s ease-in-out' : 'none',
              '@keyframes shake': {
                '0%, 100%': { transform: 'translateX(0)' },
                '25%': { transform: 'translateX(-3px)' },
                '75%': { transform: 'translateX(3px)' },
              }
            }}
            MenuProps={{
              PaperProps: {
                sx: {
                  maxHeight: 300,
                  '& .MuiMenuItem-root': {
                    borderRadius: 1,
                    mx: 1,
                    my: 0.5,
                    transition: 'all 0.2s cubic-bezier(0.4, 0.0, 0.2, 1)',
                    '&:hover': {
                      bgcolor: 'primary.main',
                      color: 'primary.contrastText',
                      transform: 'translateX(4px)',
                      '& .MuiListItemIcon-root': {
                        color: 'inherit',
                      },
                    },
                    '&.Mui-selected': {
                      bgcolor: 'primary.light',
                      color: 'primary.contrastText',
                      '&:hover': {
                        bgcolor: 'primary.main',
                      },
                    },
                  },
                },
              },
            }}
          >
            {user?.clinics?.length > 0 ? (
              user.clinics.map((clinic, index) => (
                <MenuItem key={index} value={clinic}>
                  <ListItemIcon>
                    <LocalHospital fontSize="small" />
                  </ListItemIcon>
                  <ListItemText primary={clinic} />
                </MenuItem>
              ))
            ) : (
              <MenuItem disabled>
                <ListItemIcon>
                  <LocalHospital fontSize="small" color="disabled" />
                </ListItemIcon>
                <ListItemText 
                  primary="No clinics configured" 
                  secondary="Add clinics below or in Settings"
                />
              </MenuItem>
            )}
            
            {/* Add New Clinic Option */}
            <Divider sx={{ mx: 1, my: 1 }} />
            <MenuItem 
              onClick={() => setClinicDialogOpen(true)}
              sx={{
                color: 'primary.main',
                fontWeight: 600,
                '&:hover': {
                  bgcolor: 'primary.main',
                  color: 'primary.contrastText',
                  '& .MuiListItemIcon-root': {
                    color: 'primary.contrastText !important',
                  },
                  '& .MuiSvgIcon-root': {
                    color: 'primary.contrastText !important',
                  },
                },
              }}
            >
              <ListItemIcon 
                sx={{
                  color: 'primary.main',
                  transition: 'color 0.2s ease',
                }}
              >
                <Add 
                  fontSize="small" 
                  sx={{ 
                    color: 'inherit',
                    transition: 'color 0.2s ease',
                  }} 
                />
              </ListItemIcon>
              <ListItemText primary="Add New Clinic" />
            </MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Form Type Options */}
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card 
            sx={{ 
              cursor: 'pointer',
              border: fieldErrors.formType ? 3 : (selectedFormType === 'registration' ? 2 : 1),
              borderColor: fieldErrors.formType ? 'error.main' : (selectedFormType === 'registration' ? 'primary.main' : 'divider'),
              boxShadow: fieldErrors.formType ? '0 0 0 2px rgba(211, 47, 47, 0.2)' : 'none',
              backgroundColor: fieldErrors.formType ? 'error.50' : 'background.paper',
              animation: fieldErrors.formType ? 'shake 0.5s ease-in-out' : 'none',
              '@keyframes shake': {
                '0%, 100%': { transform: 'translateX(0)' },
                '25%': { transform: 'translateX(-5px)' },
                '75%': { transform: 'translateX(5px)' },
              }
            }}
            onClick={() => setSelectedFormTypeWithErrorClear('registration')}
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
        <Grid size={{ xs: 12, md: 4 }}>
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
        <Grid size={{ xs: 12, md: 4 }}>
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
          endIcon={<ArrowForward />}
        >
          Next
        </Button>
      </Box>
    </Box>
  );

  // Personal Information Step
  const renderPersonalInformation = () => (
      <Box>
        <Typography variant="h5" gutterBottom sx={{ mb: 2, textAlign: { xs: 'center', md: 'left' } }}>
          Personal Information
        </Typography>
        
        {/* Required fields instruction */}
        <Typography 
          variant="body2" 
          color="text.secondary" 
          sx={{ 
            mb: 3, 
            textAlign: { xs: 'center', md: 'left' },
            fontStyle: 'italic',
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            justifyContent: { xs: 'center', md: 'flex-start' }
          }}
        >
          <span style={{ color: '#d32f2f', fontWeight: 'bold' }}>*</span>
          Fields marked with an asterisk are required and must be filled to continue
        </Typography>
        
        <Paper sx={{ p: { xs: 2, md: 3 }, mb: 3, border: '1px solid', borderColor: 'divider' }}>
          <Grid container spacing={3}>
            {/* Full Name - Full width on mobile, half on desktop */}
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                required
                fullWidth
                label="Full Name"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                variant="outlined"
                error={fieldErrors.fullName}
                helperText={fieldErrors.fullName ? "Full Name is required" : ""}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    backgroundColor: 'background.paper',
                    transition: 'all 0.3s cubic-bezier(0.4, 0.0, 0.2, 1)',
                    '&:hover': {
                      backgroundColor: 'action.hover',
                      transform: 'translateY(-1px)',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    },
                    '&.Mui-focused': {
                      backgroundColor: 'background.paper',
                      transform: 'translateY(-2px)',
                      boxShadow: '0 6px 20px rgba(0,0,0,0.15)',
                    },
                    ...(fieldErrors.fullName && {
                      borderColor: 'error.main',
                      backgroundColor: 'error.50',
                      animation: 'shake 0.5s ease-in-out',
                      '@keyframes shake': {
                        '0%, 100%': { transform: 'translateX(0)' },
                        '25%': { transform: 'translateX(-4px)' },
                        '75%': { transform: 'translateX(4px)' },
                      },
                    }),
                  },
                  '& .MuiInputLabel-root': {
                    fontWeight: 500,
                    '&.Mui-focused': {
                      color: 'primary.main',
                      fontWeight: 600,
                    },
                  },
                }}
              />
            </Grid>
            
            {/* File Number - Auto width based on content */}
            <Grid size={{ xs: 12, md: 6, lg: 4 }}>
              <TextField
                required
                fullWidth
                label="File Number"
                name="fileNumber"
                value={formData.fileNumber}
                onChange={handleChange}
                variant="outlined"
                placeholder="e.g., FN-2024-001"
                error={fieldErrors.fileNumber}
                helperText={fieldErrors.fileNumber ? "File Number is required" : ""}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    backgroundColor: 'background.paper',
                    transition: 'all 0.3s cubic-bezier(0.4, 0.0, 0.2, 1)',
                    '&:hover': {
                      backgroundColor: 'action.hover',
                      transform: 'translateY(-1px)',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    },
                    '&.Mui-focused': {
                      backgroundColor: 'background.paper',
                      transform: 'translateY(-2px)',
                      boxShadow: '0 6px 20px rgba(0,0,0,0.15)',
                    },
                    ...(fieldErrors.fileNumber && {
                      borderColor: 'error.main',
                      backgroundColor: 'error.50',
                      animation: 'shake 0.5s ease-in-out',
                      '@keyframes shake': {
                        '0%, 100%': { transform: 'translateX(0)' },
                        '25%': { transform: 'translateX(-4px)' },
                        '75%': { transform: 'translateX(4px)' },
                      },
                    }),
                  },
                  '& .MuiInputLabel-root': {
                    fontWeight: 500,
                    '&.Mui-focused': {
                      color: 'primary.main',
                      fontWeight: 600,
                    },
                  },
                }}
              />
            </Grid>
            
            {/* Gender - Smaller width */}
            <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
              <FormControl fullWidth>
                <InputLabel sx={{ fontWeight: 500, '&.Mui-focused': { color: 'primary.main', fontWeight: 600 } }}>
                  Gender
                </InputLabel>
                <Select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  label="Gender"
                  sx={{
                    borderRadius: 2,
                    backgroundColor: 'background.paper',
                    transition: 'all 0.3s cubic-bezier(0.4, 0.0, 0.2, 1)',
                    '&:hover': {
                      backgroundColor: 'action.hover',
                      transform: 'translateY(-1px)',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    },
                    '&.Mui-focused': {
                      backgroundColor: 'background.paper',
                      transform: 'translateY(-2px)',
                      boxShadow: '0 6px 20px rgba(0,0,0,0.15)',
                    },
                  }}
                  MenuProps={{
                    PaperProps: {
                      sx: {
                        borderRadius: 3,
                        mt: 1,
                        boxShadow: '0 12px 40px rgba(0,0,0,0.15)',
                        border: '1px solid',
                        borderColor: 'divider',
                        '& .MuiMenuItem-root': {
                          borderRadius: 2,
                          mx: 1,
                          my: 0.5,
                          transition: 'all 0.2s cubic-bezier(0.4, 0.0, 0.2, 1)',
                          '&:hover': {
                            bgcolor: 'primary.main',
                            color: 'primary.contrastText',
                            transform: 'translateX(4px) scale(1.02)',
                          },
                        },
                      },
                    },
                    TransitionProps: {
                      timeout: 300,
                    },
                  }}
                >
                  <MenuItem value="male">Male</MenuItem>
                  <MenuItem value="female">Female</MenuItem>
                  <MenuItem value="other">Other</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            {/* Date of Birth */}
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DatePicker
                  label="Date of Birth"
                  value={formData.dateOfBirth ? dayjs(formData.dateOfBirth) : null}
                  onChange={(newValue) => {
                    const dateString = newValue ? newValue.format('YYYY-MM-DD') : '';
                    handleChange({
                      target: {
                        name: 'dateOfBirth',
                        value: dateString
                      }
                    });
                  }}
                  views={['year', 'month', 'day']}
                  openTo="year"
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      variant: 'outlined',
                    },
                    popper: {
                      sx: {
                        '& .MuiPickersCalendarHeader-root': {
                          backgroundColor: 'primary.main',
                          color: 'white',
                          '& .MuiPickersCalendarHeader-label': {
                            color: 'white',
                            fontWeight: 600,
                          },
                          '& .MuiPickersArrowSwitcher-root .MuiIconButton-root': {
                            color: 'white',
                            '&:hover': {
                              backgroundColor: 'rgba(255, 255, 255, 0.1)',
                            },
                          },
                        },
                      },
                    },
                  }}
                  maxDate={dayjs()}
                />
              </LocalizationProvider>
            </Grid>
            
            {/* Age - Auto calculated, smaller width */}
            <Grid size={{ xs: 6, sm: 4, md: 3, lg: 2 }}>
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
            <Grid size={{ xs: 6, sm: 4, md: 3 }}>
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
            <Grid size={{ xs: 12 }}>
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
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <FormControl fullWidth>
                <InputLabel sx={{ fontWeight: 500, '&.Mui-focused': { color: 'primary.main', fontWeight: 600 } }}>
                  Pubertal Stage
                </InputLabel>
                <Select
                  name="pubertalStage"
                  value={formData.pubertalStage}
                  onChange={handleChange}
                  label="Pubertal Stage"
                  sx={{
                    borderRadius: 2,
                    backgroundColor: 'background.paper',
                    transition: 'all 0.3s cubic-bezier(0.4, 0.0, 0.2, 1)',
                    '&:hover': {
                      backgroundColor: 'action.hover',
                      transform: 'translateY(-1px)',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    },
                    '&.Mui-focused': {
                      backgroundColor: 'background.paper',
                      transform: 'translateY(-2px)',
                      boxShadow: '0 6px 20px rgba(0,0,0,0.15)',
                    },
                  }}
                  MenuProps={{
                    PaperProps: {
                      sx: {
                        borderRadius: 3,
                        mt: 1,
                        boxShadow: '0 12px 40px rgba(0,0,0,0.15)',
                        border: '1px solid',
                        borderColor: 'divider',
                        '& .MuiMenuItem-root': {
                          borderRadius: 2,
                          mx: 1,
                          my: 0.5,
                          transition: 'all 0.2s cubic-bezier(0.4, 0.0, 0.2, 1)',
                          '&:hover': {
                            bgcolor: 'primary.main',
                            color: 'primary.contrastText',
                            transform: 'translateX(4px) scale(1.02)',
                          },
                        },
                      },
                    },
                    TransitionProps: {
                      timeout: 300,
                    },
                  }}
                >
                  <MenuItem value="pre-pubertal">Pre-pubertal</MenuItem>
                  <MenuItem value="pubertal">Pubertal</MenuItem>
                  <MenuItem value="post-pubertal">Post-pubertal</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            {/* Hereditary Pattern */}
            <Grid size={{ xs: 12, sm: 6, md: 8 }}>
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
  );

  // Medical & Dental History Step
  const renderMedicalHistory = () => (
      <Box>
        <Typography variant="h5" gutterBottom sx={{ mb: 3, textAlign: { xs: 'center', md: 'left' } }}>
          Medical & Dental History
        </Typography>
        
        <Paper sx={{ p: { xs: 2, md: 3 }, mb: 3, border: '1px solid', borderColor: 'divider' }}>
          <Grid container spacing={3}>
            {/* Medical Condition */}
            <Grid size={{ xs: 12, md: 6 }}>
              <FormControl fullWidth required error={fieldErrors.medicalCondition}>
                <InputLabel sx={{ fontWeight: 500, '&.Mui-focused': { color: 'primary.main', fontWeight: 600 } }}>
                  Medical Condition
                </InputLabel>
                <Select
                  name="medicalCondition"
                  value={formData.medicalCondition}
                  onChange={handleChange}
                  label="Medical Condition"
                  sx={{
                    borderRadius: 2,
                    backgroundColor: 'background.paper',
                    transition: 'all 0.3s cubic-bezier(0.4, 0.0, 0.2, 1)',
                    '&:hover': {
                      backgroundColor: 'action.hover',
                      transform: 'translateY(-1px)',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    },
                    '&.Mui-focused': {
                      backgroundColor: 'background.paper',
                      transform: 'translateY(-2px)',
                      boxShadow: '0 6px 20px rgba(0,0,0,0.15)',
                    },
                    ...(fieldErrors.medicalCondition && {
                      borderColor: 'error.main',
                      backgroundColor: 'error.50',
                      animation: 'shake 0.5s ease-in-out',
                      '@keyframes shake': {
                        '0%, 100%': { transform: 'translateX(0)' },
                        '25%': { transform: 'translateX(-4px)' },
                        '75%': { transform: 'translateX(4px)' },
                      },
                    }),
                  }}
                  MenuProps={{
                    PaperProps: {
                      sx: {
                        borderRadius: 3,
                        mt: 1,
                        boxShadow: '0 12px 40px rgba(0,0,0,0.15)',
                        border: '1px solid',
                        borderColor: 'divider',
                        '& .MuiMenuItem-root': {
                          borderRadius: 2,
                          mx: 1,
                          my: 0.5,
                          transition: 'all 0.2s cubic-bezier(0.4, 0.0, 0.2, 1)',
                          '&:hover': {
                            bgcolor: 'primary.main',
                            color: 'primary.contrastText',
                            transform: 'translateX(4px) scale(1.02)',
                          },
                        },
                      },
                    },
                    TransitionProps: {
                      timeout: 300,
                    },
                  }}
                >
                  <MenuItem value="none">No known medical condition</MenuItem>
                  <MenuItem value="other">Other</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            {formData.medicalCondition === 'other' && (
              <Grid size={{ xs: 12, md: 6 }}>
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
            <Grid size={{ xs: 12, md: 6 }}>
              <FormControl fullWidth>
                <InputLabel sx={{ fontWeight: 500, '&.Mui-focused': { color: 'primary.main', fontWeight: 600 } }}>
                  Medication
                </InputLabel>
                <Select
                  name="medication"
                  value={formData.medication}
                  onChange={handleChange}
                  label="Medication"
                  sx={{
                    borderRadius: 2,
                    backgroundColor: 'background.paper',
                    transition: 'all 0.3s cubic-bezier(0.4, 0.0, 0.2, 1)',
                    '&:hover': {
                      backgroundColor: 'action.hover',
                      transform: 'translateY(-1px)',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    },
                    '&.Mui-focused': {
                      backgroundColor: 'background.paper',
                      transform: 'translateY(-2px)',
                      boxShadow: '0 6px 20px rgba(0,0,0,0.15)',
                    },
                  }}
                  MenuProps={{
                    PaperProps: {
                      sx: {
                        borderRadius: 3,
                        mt: 1,
                        boxShadow: '0 12px 40px rgba(0,0,0,0.15)',
                        border: '1px solid',
                        borderColor: 'divider',
                        '& .MuiMenuItem-root': {
                          borderRadius: 2,
                          mx: 1,
                          my: 0.5,
                          transition: 'all 0.2s cubic-bezier(0.4, 0.0, 0.2, 1)',
                          '&:hover': {
                            bgcolor: 'primary.main',
                            color: 'primary.contrastText',
                            transform: 'translateX(4px) scale(1.02)',
                          },
                        },
                      },
                    },
                    TransitionProps: {
                      timeout: 300,
                    },
                  }}
                >
                  <MenuItem value="none">None</MenuItem>
                  <MenuItem value="other">Other</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            {formData.medication === 'other' && (
              <Grid size={{ xs: 12, md: 6 }}>
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
            <Grid size={{ xs: 12, md: 6 }}>
              <FormControl fullWidth>
                <InputLabel sx={{ fontWeight: 500, '&.Mui-focused': { color: 'primary.main', fontWeight: 600 } }}>
                  Allergy
                </InputLabel>
                <Select
                  name="allergy"
                  value={formData.allergy}
                  onChange={handleChange}
                  label="Allergy"
                  sx={{
                    borderRadius: 2,
                    backgroundColor: 'background.paper',
                    transition: 'all 0.3s cubic-bezier(0.4, 0.0, 0.2, 1)',
                    '&:hover': {
                      backgroundColor: 'action.hover',
                      transform: 'translateY(-1px)',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    },
                    '&.Mui-focused': {
                      backgroundColor: 'background.paper',
                      transform: 'translateY(-2px)',
                      boxShadow: '0 6px 20px rgba(0,0,0,0.15)',
                    },
                  }}
                  MenuProps={{
                    PaperProps: {
                      sx: {
                        borderRadius: 3,
                        mt: 1,
                        boxShadow: '0 12px 40px rgba(0,0,0,0.15)',
                        border: '1px solid',
                        borderColor: 'divider',
                        '& .MuiMenuItem-root': {
                          borderRadius: 2,
                          mx: 1,
                          my: 0.5,
                          transition: 'all 0.2s cubic-bezier(0.4, 0.0, 0.2, 1)',
                          '&:hover': {
                            bgcolor: 'primary.main',
                            color: 'primary.contrastText',
                            transform: 'translateX(4px) scale(1.02)',
                          },
                        },
                      },
                    },
                    TransitionProps: {
                      timeout: 300,
                    },
                  }}
                >
                  <MenuItem value="none">None</MenuItem>
                  <MenuItem value="other">Other</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            {formData.allergy === 'other' && (
              <Grid size={{ xs: 12, md: 6 }}>
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
            <Grid size={{ xs: 12, md: 6 }}>
              <FormControl fullWidth>
                <InputLabel sx={{ fontWeight: 500, '&.Mui-focused': { color: 'primary.main', fontWeight: 600 } }}>
                  Hospitalization
                </InputLabel>
                <Select
                  name="hospitalization"
                  value={formData.hospitalization}
                  onChange={handleChange}
                  label="Hospitalization"
                  sx={{
                    borderRadius: 2,
                    backgroundColor: 'background.paper',
                    transition: 'all 0.3s cubic-bezier(0.4, 0.0, 0.2, 1)',
                    '&:hover': {
                      backgroundColor: 'action.hover',
                      transform: 'translateY(-1px)',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    },
                    '&.Mui-focused': {
                      backgroundColor: 'background.paper',
                      transform: 'translateY(-2px)',
                      boxShadow: '0 6px 20px rgba(0,0,0,0.15)',
                    },
                  }}
                  MenuProps={{
                    PaperProps: {
                      sx: {
                        borderRadius: 3,
                        mt: 1,
                        boxShadow: '0 12px 40px rgba(0,0,0,0.15)',
                        border: '1px solid',
                        borderColor: 'divider',
                        '& .MuiMenuItem-root': {
                          borderRadius: 2,
                          mx: 1,
                          my: 0.5,
                          transition: 'all 0.2s cubic-bezier(0.4, 0.0, 0.2, 1)',
                          '&:hover': {
                            bgcolor: 'primary.main',
                            color: 'primary.contrastText',
                            transform: 'translateX(4px) scale(1.02)',
                          },
                        },
                      },
                    },
                    TransitionProps: {
                      timeout: 300,
                    },
                  }}
                >
                  <MenuItem value="none">No previous hospitalization</MenuItem>
                  <MenuItem value="other">Other</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            {formData.hospitalization === 'other' && (
              <Grid size={{ xs: 12, md: 6 }}>
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
            <Grid size={{ xs: 12 }}>
              <FormControl component="fieldset" required error={fieldErrors.dentalHistory}>
                <FormLabel 
                  component="legend" 
                  sx={{ 
                    mb: 2, 
                    fontSize: '1rem', 
                    fontWeight: 600,
                    ...(fieldErrors.dentalHistory && {
                      color: 'error.main',
                    }),
                  }}
                >
                  Dental History
                </FormLabel>
                <Box
                  sx={{
                    ...(fieldErrors.dentalHistory && {
                      border: '2px solid',
                      borderColor: 'error.main',
                      borderRadius: 2,
                      backgroundColor: 'error.50',
                      p: 2,
                      animation: 'shake 0.5s ease-in-out',
                      '@keyframes shake': {
                        '0%, 100%': { transform: 'translateX(0)' },
                        '25%': { transform: 'translateX(-4px)' },
                        '75%': { transform: 'translateX(4px)' },
                      },
                    }),
                  }}
                >
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
                </Box>
                {fieldErrors.dentalHistory && (
                  <Typography variant="caption" color="error" sx={{ mt: 1, ml: 2 }}>
                    Please select at least one dental history option
                  </Typography>
                )}
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
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <FormControl fullWidth>
                <InputLabel sx={{ fontWeight: 500, '&.Mui-focused': { color: 'primary.main', fontWeight: 600 } }}>
                  Previous Orthodontic Treatment
                </InputLabel>
                <Select
                  name="previousOrthodonticTreatment"
                  value={formData.previousOrthodonticTreatment}
                  onChange={handleChange}
                  label="Previous Orthodontic Treatment"
                  sx={{
                    borderRadius: 2,
                    backgroundColor: 'background.paper',
                    transition: 'all 0.3s cubic-bezier(0.4, 0.0, 0.2, 1)',
                    '&:hover': {
                      backgroundColor: 'action.hover',
                      transform: 'translateY(-1px)',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    },
                    '&.Mui-focused': {
                      backgroundColor: 'background.paper',
                      transform: 'translateY(-2px)',
                      boxShadow: '0 6px 20px rgba(0,0,0,0.15)',
                    },
                  }}
                  MenuProps={{
                    PaperProps: {
                      sx: {
                        borderRadius: 3,
                        mt: 1,
                        boxShadow: '0 12px 40px rgba(0,0,0,0.15)',
                        border: '1px solid',
                        borderColor: 'divider',
                        '& .MuiMenuItem-root': {
                          borderRadius: 2,
                          mx: 1,
                          my: 0.5,
                          transition: 'all 0.2s cubic-bezier(0.4, 0.0, 0.2, 1)',
                          '&:hover': {
                            bgcolor: 'primary.main',
                            color: 'primary.contrastText',
                            transform: 'translateX(4px) scale(1.02)',
                          },
                        },
                      },
                    },
                    TransitionProps: {
                      timeout: 300,
                    },
                  }}
                >
                  <MenuItem value="yes">Yes</MenuItem>
                  <MenuItem value="no">No</MenuItem>
                  <MenuItem value="other">Other</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            {formData.previousOrthodonticTreatment === 'other' && (
              <Grid size={{ xs: 12, sm: 6, md: 8 }}>
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
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
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
              <Grid size={{ xs: 12, sm: 6, md: 8 }}>
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
  );

  // Extra-oral Examination Step
  const renderExtraOralExamination = () => (
      <Box>
        <Typography variant="h5" gutterBottom sx={{ mb: 3, textAlign: { xs: 'center', md: 'left' } }}>
          Extra-oral Examination
        </Typography>
        
        <Paper sx={{ p: { xs: 2, md: 3 }, mb: 3, border: '1px solid', borderColor: 'divider' }}>
          <Grid container spacing={3}>
            {/* Facial Type */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth required error={fieldErrors.facialType}>
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

            {/* Profile Type */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth required error={fieldErrors.profileType}>
                <InputLabel>Profile Type</InputLabel>
                <Select
                  name="profileType"
                  value={formData.profileType}
                  onChange={handleChange}
                  label="Profile Type"
                >
                  <MenuItem value="convex">Convex</MenuItem>
                  <MenuItem value="straight">Straight</MenuItem>
                  <MenuItem value="concave">Concave</MenuItem>
                  <MenuItem value="other">Other</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {formData.profileType === 'other' && (
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Specify Profile Type"
                  name="profileTypeOther"
                  value={formData.profileTypeOther}
                  onChange={handleChange}
                  placeholder="Please specify the profile type..."
                />
              </Grid>
            )}

            {/* Vertical Facial Proportion */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth>
                <InputLabel>Vertical Facial Proportion</InputLabel>
                <Select
                  name="verticalFacialProportion"
                  value={formData.verticalFacialProportion}
                  onChange={handleChange}
                  label="Vertical Facial Proportion"
                >
                  <MenuItem value="increased">Increased</MenuItem>
                  <MenuItem value="reduced">Reduced</MenuItem>
                  <MenuItem value="normal">Normal</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Smile Line */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth>
                <InputLabel>Smile Line</InputLabel>
                <Select
                  name="smileLine"
                  value={formData.smileLine}
                  onChange={handleChange}
                  label="Smile Line"
                >
                  <MenuItem value="low">Low smile line</MenuItem>
                  <MenuItem value="normal">Normal</MenuItem>
                  <MenuItem value="high">High smile line (gummy smile)</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Facial Asymmetry */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth>
                <InputLabel>Facial Asymmetry</InputLabel>
                <Select
                  name="facialAsymmetry"
                  value={formData.facialAsymmetry}
                  onChange={handleChange}
                  label="Facial Asymmetry"
                >
                  <MenuItem value="symmetrical">Symmetrical</MenuItem>
                  <MenuItem value="asymmetrical">Asymmetrical</MenuItem>
                  <MenuItem value="other">Other</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {formData.facialAsymmetry === 'other' && (
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Specify Facial Asymmetry"
                  name="facialAsymmetryOther"
                  value={formData.facialAsymmetryOther}
                  onChange={handleChange}
                  placeholder="Please specify the facial asymmetry..."
                />
              </Grid>
            )}

            {/* Midline Upper */}
            <Grid size={{ xs: 12, sm: 4 }}>
              <FormControl fullWidth>
                <InputLabel>Midline Upper</InputLabel>
                <Select
                  name="midlineUpper"
                  value={formData.midlineUpper}
                  onChange={handleChange}
                  label="Midline Upper"
                >
                  <MenuItem value="on">On</MenuItem>
                  <MenuItem value="off">Off</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {formData.midlineUpper === 'off' && (
              <>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <FormControl fullWidth>
                    <InputLabel>Upper Side</InputLabel>
                    <Select
                      name="midlineUpperSide"
                      value={formData.midlineUpperSide}
                      onChange={handleChange}
                      label="Upper Side"
                    >
                      <MenuItem value="right">Right</MenuItem>
                      <MenuItem value="left">Left</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField
                    fullWidth
                    label="Upper Millimeters"
                    name="midlineUpperMm"
                    value={formData.midlineUpperMm}
                    onChange={handleChange}
                    type="number"
                    InputProps={{
                      endAdornment: <Typography variant="body2" sx={{ ml: 1 }}>mm</Typography>
                    }}
                  />
                </Grid>
              </>
            )}

            {/* Midline Lower */}
            <Grid size={{ xs: 12, sm: 4 }}>
              <FormControl fullWidth>
                <InputLabel>Midline Lower</InputLabel>
                <Select
                  name="midlineLower"
                  value={formData.midlineLower}
                  onChange={handleChange}
                  label="Midline Lower"
                >
                  <MenuItem value="on">On</MenuItem>
                  <MenuItem value="off">Off</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {formData.midlineLower === 'off' && (
              <>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <FormControl fullWidth>
                    <InputLabel>Lower Side</InputLabel>
                    <Select
                      name="midlineLowerSide"
                      value={formData.midlineLowerSide}
                      onChange={handleChange}
                      label="Lower Side"
                    >
                      <MenuItem value="right">Right</MenuItem>
                      <MenuItem value="left">Left</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField
                    fullWidth
                    label="Lower Millimeters"
                    name="midlineLowerMm"
                    value={formData.midlineLowerMm}
                    onChange={handleChange}
                    type="number"
                    InputProps={{
                      endAdornment: <Typography variant="body2" sx={{ ml: 1 }}>mm</Typography>
                    }}
                  />
                </Grid>
              </>
            )}

            {/* Nasolabial */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth>
                <InputLabel>Nasolabial</InputLabel>
                <Select
                  name="nasolabial"
                  value={formData.nasolabial}
                  onChange={handleChange}
                  label="Nasolabial"
                >
                  <MenuItem value=">90">&gt;90 degree</MenuItem>
                  <MenuItem value="90">90 degree</MenuItem>
                  <MenuItem value="<90">&lt;90 degree</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Nose Size */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth>
                <InputLabel>Nose Size</InputLabel>
                <Select
                  name="noseSize"
                  value={formData.noseSize}
                  onChange={handleChange}
                  label="Nose Size"
                >
                  <MenuItem value="small">Small</MenuItem>
                  <MenuItem value="medium">Medium</MenuItem>
                  <MenuItem value="large">Large</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Mentolabial Fold */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth>
                <InputLabel>Mentolabial Fold</InputLabel>
                <Select
                  name="mentolabialFold"
                  value={formData.mentolabialFold}
                  onChange={handleChange}
                  label="Mentolabial Fold"
                >
                  <MenuItem value="shallow">Shallow</MenuItem>
                  <MenuItem value="deep">Deep</MenuItem>
                  <MenuItem value="other">Other</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {formData.mentolabialFold === 'other' && (
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Specify Mentolabial Fold"
                  name="mentolabialFoldOther"
                  value={formData.mentolabialFoldOther}
                  onChange={handleChange}
                  placeholder="Please specify the mentolabial fold..."
                />
              </Grid>
            )}

            {/* Lip in Repose */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth>
                <InputLabel>Lip in Repose</InputLabel>
                <Select
                  name="lipInRepose"
                  value={formData.lipInRepose}
                  onChange={handleChange}
                  label="Lip in Repose"
                >
                  <MenuItem value="contact">In contact</MenuItem>
                  <MenuItem value="apart">Apart</MenuItem>
                  <MenuItem value="trap">Lip trap</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Lip in Contact */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth>
                <InputLabel>Lip in Contact</InputLabel>
                <Select
                  name="lipInContact"
                  value={formData.lipInContact}
                  onChange={handleChange}
                  label="Lip in Contact"
                >
                  <MenuItem value="normal">Normal muscle balance</MenuItem>
                  <MenuItem value="hyperactive_mentalis">Hyperactive mentalis</MenuItem>
                  <MenuItem value="hyperactive_orbicularis">Hyperactive orbicularis oris</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Jaw Function - Muscle Tenderness */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth>
                <InputLabel>Jaw Function - Muscle Tenderness</InputLabel>
                <Select
                  name="jawFunctionMuscleTenderness"
                  value={formData.jawFunctionMuscleTenderness}
                  onChange={handleChange}
                  label="Jaw Function - Muscle Tenderness"
                >
                  <MenuItem value="none">None</MenuItem>
                  <MenuItem value="yes">Yes</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {formData.jawFunctionMuscleTenderness === 'yes' && (
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Specify Muscle Tenderness"
                  name="jawFunctionMuscleTendernessText"
                  value={formData.jawFunctionMuscleTendernessText}
                  onChange={handleChange}
                  placeholder="Describe the muscle tenderness..."
                />
              </Grid>
            )}

            {/* TMJ Sound */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth>
                <InputLabel>TMJ Sound</InputLabel>
                <Select
                  name="tmjSound"
                  value={formData.tmjSound}
                  onChange={handleChange}
                  label="TMJ Sound"
                >
                  <MenuItem value="none">None</MenuItem>
                  <MenuItem value="yes">Yes</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {formData.tmjSound === 'yes' && (
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Specify TMJ Sound"
                  name="tmjSoundText"
                  value={formData.tmjSoundText}
                  onChange={handleChange}
                  placeholder="Describe the TMJ sound..."
                />
              </Grid>
            )}

            {/* Mandibular Shift */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth>
                <InputLabel>Mandibular Shift</InputLabel>
                <Select
                  name="mandibularShift"
                  value={formData.mandibularShift}
                  onChange={handleChange}
                  label="Mandibular Shift"
                >
                  <MenuItem value="no">No</MenuItem>
                  <MenuItem value="yes">Yes</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {formData.mandibularShift === 'yes' && (
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Specify Mandibular Shift"
                  name="mandibularShiftText"
                  value={formData.mandibularShiftText}
                  onChange={handleChange}
                  placeholder="Describe the mandibular shift..."
                />
              </Grid>
            )}

            {/* Additional examination notes */}
            <Grid size={{ xs: 12 }}>
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
            Next: Intra-oral Examination
          </Button>
        </Box>
      </Box>
  );

  // Intra-oral Examination Step
  const renderIntraOralExamination = () => (
      <Box>
        <Typography variant="h5" gutterBottom sx={{ mb: 3, textAlign: { xs: 'center', md: 'left' } }}>
          Intra-oral Examination
        </Typography>
        
        <Paper sx={{ p: { xs: 2, md: 3 }, mb: 3, border: '1px solid', borderColor: 'divider' }}>
          <Grid container spacing={3}>
            {/* Oral Hygiene */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth>
                <InputLabel>Oral Hygiene</InputLabel>
                <Select
                  name="oralHygiene"
                  value={formData.oralHygiene}
                  onChange={handleChange}
                  label="Oral Hygiene"
                >
                  <MenuItem value="good">Good</MenuItem>
                  <MenuItem value="average">Average</MenuItem>
                  <MenuItem value="poor">Poor</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Frenulum Attachment Maxilla */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth>
                <InputLabel>Frenulum Attachment Maxilla</InputLabel>
                <Select
                  name="frenulumAttachmentMaxilla"
                  value={formData.frenulumAttachmentMaxilla}
                  onChange={handleChange}
                  label="Frenulum Attachment Maxilla"
                >
                  <MenuItem value="normal">Normal</MenuItem>
                  <MenuItem value="marginally_attached">Marginally attached</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Tongue Size */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth>
                <InputLabel>Tongue Size</InputLabel>
                <Select
                  name="tongueSize"
                  value={formData.tongueSize}
                  onChange={handleChange}
                  label="Tongue Size"
                >
                  <MenuItem value="small">Small</MenuItem>
                  <MenuItem value="normal">Normal</MenuItem>
                  <MenuItem value="large">Large</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Palpation of Unerupted Max. Canines */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth>
                <InputLabel>Palpation of Unerupted Max. Canines</InputLabel>
                <Select
                  name="palpationUnruptedCanines"
                  value={formData.palpationUnruptedCanines}
                  onChange={handleChange}
                  label="Palpation of Unerupted Max. Canines"
                >
                  <MenuItem value="normal_position">Normal position</MenuItem>
                  <MenuItem value="not_palpable">Not palpable</MenuItem>
                  <MenuItem value="need_xray">Need X-ray evaluation</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Molar Relation Right */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth required error={fieldErrors.molarRelationRight}>
                <InputLabel>Molar Relation Right</InputLabel>
                <Select
                  name="molarRelationRight"
                  value={formData.molarRelationRight}
                  onChange={handleChange}
                  label="Molar Relation Right"
                >
                  <MenuItem value="C.I">C.I</MenuItem>
                  <MenuItem value="C.II(1/4 cusp)">C.II (1/4 cusp)</MenuItem>
                  <MenuItem value="C.II(1/2 cusp)">C.II (1/2 cusp)</MenuItem>
                  <MenuItem value="C.II(full cusp)">C.II (full cusp)</MenuItem>
                  <MenuItem value="C.III">C.III</MenuItem>
                  <MenuItem value="super C.III">Super C.III</MenuItem>
                  <MenuItem value="NA">NA</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Molar Relation Left */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth required error={fieldErrors.molarRelationLeft}>
                <InputLabel>Molar Relation Left</InputLabel>
                <Select
                  name="molarRelationLeft"
                  value={formData.molarRelationLeft}
                  onChange={handleChange}
                  label="Molar Relation Left"
                >
                  <MenuItem value="C.I">C.I</MenuItem>
                  <MenuItem value="C.II(1/4 cusp)">C.II (1/4 cusp)</MenuItem>
                  <MenuItem value="C.II(1/2 cusp)">C.II (1/2 cusp)</MenuItem>
                  <MenuItem value="C.II(full cusp)">C.II (full cusp)</MenuItem>
                  <MenuItem value="C.III">C.III</MenuItem>
                  <MenuItem value="super C.III">Super C.III</MenuItem>
                  <MenuItem value="NA">NA</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Overjet */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                required
                error={fieldErrors.overjet}
                label="Overjet"
                name="overjet"
                value={formData.overjet}
                onChange={handleChange}
                type="number"
                InputProps={{
                  endAdornment: <Typography variant="body2" sx={{ ml: 1 }}>mm</Typography>
                }}
                placeholder="Enter overjet in millimeters"
              />
            </Grid>

            {/* Overbite */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth required error={fieldErrors.overbite}>
                <InputLabel>Overbite</InputLabel>
                <Select
                  name="overbite"
                  value={formData.overbite}
                  onChange={handleChange}
                  label="Overbite"
                >
                  <MenuItem value="1/3">1/3</MenuItem>
                  <MenuItem value="2/3">2/3</MenuItem>
                  <MenuItem value="full_coverage">Full coverage lower incisors</MenuItem>
                  <MenuItem value="other">Other</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {formData.overbite === 'other' && (
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Specify Overbite"
                  name="overbiteOther"
                  value={formData.overbiteOther}
                  onChange={handleChange}
                  placeholder="Please specify the overbite..."
                />
              </Grid>
            )}

            {/* Crossbite */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth>
                <InputLabel>Crossbite</InputLabel>
                <Select
                  name="crossbite"
                  value={formData.crossbite}
                  onChange={handleChange}
                  label="Crossbite"
                >
                  <MenuItem value="bilateral">Bilateral crossbite</MenuItem>
                  <MenuItem value="unilateral">Unilateral crossbite</MenuItem>
                  <MenuItem value="other">Other</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {formData.crossbite === 'other' && (
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Specify Crossbite"
                  name="crossbiteOther"
                  value={formData.crossbiteOther}
                  onChange={handleChange}
                  placeholder="Please specify the crossbite..."
                />
              </Grid>
            )}

            {/* Space Condition */}
            <Grid size={{ xs: 12 }}>
              <FormControl fullWidth required error={fieldErrors.spaceCondition}>
                <FormLabel component="legend" sx={{ mb: 2, fontWeight: 600 }}>
                  Space Condition (Select all that apply)
                </FormLabel>
                <FormGroup row>
                  {[
                    'upper_spacing',
                    'lower_spacing',
                    'missing_teeth',
                    'slight_crowding_upper',
                    'slight_crowding_lower',
                    'moderate_crowding_upper',
                    'moderate_crowding_lower',
                    'severe_crowding_upper',
                    'severe_crowding_lower',
                    'other'
                  ].map((condition) => (
                    <FormControlLabel
                      key={condition}
                      control={
                        <Checkbox
                          checked={formData.spaceCondition?.includes(condition) || false}
                          onChange={() => handleMultiSelectChange('spaceCondition', condition)}
                          name={condition}
                        />
                      }
                      label={condition.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      sx={{ minWidth: { xs: '100%', sm: '50%', md: '33%' } }}
                    />
                  ))}
                </FormGroup>
              </FormControl>
            </Grid>

            {formData.spaceCondition?.includes('other') && (
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  label="Specify Other Space Condition"
                  name="spaceConditionOther"
                  value={formData.spaceConditionOther}
                  onChange={handleChange}
                  placeholder="Please specify the other space condition..."
                  multiline
                  rows={2}
                />
              </Grid>
            )}

            {/* Gingival Impingement */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth>
                <InputLabel>Gingival Impingement</InputLabel>
                <Select
                  name="gingivalImpingement"
                  value={formData.gingivalImpingement}
                  onChange={handleChange}
                  label="Gingival Impingement"
                >
                  <MenuItem value="yes">Yes</MenuItem>
                  <MenuItem value="no">No</MenuItem>
                </Select>
              </FormControl>
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
            Next: Photo Upload
          </Button>
        </Box>
      </Box>
  );

  // Reusable Upload Box Component
  const UploadBox = ({ imageType, title, aspectRatio, uploadedImage }) => {
    const inputRef = React.useRef(null);
    
    const handleClick = () => {
      inputRef.current?.click();
    };
    
    return (
      <Box sx={{ position: 'relative' }}>
        <input
          type="file"
          ref={inputRef}
          onChange={(e) => handleImageUpload(imageType, e)}
          accept="image/jpeg,image/jpg,image/png,image/webp"
          style={{ display: 'none' }}
        />
        
        <Box 
          onClick={handleClick}
          sx={{ 
            border: uploadedImage ? '2px solid' : '2px dashed', 
            borderColor: uploadedImage ? 'success.main' : 'divider', 
            borderRadius: 2, 
            p: uploadedImage ? 0 : 3, 
            textAlign: 'center',
            minHeight: { xs: 120, sm: 150 },
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            cursor: 'pointer',
            position: 'relative',
            overflow: 'hidden',
            '&:hover': { 
              borderColor: uploadedImage ? 'success.dark' : 'primary.main', 
              backgroundColor: uploadedImage ? 'transparent' : 'action.hover' 
            }
          }}
        >
          {uploadedImage ? (
            <>
              <img 
                src={uploadedImage.preview} 
                alt={title}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  minHeight: '150px'
                }}
              />
              <Box sx={{
                position: 'absolute',
                top: 8,
                right: 8,
                backgroundColor: 'rgba(0,0,0,0.7)',
                borderRadius: '50%',
                p: 0.5,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveImage(imageType);
                  }}
                  sx={{ color: 'white', p: 0.5 }}
                >
                  <Close fontSize="small" />
                </IconButton>
              </Box>
              <Box sx={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                backgroundColor: 'rgba(0,0,0,0.7)',
                color: 'white',
                p: 1,
                fontSize: '0.75rem'
              }}>
                {uploadedImage.name}
              </Box>
            </>
          ) : (
            <>
              <CloudUpload sx={{ fontSize: { xs: 30, sm: 40 }, color: 'text.secondary', mb: 1 }} />
              <Typography variant="body2" color="text.secondary" gutterBottom sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                {title}
              </Typography>
              <Typography variant="caption" color="text.disabled" sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' } }}>
                {aspectRatio}
              </Typography>
            </>
          )}
        </Box>
      </Box>
    );
  };

  // Photo Upload Step
  const renderPhotoUpload = () => (
      <Box>
        <Typography variant="h5" gutterBottom sx={{ mb: 3, textAlign: { xs: 'center', md: 'left' } }}>
          Upload Extra & Intra-oral Photos
        </Typography>
        
        <Paper sx={{ p: { xs: 2, md: 3 }, mb: 3, border: '1px solid', borderColor: 'divider' }}>
          {/* Extraoral Photos Section */}
          <Typography variant="h6" gutterBottom sx={{ mb: 3, color: 'primary.main' }}>
            Extraoral Photos
          </Typography>
          
          <Grid container spacing={{ xs: 2, sm: 3 }} sx={{ mb: 4 }}>
            {/* First row: Right, Frontal, Frontal Smiling */}
            <Grid size={{ xs: 12, sm: 4 }}>
              <UploadBox 
                imageType="extraoralRight"
                title="Extraoral Right View"
                aspectRatio="4:5 Portrait"
                uploadedImage={uploadedImages.extraoralRight}
              />
            </Grid>
            
            <Grid size={{ xs: 12, sm: 4 }}>
              <UploadBox 
                imageType="extraoralFrontal"
                title="Extraoral Frontal View"
                aspectRatio="4:5 Portrait"
                uploadedImage={uploadedImages.extraoralFrontal}
              />
            </Grid>
            
            <Grid size={{ xs: 12, sm: 4 }}>
              <UploadBox 
                imageType="extraoralFrontalSmiling"
                title="Extraoral Frontal Smiling View"
                aspectRatio="4:5 Portrait"
                uploadedImage={uploadedImages.extraoralFrontalSmiling}
              />
            </Grid>
            
            {/* Second row: Zoom Smile centered */}
            <Grid size={{ xs: 12 }} sx={{ display: 'flex', justifyContent: 'center' }}>
              <Box sx={{ width: { xs: '100%', sm: '50%', md: '33.33%' } }}>
                <UploadBox 
                  imageType="extraoralZoomSmile"
                  title="Extraoral Zoom View Smile"
                  aspectRatio="16:9 Landscape"
                  uploadedImage={uploadedImages.extraoralZoomSmile}
                />
              </Box>
            </Grid>
          </Grid>

          <Divider sx={{ my: 3 }} />

          {/* Intraoral Photos Section */}
          <Typography variant="h6" gutterBottom sx={{ mb: 3, color: 'primary.main' }}>
            Intraoral Photos
          </Typography>
          
          <Grid container spacing={{ xs: 2, sm: 3 }}>
            {/* First row: Right, Frontal, Left */}
            <Grid size={{ xs: 12, sm: 4 }}>
              <UploadBox 
                imageType="intraoralRight"
                title="Intraoral Right Side"
                aspectRatio="16:9 Landscape"
                uploadedImage={uploadedImages.intraoralRight}
              />
            </Grid>
            
            <Grid size={{ xs: 12, sm: 4 }}>
              <UploadBox 
                imageType="intraoralFrontal"
                title="Intraoral Frontal Side"
                aspectRatio="16:9 Landscape"
                uploadedImage={uploadedImages.intraoralFrontal}
              />
            </Grid>
            
            <Grid size={{ xs: 12, sm: 4 }}>
              <UploadBox 
                imageType="intraoralLeft"
                title="Intraoral Left Side"
                aspectRatio="16:9 Landscape"
                uploadedImage={uploadedImages.intraoralLeft}
              />
            </Grid>
            
            {/* Second row: Upper and Lower Occlusal centered */}
            <Grid size={{ xs: 12 }} sx={{ display: 'flex', justifyContent: 'center', gap: { xs: 2, sm: 3 }, flexWrap: 'wrap' }}>
              <Box sx={{ width: { xs: '100%', sm: '45%', md: '30%' } }}>
                <UploadBox 
                  imageType="upperOcclusal"
                  title="Upper Occlusal"
                  aspectRatio="Fit or Crop"
                  uploadedImage={uploadedImages.upperOcclusal}
                />
              </Box>
              
              <Box sx={{ width: { xs: '100%', sm: '45%', md: '30%' } }}>
                <UploadBox 
                  imageType="lowerOcclusal"
                  title="Lower Occlusal"
                  aspectRatio="Fit or Crop"
                  uploadedImage={uploadedImages.lowerOcclusal}
                />
              </Box>
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
  );

  // Submission Step
  const renderSubmission = () => (
      <Box component="form" onSubmit={handleSubmit}>
        <Typography variant="h5" gutterBottom sx={{ mb: 3, textAlign: { xs: 'center', md: 'left' } }}>
          Review and Submit
        </Typography>
        
        {/* Form Summary */}
        <Paper sx={{ p: { xs: 2, md: 3 }, mb: 3, border: '1px solid', borderColor: 'divider' }}>
          <Typography variant="h6" gutterBottom sx={{ mb: 3, color: 'primary.main' }}>
            Form Summary
          </Typography>
          
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>Specialty</Typography>
              <Chip label={selectedSpecialty} color="primary" variant="outlined" />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>Form Type</Typography>
              <Chip label={selectedFormType} color="secondary" variant="outlined" />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>Clinic</Typography>
              <Chip label={selectedClinic} color="success" variant="outlined" />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>Patient Name</Typography>
              <Typography variant="body1" fontWeight={600}>{formData.fullName || 'Not provided'}</Typography>
            </Grid>
          </Grid>
        </Paper>

        {/* Personal Information Summary */}
        <Paper sx={{ p: { xs: 2, md: 3 }, mb: 3, border: '1px solid', borderColor: 'divider' }}>
          <Typography variant="h6" gutterBottom sx={{ mb: 2, color: 'primary.main' }}>
            Personal Information
          </Typography>
          
          <Grid container spacing={2}>
            {formData.fullName && (
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>Full Name</Typography>
                <Typography variant="body1">{formData.fullName}</Typography>
              </Grid>
            )}
            {formData.fileNumber && (
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>File Number</Typography>
                <Typography variant="body1">{formData.fileNumber}</Typography>
              </Grid>
            )}
            {formData.dateOfBirth && (
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>Date of Birth</Typography>
                <Typography variant="body1">{formData.dateOfBirth}</Typography>
              </Grid>
            )}
            {formData.age && (
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>Age</Typography>
                <Typography variant="body1">{formData.age} years</Typography>
              </Grid>
            )}
            {formData.gender && (
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>Gender</Typography>
                <Typography variant="body1" sx={{ textTransform: 'capitalize' }}>{formData.gender}</Typography>
              </Grid>
            )}
            {formData.reasonForTreatment && (
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>Reason for Treatment</Typography>
                <Typography variant="body1">{formData.reasonForTreatment}</Typography>
              </Grid>
            )}
          </Grid>
        </Paper>

        {/* Medical & Dental History Summary */}
        <Paper sx={{ p: { xs: 2, md: 3 }, mb: 3, border: '1px solid', borderColor: 'divider' }}>
          <Typography variant="h6" gutterBottom sx={{ mb: 2, color: 'primary.main' }}>
            Medical & Dental History
          </Typography>
          
          <Grid container spacing={2}>
            {formData.medicalCondition && (
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>Medical Condition</Typography>
                <Typography variant="body1" sx={{ textTransform: 'capitalize' }}>{formData.medicalCondition}</Typography>
                {formData.medicalConditionOther && (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    Details: {formData.medicalConditionOther}
                  </Typography>
                )}
              </Grid>
            )}
            {formData.medication && (
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>Current Medication</Typography>
                <Typography variant="body1" sx={{ textTransform: 'capitalize' }}>{formData.medication}</Typography>
                {formData.medicationOther && (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    Details: {formData.medicationOther}
                  </Typography>
                )}
              </Grid>
            )}
            {formData.allergy && (
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>Allergies</Typography>
                <Typography variant="body1" sx={{ textTransform: 'capitalize' }}>{formData.allergy}</Typography>
                {formData.allergyOther && (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    Details: {formData.allergyOther}
                  </Typography>
                )}
              </Grid>
            )}
            {formData.dentalHistory && formData.dentalHistory.length > 0 && (
              <Grid size={{ xs: 12 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>Dental History</Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {formData.dentalHistory.map((item, index) => (
                    <Chip key={index} label={item} size="small" variant="outlined" />
                  ))}
                </Box>
                {formData.dentalHistoryOther && (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Other: {formData.dentalHistoryOther}
                  </Typography>
                )}
              </Grid>
            )}
            {formData.previousOrthodonticTreatment && (
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>Previous Orthodontic Treatment</Typography>
                <Typography variant="body1" sx={{ textTransform: 'capitalize' }}>{formData.previousOrthodonticTreatment}</Typography>
                {formData.previousOrthodonticTreatmentOther && (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    Details: {formData.previousOrthodonticTreatmentOther}
                  </Typography>
                )}
              </Grid>
            )}
          </Grid>
        </Paper>

        {/* Extra-oral Examination Summary */}
        <Paper sx={{ p: { xs: 2, md: 3 }, mb: 3, border: '1px solid', borderColor: 'divider' }}>
          <Typography variant="h6" gutterBottom sx={{ mb: 2, color: 'primary.main' }}>
            Extra-oral Examination
          </Typography>
          
          <Grid container spacing={2}>
            {formData.facialType && (
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>Facial Type</Typography>
                <Typography variant="body1" sx={{ textTransform: 'capitalize' }}>{formData.facialType}</Typography>
              </Grid>
            )}
            {formData.profileType && (
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>Profile Type</Typography>
                <Typography variant="body1" sx={{ textTransform: 'capitalize' }}>{formData.profileType}</Typography>
                {formData.profileTypeOther && (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    Details: {formData.profileTypeOther}
                  </Typography>
                )}
              </Grid>
            )}
            {formData.verticalFacialProportion && (
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>Vertical Facial Proportion</Typography>
                <Typography variant="body1" sx={{ textTransform: 'capitalize' }}>{formData.verticalFacialProportion}</Typography>
              </Grid>
            )}
            {formData.smileLine && (
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>Smile Line</Typography>
                <Typography variant="body1" sx={{ textTransform: 'capitalize' }}>{formData.smileLine}</Typography>
              </Grid>
            )}
            {formData.facialAsymmetry && (
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>Facial Asymmetry</Typography>
                <Typography variant="body1" sx={{ textTransform: 'capitalize' }}>{formData.facialAsymmetry}</Typography>
                {formData.facialAsymmetryOther && (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    Details: {formData.facialAsymmetryOther}
                  </Typography>
                )}
              </Grid>
            )}
          </Grid>
        </Paper>

        {/* Intra-oral Examination Summary */}
        <Paper sx={{ p: { xs: 2, md: 3 }, mb: 3, border: '1px solid', borderColor: 'divider' }}>
          <Typography variant="h6" gutterBottom sx={{ mb: 2, color: 'primary.main' }}>
            Intra-oral Examination
          </Typography>
          
          <Grid container spacing={2}>
            {formData.oralHygiene && (
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>Oral Hygiene</Typography>
                <Typography variant="body1" sx={{ textTransform: 'capitalize' }}>{formData.oralHygiene}</Typography>
              </Grid>
            )}
            {formData.molarRelationRight && (
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>Molar Relation (Right)</Typography>
                <Typography variant="body1" sx={{ textTransform: 'capitalize' }}>{formData.molarRelationRight}</Typography>
              </Grid>
            )}
            {formData.molarRelationLeft && (
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>Molar Relation (Left)</Typography>
                <Typography variant="body1" sx={{ textTransform: 'capitalize' }}>{formData.molarRelationLeft}</Typography>
              </Grid>
            )}
            {formData.overjet && (
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>Overjet</Typography>
                <Typography variant="body1">{formData.overjet} mm</Typography>
              </Grid>
            )}
            {formData.overbite && (
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>Overbite</Typography>
                <Typography variant="body1" sx={{ textTransform: 'capitalize' }}>{formData.overbite}</Typography>
                {formData.overbiteOther && (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    Details: {formData.overbiteOther}
                  </Typography>
                )}
              </Grid>
            )}
            {formData.crossbite && (
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>Crossbite</Typography>
                <Typography variant="body1" sx={{ textTransform: 'capitalize' }}>{formData.crossbite}</Typography>
                {formData.crossbiteOther && (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    Details: {formData.crossbiteOther}
                  </Typography>
                )}
              </Grid>
            )}
            {formData.spaceCondition && formData.spaceCondition.length > 0 && (
              <Grid size={{ xs: 12 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>Space Condition</Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {formData.spaceCondition.map((item, index) => (
                    <Chip key={index} label={item} size="small" variant="outlined" />
                  ))}
                </Box>
                {formData.spaceConditionOther && (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Other: {formData.spaceConditionOther}
                  </Typography>
                )}
              </Grid>
            )}
          </Grid>
        </Paper>

        {/* Uploaded Images Summary */}
        {Object.values(uploadedImages).some(img => img !== null) && (
          <Paper sx={{ p: { xs: 2, md: 3 }, mb: 3, border: '1px solid', borderColor: 'divider' }}>
            <Typography variant="h6" gutterBottom sx={{ mb: 2, color: 'primary.main' }}>
              Uploaded Images
            </Typography>
            
            <Grid container spacing={2}>
              {Object.entries(uploadedImages).map(([key, image]) => {
                if (!image) return null;
                
                const imageLabels = {
                  extraoralRight: 'Extra-oral Right',
                  extraoralFrontal: 'Extra-oral Frontal',
                  extraoralFrontalSmiling: 'Extra-oral Frontal Smiling',
                  extraoralZoomSmile: 'Extra-oral Zoom Smile',
                  intraoralRight: 'Intra-oral Right',
                  intraoralFrontal: 'Intra-oral Frontal',
                  intraoralLeft: 'Intra-oral Left',
                  upperOcclusal: 'Upper Occlusal',
                  lowerOcclusal: 'Lower Occlusal'
                };
                
                return (
                  <Grid size={{ xs: 12, sm: 6, md: 4 }} key={key}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        {imageLabels[key]}
                      </Typography>
                      <Box
                        component="img"
                        src={image.preview}
                        alt={imageLabels[key]}
                        sx={{
                          width: '100%',
                          maxWidth: 150,
                          height: 100,
                          objectFit: 'cover',
                          borderRadius: 1,
                          border: '1px solid',
                          borderColor: 'divider'
                        }}
                      />
                    </Box>
                  </Grid>
                );
              })}
            </Grid>
          </Paper>
        )}

        {/* Additional Notes */}
        {formData.examinationNotes && (
          <Paper sx={{ p: { xs: 2, md: 3 }, mb: 3, border: '1px solid', borderColor: 'divider' }}>
            <Typography variant="h6" gutterBottom sx={{ mb: 2, color: 'primary.main' }}>
              Additional Notes
            </Typography>
            <Typography variant="body1">{formData.examinationNotes}</Typography>
          </Paper>
        )}

        {/* Error and Success Messages */}
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

        <Paper sx={{ p: { xs: 2, md: 3 }, mb: 3, border: '1px solid', borderColor: 'divider', backgroundColor: 'grey.50' }}>
          <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
            Please review all the information above carefully. Once submitted, this orthodontic examination will be processed and added to the patient records.
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
            {loading ? 'Submitting Examination...' : 'Submit Orthodontic Examination'}
          </Button>
        </Box>
      </Box>
  );

  const mainSteps = ['Select Specialty', 'Select Form Type'];
  const formSteps = ['Personal Information', 'Medical & Dental History', 'Extra-oral Examination', 'Intra-oral Examination', 'Photo Upload', 'Review & Submit'];

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
              <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
                {error}
              </Alert>
            )}

            {success && (
              <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }}>
                {success}
              </Alert>
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
                  {currentFormStep === 3 && renderIntraOralExamination()}
                  {currentFormStep === 4 && renderPhotoUpload()}
                  {currentFormStep === 5 && renderSubmission()}
                </>
              )}
            </Box>
          </Paper>

          {/* Saved Drafts Section - Only show on specialty selection step */}
          {drafts.length > 0 && currentMainStep === 0 && !showFormSteps && (
            <Paper 
              elevation={isMobile ? 1 : 2} 
              sx={{ 
                mt: 3,
                p: { xs: 2, sm: 3, md: 4 },
                borderRadius: { xs: 2, md: 3 },
                background: theme.palette.mode === 'dark' 
                  ? 'linear-gradient(145deg, #2a2a2a 0%, #3a3a3a 100%)'
                  : 'linear-gradient(145deg, #f8f9fa 0%, #e9ecef 100%)',
                boxShadow: theme.palette.mode === 'dark'
                  ? '0 4px 16px rgba(0,0,0,0.2)'
                  : '0 4px 16px rgba(0,0,0,0.08)',
                border: '1px solid',
                borderColor: theme.palette.mode === 'dark' ? 'grey.700' : 'grey.200'
              }}
            >
              {/* Auto-save status */}
              {lastSaved && (
                <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }}>
                  <Typography variant="body2">
                    <strong>Draft saved:</strong> {lastSaved}
                  </Typography>
                  {currentDraftId && (
                    <Typography variant="caption" sx={{ display: 'block', mt: 0.5, opacity: 0.8 }}>
                      Draft ID: {currentDraftId.slice(-8)} • Step: {getStepName(currentMainStep, currentFormStep)}
                    </Typography>
                  )}
                </Alert>
              )}

              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <SaveIcon color="primary" />
                  Saved Drafts ({drafts.length})
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => saveDraft(true)}
                    startIcon={<SaveIcon />}
                    disabled={!Object.values(formData).some(value => {
                      if (Array.isArray(value)) return value.length > 0;
                      return value !== '';
                    }) && !Object.values(uploadedImages).some(image => image !== null) && currentFormStep === 0}
                    sx={{ borderRadius: 2 }}
                  >
                    Save Now
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={startNewForm}
                    startIcon={<Add />}
                    sx={{ borderRadius: 2 }}
                  >
                    Start New
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => {
                      loadDrafts(); // This will clean up duplicates
                    }}
                    startIcon={<SaveIcon />}
                    sx={{ borderRadius: 2 }}
                  >
                    Clean Duplicates
                  </Button>
                  <Button
                    size="small"
                    color="error"
                    onClick={clearAllDrafts}
                    startIcon={<DeleteIcon />}
                    sx={{ borderRadius: 2 }}
                  >
                    Clear All
                  </Button>
                </Box>
              </Box>
              
              <Grid container spacing={2}>
                {drafts.map((draft) => (
                  <Grid size={{ xs: 12, sm: 6, md: 4 }} key={draft.id}>
                    <Card 
                      sx={{ 
                        cursor: 'pointer',
                        border: currentDraftId === draft.id ? 2 : 1,
                        borderColor: currentDraftId === draft.id ? 'primary.main' : 'divider',
                        backgroundColor: currentDraftId === draft.id ? 'primary.50' : 'background.paper',
                        '&:hover': {
                          boxShadow: 2,
                          borderColor: 'primary.main'
                        },
                        transition: 'all 0.2s ease-in-out',
                        borderRadius: 2
                      }}
                      onClick={() => loadDraft(draft)}
                    >
                      <CardContent sx={{ p: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 600, flex: 1 }}>
                            {getDraftTitle(draft)}
                          </Typography>
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteDraft(draft.id);
                            }}
                            sx={{ ml: 1, p: 0.5 }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Box>
                        
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          Step: {getStepName(draft.currentMainStep, draft.currentFormStep)}
                        </Typography>
                        
                        {draft.progress && (
                          <Box sx={{ mb: 1 }}>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                              Progress: {draft.progress.completedFields}/{draft.progress.totalFields} fields
                            </Typography>
                            {draft.progress.hasImages && (
                              <Typography variant="caption" color="primary.main" sx={{ display: 'block' }}>
                                📷 Has images
                              </Typography>
                            )}
                          </Box>
                        )}
                        
                        <Typography variant="caption" color="text.secondary">
                          Saved: {new Date(draft.timestamp).toLocaleDateString()} {new Date(draft.timestamp).toLocaleTimeString()}
                        </Typography>
                        
                        {currentDraftId === draft.id && (
                          <Chip
                            label="Current"
                            size="small"
                            color="primary"
                            sx={{ mt: 1 }}
                          />
                        )}
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Paper>
          )}
      </Container>

      {/* Add Clinic Dialog */}
      <Dialog 
        open={clinicDialogOpen} 
        onClose={handleCloseClinicDialog}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: theme.palette.mode === 'dark'
              ? '0 12px 40px rgba(0,0,0,0.5)'
              : '0 12px 40px rgba(0,0,0,0.15)',
          }
        }}
      >
        <DialogTitle sx={{ 
          pb: 1,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          fontWeight: 600,
        }}>
          <LocalHospital color="primary" />
          Add New Clinic
        </DialogTitle>
        
        <DialogContent sx={{ pt: 2 }}>
          {clinicError && (
            <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
              {clinicError}
            </Alert>
          )}
          
          {clinicSuccess && (
            <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }}>
              {clinicSuccess}
            </Alert>
          )}
          
          <TextField
            autoFocus
            fullWidth
            label="Clinic/Practice Name"
            value={newClinicName}
            onChange={(e) => setNewClinicName(e.target.value)}
            placeholder="e.g., Downtown Dental Clinic"
            variant="outlined"
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
              },
            }}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleAddClinic();
              }
            }}
          />
          
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            This clinic will be added to your profile and available for future cases.
          </Typography>
        </DialogContent>
        
        <DialogActions sx={{ p: 3, pt: 1 }}>
          <Button 
            onClick={handleCloseClinicDialog}
            variant="outlined"
            sx={{ borderRadius: 2 }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleAddClinic}
            variant="contained"
            disabled={!newClinicName.trim() || !!clinicSuccess}
            sx={{ 
              borderRadius: 2,
              minWidth: 100,
            }}
          >
            {clinicSuccess ? 'Added!' : 'Add Clinic'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default NewCase;