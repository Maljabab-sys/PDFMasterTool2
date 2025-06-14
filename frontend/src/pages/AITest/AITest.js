import React, { useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  Alert,
  Grid,
  Card,
  CardContent,
  CardMedia,
  LinearProgress,
  Chip
} from '@mui/material';
import { CloudUpload, Psychology } from '@mui/icons-material';
import { useAI } from '../../contexts/AIContext';
import { aiService } from '../../services/aiService';
import { useSidebar } from '../../contexts/SidebarContext';
import { useTheme } from '@mui/material/styles';

const AITest = () => {
  const { modelStatus } = useAI();
  const { collapsed } = useSidebar();
  const theme = useTheme();
  const [selectedFile, setSelectedFile] = useState(null);
  const [classification, setClassification] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [imagePreview, setImagePreview] = useState(null);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setClassification(null);
      setError('');
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleClassify = async () => {
    if (!selectedFile) {
      setError('Please select an image first');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('image', selectedFile);

      const result = await aiService.testClassification(formData);
      setClassification(result);
    } catch (error) {
      setError(error.response?.data?.message || 'Classification failed');
    } finally {
      setLoading(false);
    }
  };

  const getConfidenceColor = (confidence) => {
    if (confidence >= 0.8) return 'success';
    if (confidence >= 0.6) return 'warning';
    return 'error';
  };

  return (
    <Box sx={{ 
      width: '100%', 
      m: 0,
      transition: theme.transitions.create(['margin-left'], {
        easing: theme.transitions.easing.easeInOut,
        duration: theme.transitions.duration.standard,
      }),
      width: 'calc(100% - 64px)', // Keep consistent width - don't narrow
      marginLeft: '32px', // Keep consistent spacing in both states
      position: 'relative',
    }}>
      
      <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          AI Classification Test
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Upload a dental image to test the AI classification model
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Model Status */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Model Status
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary">
                Status: <Chip 
                  label={modelStatus?.status || 'Unknown'} 
                  color={modelStatus?.status === 'ready' ? 'success' : 'warning'}
                  size="small"
                />
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary">
                Model Type: {modelStatus?.model_type || 'N/A'}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary">
                Accuracy: {modelStatus?.accuracy ? `${(modelStatus.accuracy * 100).toFixed(1)}%` : 'N/A'}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary">
                Training Data: {modelStatus?.training_samples || 'N/A'} samples
              </Typography>
            </Grid>
          </Grid>
        </Paper>

        <Grid container spacing={3}>
          {/* Upload Section */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Upload Image
              </Typography>
              
              <Button
                variant="outlined"
                component="label"
                startIcon={<CloudUpload />}
                fullWidth
                sx={{ p: 3, mb: 2 }}
              >
                Select Dental Image
                <input
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={handleFileSelect}
                />
              </Button>

              {selectedFile && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Selected: {selectedFile.name}
                  </Typography>
                </Box>
              )}

              {imagePreview && (
                <Box sx={{ mb: 2 }}>
                  <img
                    src={imagePreview}
                    alt="Preview"
                    style={{
                      width: '100%',
                      maxHeight: '300px',
                      objectFit: 'contain',
                      border: '1px solid #ddd',
                      borderRadius: '4px'
                    }}
                  />
                </Box>
              )}

              <Button
                variant="contained"
                onClick={handleClassify}
                disabled={!selectedFile || loading}
                startIcon={<Psychology />}
                fullWidth
                size="large"
              >
                {loading ? 'Classifying...' : 'Classify Image'}
              </Button>

              {loading && (
                <Box sx={{ mt: 2 }}>
                  <LinearProgress />
                </Box>
              )}
            </Paper>
          </Grid>

          {/* Results Section */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Classification Results
              </Typography>

              {classification ? (
                <Card>
                  <CardContent>
                    <Typography variant="h5" component="div" gutterBottom>
                      {classification.classification}
                    </Typography>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>
                        Confidence:
                      </Typography>
                      <Chip
                        label={`${(classification.confidence * 100).toFixed(1)}%`}
                        color={getConfidenceColor(classification.confidence)}
                        size="small"
                      />
                    </Box>

                    <LinearProgress
                      variant="determinate"
                      value={classification.confidence * 100}
                      color={getConfidenceColor(classification.confidence)}
                      sx={{ mb: 2 }}
                    />

                    {classification.processing_time && (
                      <Typography variant="body2" color="text.secondary">
                        Processing Time: {classification.processing_time.toFixed(2)}s
                      </Typography>
                    )}

                    {classification.details && (
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="subtitle2" gutterBottom>
                          Additional Details:
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {classification.details}
                        </Typography>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Psychology sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="body1" color="text.secondary">
                    Upload an image and click "Classify Image" to see AI results
                  </Typography>
                </Box>
              )}
            </Paper>
          </Grid>
        </Grid>

        {/* Available Classifications */}
        <Paper sx={{ p: 3, mt: 3 }}>
          <Typography variant="h6" gutterBottom>
            Available Classifications
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            The AI model can classify the following types of dental conditions:
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {[
              'Healthy',
              'Cavity',
              'Gingivitis',
              'Tartar',
              'Crown',
              'Bridge',
              'Implant',
              'Orthodontics'
            ].map((type) => (
              <Chip key={type} label={type} variant="outlined" size="small" />
            ))}
          </Box>
        </Paper>
      </Box>
    </Container>
    </Box>
  );
};

export default AITest; 