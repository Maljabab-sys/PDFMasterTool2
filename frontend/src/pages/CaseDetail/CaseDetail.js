import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  Grid,
  Chip,
  Button,
  Card,
  CardMedia,
  CardContent,
  Alert,
  Divider
} from '@mui/material';
import { ArrowBack, Edit } from '@mui/icons-material';
import api from '../../services/api';

const CaseDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [caseData, setCaseData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchCaseDetail();
  }, [id]);

  const fetchCaseDetail = async () => {
    try {
      const response = await api.get(`/api/cases/${id}`);
      setCaseData(response.data);
    } catch (error) {
      setError('Failed to fetch case details');
    } finally {
      setLoading(false);
    }
  };

  const getUrgencyColor = (urgency) => {
    switch (urgency?.toLowerCase()) {
      case 'emergency':
        return 'error';
      case 'high':
        return 'warning';
      case 'normal':
        return 'primary';
      case 'low':
        return 'success';
      default:
        return 'default';
    }
  };

  if (loading) {
    return (
      <Container>
        <Typography>Loading case details...</Typography>
      </Container>
    );
  }

  if (error || !caseData) {
    return (
      <Container>
        <Alert severity="error">{error || 'Case not found'}</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl">
      <Box sx={{ mt: 4, mb: 4 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <Button
            startIcon={<ArrowBack />}
            onClick={() => navigate('/dashboard')}
            sx={{ mr: 2 }}
          >
            Back to Dashboard
          </Button>
          <Typography variant="h4" component="h1" sx={{ flexGrow: 1 }}>
            Case Details
          </Typography>
          <Button
            variant="contained"
            startIcon={<Edit />}
            onClick={() => navigate(`/cases/${id}/edit`)}
          >
            Edit Case
          </Button>
        </Box>

        <Grid container spacing={3}>
          {/* Case Information */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Case Information
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Case ID
                </Typography>
                <Typography variant="body1">
                  {caseData.id}
                </Typography>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Patient Name
                </Typography>
                <Typography variant="body1">
                  {caseData.patient_name || 'Unknown Patient'}
                </Typography>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Patient Age
                </Typography>
                <Typography variant="body1">
                  {caseData.patient_age || 'N/A'}
                </Typography>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Urgency Level
                </Typography>
                <Chip
                  label={caseData.urgency || 'Normal'}
                  color={getUrgencyColor(caseData.urgency)}
                  size="small"
                />
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Created Date
                </Typography>
                <Typography variant="body1">
                  {caseData.created_at 
                    ? new Date(caseData.created_at).toLocaleDateString()
                    : 'N/A'
                  }
                </Typography>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Status
                </Typography>
                <Chip
                  label={caseData.status || 'Active'}
                  color={caseData.status === 'Completed' ? 'success' : 'primary'}
                  size="small"
                />
              </Box>
            </Paper>
          </Grid>

          {/* Case Description */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Case Description
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Typography variant="body1">
                {caseData.description || caseData.case_description || 'No description provided.'}
              </Typography>
            </Paper>
          </Grid>

          {/* Images and Classifications */}
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Images and AI Classifications
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              {caseData.images && caseData.images.length > 0 ? (
                <Grid container spacing={3}>
                  {caseData.images.map((image, index) => (
                    <Grid item xs={12} sm={6} md={4} key={index}>
                      <Card>
                        <CardMedia
                          component="img"
                          height="200"
                          image={image.url || image.path}
                          alt={`Case image ${index + 1}`}
                          sx={{ objectFit: 'cover' }}
                        />
                        <CardContent>
                          <Typography variant="subtitle2" gutterBottom>
                            {image.filename || `Image ${index + 1}`}
                          </Typography>
                          {image.classification && (
                            <Box>
                              <Typography variant="body2" color="text.secondary">
                                AI Classification: <strong>{image.classification}</strong>
                              </Typography>
                              {image.confidence && (
                                <Typography variant="body2" color="text.secondary">
                                  Confidence: {(image.confidence * 100).toFixed(1)}%
                                </Typography>
                              )}
                            </Box>
                          )}
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              ) : (
                <Typography variant="body1" color="text.secondary">
                  No images available for this case.
                </Typography>
              )}
            </Paper>
          </Grid>

          {/* Additional Notes */}
          {caseData.notes && (
            <Grid item xs={12}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Additional Notes
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Typography variant="body1">
                  {caseData.notes}
                </Typography>
              </Paper>
            </Grid>
          )}
        </Grid>
      </Box>
    </Container>
  );
};

export default CaseDetail; 