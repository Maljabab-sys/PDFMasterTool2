import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Avatar,
  LinearProgress,
  Chip,
  IconButton,
  useTheme,
  useMediaQuery,
  Fade,
  Slide,
  Zoom,
  Grow,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import {
  TrendingUp as TrendingUpIcon,
  People as PeopleIcon,
  Assignment as AssignmentIcon,
  Psychology as PsychologyIcon,
  ArrowForward as ArrowForwardIcon,
  Visibility as VisibilityIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CheckCircleIcon,
  Add as AddIcon,
  CalendarToday as CalendarIcon,
  LocalHospital as ClinicIcon,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { useAI } from '../../contexts/AIContext';
import { useCustomTheme } from '../../App';
import { useLanguage } from '../../contexts/LanguageContext';

// Styled Components without gradients
const StatCard = styled(Card)(({ theme }) => ({
  borderRadius: 16,
  border: `1px solid ${theme.palette.divider}`,
  boxShadow: theme.palette.mode === 'dark' 
    ? '0px 4px 20px rgba(0,0,0,0.3)'
    : '0px 4px 20px rgba(0,0,0,0.08)',
  transition: 'all 0.3s cubic-bezier(0.4, 0.0, 0.2, 1)',
  cursor: 'pointer',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: theme.palette.mode === 'dark' 
      ? '0px 8px 30px rgba(0,0,0,0.4)'
      : '0px 8px 30px rgba(0,0,0,0.12)',
  },
}));

const StatIcon = styled(Avatar)(({ theme, bgcolor }) => ({
  width: 56,
  height: 56,
  backgroundColor: bgcolor || theme.palette.primary.main,
  boxShadow: `0px 4px 12px ${bgcolor || theme.palette.primary.main}40`,
  transition: 'all 0.3s cubic-bezier(0.4, 0.0, 0.2, 1)',
  '&:hover': {
    transform: 'scale(1.1)',
    boxShadow: `0px 6px 16px ${bgcolor || theme.palette.primary.main}60`,
  },
}));

const NewCaseCard = styled(Card)(({ theme }) => ({
  borderRadius: 16,
  border: `2px dashed ${theme.palette.primary.main}`,
  backgroundColor: theme.palette.mode === 'dark' 
    ? 'rgba(102, 126, 234, 0.05)'
    : 'rgba(102, 126, 234, 0.02)',
  transition: 'all 0.3s cubic-bezier(0.4, 0.0, 0.2, 1)',
  cursor: 'pointer',
  minHeight: 200,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  '&:hover': {
    transform: 'translateY(-4px)',
    backgroundColor: theme.palette.mode === 'dark' 
      ? 'rgba(102, 126, 234, 0.1)'
      : 'rgba(102, 126, 234, 0.05)',
    borderColor: theme.palette.primary.dark,
  },
}));

const SectionCard = styled(Card)(({ theme }) => ({
  borderRadius: 16,
  border: `1px solid ${theme.palette.divider}`,
  boxShadow: theme.palette.mode === 'dark' 
    ? '0px 4px 20px rgba(0,0,0,0.3)'
    : '0px 4px 20px rgba(0,0,0,0.08)',
  transition: 'all 0.3s cubic-bezier(0.4, 0.0, 0.2, 1)',
}));

const Dashboard = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { user } = useAuth();
  const { t, isRTL } = useLanguage();
  const [animationTrigger, setAnimationTrigger] = useState(false);
  const [dashboardData, setDashboardData] = useState({
    totalPatients: 45,
    totalCases: 127,
    thisMonth: 32,
    activePatients: 38,
    recentCases: []
  });

  useEffect(() => {
    setAnimationTrigger(true);
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch dashboard data from API
      const response = await fetch('/api/dashboard-stats');
      if (response.ok) {
        const data = await response.json();
        setDashboardData(data);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  };

  const visitTypeData = [
    { type: t('consultation'), count: 45, color: '#667eea' },
    { type: t('cleaning'), count: 32, color: '#764ba2' },
    { type: t('treatment'), count: 28, color: '#4facfe' },
    { type: t('emergency'), count: 22, color: '#fa709a' },
  ];

  const clinicData = [
    { clinic: t('mainClinic'), count: 78, color: '#667eea' },
    { clinic: t('branchA'), count: 32, color: '#764ba2' },
    { clinic: t('branchB'), count: 17, color: '#4facfe' },
  ];

  const recentCases = [
    { id: 1, patient: 'John Doe', action: t('newCaseCreated'), date: '2025-06-12', status: t('completed') },
    { id: 2, patient: 'Jane Smith', action: t('newCaseCreated'), date: '2025-06-11', status: t('completed') },
    { id: 3, patient: 'Mike Johnson', action: t('newCaseCreated'), date: '2025-06-10', status: t('completed') },
  ];

  return (
    <Box sx={{ width: '100%', m: 0 }}>
      {/* Welcome Section with New Case Button */}
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          mb: 4,
          flexWrap: 'wrap',
          gap: 2
        }}
      >
        <Box sx={{ textAlign: { xs: 'center', md: 'left' }, flex: 1 }}>
          <Fade in={animationTrigger} timeout={800}>
            <Typography 
              variant="h3" 
              component="h1" 
              gutterBottom
              sx={{ 
                fontWeight: 700,
                color: theme.palette.text.primary,
                mb: 1
              }}
            >
              Welcome back, mhanna!
            </Typography>
          </Fade>
          <Fade in={animationTrigger} timeout={1000}>
            <Typography 
              variant="h6" 
              color="text.secondary"
            >
              {t('practiceToday')}
            </Typography>
          </Fade>
        </Box>
        
        <Box sx={{ display: 'flex', justifyContent: { xs: 'center', md: 'flex-end' } }}>
          <Fade in={animationTrigger} timeout={1200}>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => navigate('/new-case')}
              sx={{
                borderRadius: 3,
                textTransform: 'none',
                fontWeight: 600,
                px: 3,
                py: 1.5,
                fontSize: '1rem',
                boxShadow: theme.palette.mode === 'dark' 
                  ? '0px 4px 20px rgba(102, 126, 234, 0.3)'
                  : '0px 4px 20px rgba(102, 126, 234, 0.2)',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: theme.palette.mode === 'dark' 
                    ? '0px 6px 25px rgba(102, 126, 234, 0.4)'
                    : '0px 6px 25px rgba(102, 126, 234, 0.3)',
                },
              }}
            >
              New Case
            </Button>
          </Fade>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Statistics Row - 4 Equal Columns */}
        {/* Total Cases */}
        <Grid item xs={12} sm={6} md={3}>
              <Slide in={animationTrigger} direction="up" timeout={600}>
                <StatCard>
                  <CardContent sx={{ textAlign: 'center', py: 3 }}>
                    <StatIcon bgcolor="#667eea" sx={{ mx: 'auto', mb: 2 }}>
                      <AssignmentIcon />
                    </StatIcon>
                    <Typography variant="h4" component="div" gutterBottom fontWeight="bold">
                      {dashboardData.totalCases}
                    </Typography>
                    <Typography color="text.secondary" variant="body2">
                      {t('totalCases')}
                    </Typography>
                  </CardContent>
                </StatCard>
              </Slide>
            </Grid>

            {/* Total Patients */}
            <Grid item xs={12} sm={6} md={3}>
              <Slide in={animationTrigger} direction="up" timeout={800}>
                <StatCard>
                  <CardContent sx={{ textAlign: 'center', py: 3 }}>
                    <StatIcon bgcolor="#764ba2" sx={{ mx: 'auto', mb: 2 }}>
                      <PeopleIcon />
                    </StatIcon>
                    <Typography variant="h4" component="div" gutterBottom fontWeight="bold">
                      {dashboardData.totalPatients}
                    </Typography>
                    <Typography color="text.secondary" variant="body2">
                      {t('totalPatients')}
                    </Typography>
                  </CardContent>
                </StatCard>
              </Slide>
            </Grid>

            {/* This Month */}
            <Grid item xs={12} sm={6} md={3}>
              <Slide in={animationTrigger} direction="up" timeout={1000}>
                <StatCard>
                  <CardContent sx={{ textAlign: 'center', py: 3 }}>
                    <StatIcon bgcolor="#4facfe" sx={{ mx: 'auto', mb: 2 }}>
                      <CalendarIcon />
                    </StatIcon>
                    <Typography variant="h4" component="div" gutterBottom fontWeight="bold">
                      {dashboardData.thisMonth}
                    </Typography>
                    <Typography color="text.secondary" variant="body2">
                      {t('thisMonth')}
                    </Typography>
                  </CardContent>
                </StatCard>
              </Slide>
            </Grid>

            {/* Active Patients */}
            <Grid item xs={12} sm={6} md={3}>
              <Slide in={animationTrigger} direction="up" timeout={1200}>
                <StatCard>
                  <CardContent sx={{ textAlign: 'center', py: 3 }}>
                    <StatIcon bgcolor="#fa709a" sx={{ mx: 'auto', mb: 2 }}>
                      <TrendingUpIcon />
                    </StatIcon>
                    <Typography variant="h4" component="div" gutterBottom fontWeight="bold">
                      {dashboardData.activePatients}
                    </Typography>
                    <Typography color="text.secondary" variant="body2">
                      {t('activePatients')}
                    </Typography>
                  </CardContent>
                </StatCard>
              </Slide>
            </Grid>

                {/* Second Row - Charts */}
        {/* Cases by Visit Type */}
        <Grid item xs={12} md={6}>
          <Fade in={animationTrigger} timeout={1400}>
            <SectionCard>
              <CardContent>
                <Typography variant="h6" gutterBottom fontWeight="600" textAlign="center">
                  {t('casesByVisitType')}
                </Typography>
                <Box sx={{ mt: 3 }}>
                  {visitTypeData.map((item, index) => (
                    <Box key={index} sx={{ mb: 2 }}>
                      <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                        <Typography variant="body2">{item.type}</Typography>
                        <Typography variant="body2" fontWeight="bold">{item.count}</Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={(item.count / 127) * 100}
                        sx={{
                          height: 8,
                          borderRadius: 4,
                          backgroundColor: theme.palette.grey[200],
                          '& .MuiLinearProgress-bar': {
                            backgroundColor: item.color,
                            borderRadius: 4,
                          },
                        }}
                      />
                    </Box>
                  ))}
                </Box>
              </CardContent>
            </SectionCard>
          </Fade>
        </Grid>

        {/* Clinic Distribution */}
        <Grid item xs={12} md={6}>
          <Fade in={animationTrigger} timeout={1600}>
            <SectionCard>
              <CardContent>
                <Typography variant="h6" gutterBottom fontWeight="600" textAlign="center">
                  {t('clinicDistribution')}
                </Typography>
                <Box sx={{ mt: 3 }}>
                  {clinicData.map((item, index) => (
                    <Box key={index} sx={{ mb: 2 }}>
                      <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                        <Typography variant="body2">{item.clinic}</Typography>
                        <Typography variant="body2" fontWeight="bold">{item.count}</Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={(item.count / 127) * 100}
                        sx={{
                          height: 8,
                          borderRadius: 4,
                          backgroundColor: theme.palette.grey[200],
                          '& .MuiLinearProgress-bar': {
                            backgroundColor: item.color,
                            borderRadius: 4,
                          },
                        }}
                      />
                    </Box>
                  ))}
                </Box>
              </CardContent>
            </SectionCard>
          </Fade>
        </Grid>

        {/* Recent Cases */}
        <Grid item xs={12}>
          <Fade in={animationTrigger} timeout={2000}>
            <SectionCard>
              <CardContent>
                <Typography variant="h6" gutterBottom fontWeight="600" textAlign="center" sx={{ mb: 3 }}>
                  {t('recentCases')}
                </Typography>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 600 }}>{t('patient')}</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>{t('action')}</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>{t('date')}</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>{t('status')}</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>{t('actions')}</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {recentCases.map((case_item, index) => (
                        <TableRow key={case_item.id} hover>
                          <TableCell>{case_item.patient}</TableCell>
                          <TableCell>{case_item.action}</TableCell>
                          <TableCell>{case_item.date}</TableCell>
                          <TableCell>
                            <Chip
                              label={case_item.status}
                              color="success"
                              size="small"
                              sx={{ borderRadius: 2 }}
                            />
                          </TableCell>
                          <TableCell>
                            <IconButton size="small" color="primary">
                              <VisibilityIcon />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </SectionCard>
          </Fade>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard; 