import React, { useState } from 'react';
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
  Stack
} from '@mui/material';
import { CloudUpload } from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { aiService } from '../../services/aiService';

const NewCase = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    patientName: '',
    patientAge: '',
    caseDescription: '',
    urgency: 'normal'
  });
  const [files, setFiles] = useState([]);
  const [classifications, setClassifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    setFiles(selectedFiles);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      // Create FormData for file upload
      const uploadData = new FormData();
      uploadData.append('patient_name', formData.patientName);
      uploadData.append('patient_age', formData.patientAge);
      uploadData.append('case_description', formData.caseDescription);
      uploadData.append('urgency', formData.urgency);
      
      files.forEach(file => {
        uploadData.append('files', file);
      });

      const result = await aiService.bulkClassify(uploadData);
      setClassifications(result.classifications || []);
      setSuccess('Case created successfully with AI classifications!');
      
      // Reset form
      setFormData({
        patientName: '',
        patientAge: '',
        caseDescription: '',
        urgency: 'normal'
      });
      setFiles([]);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to create case');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="lg">
      <Paper elevation={3} sx={{ p: 4, mt: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Create New Case
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                required
                fullWidth
                label="Patient Name"
                name="patientName"
                value={formData.patientName}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                required
                fullWidth
                label="Patient Age"
                name="patientAge"
                type="number"
                value={formData.patientAge}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                multiline
                rows={4}
                label="Case Description"
                name="caseDescription"
                value={formData.caseDescription}
                onChange={handleChange}
                placeholder="Describe the dental case, symptoms, and any relevant medical history..."
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Urgency Level</InputLabel>
                <Select
                  name="urgency"
                  value={formData.urgency}
                  onChange={handleChange}
                  label="Urgency Level"
                >
                  <MenuItem value="low">Low</MenuItem>
                  <MenuItem value="normal">Normal</MenuItem>
                  <MenuItem value="high">High</MenuItem>
                  <MenuItem value="emergency">Emergency</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <Button
                variant="outlined"
                component="label"
                startIcon={<CloudUpload />}
                fullWidth
                sx={{ p: 2, mb: 2 }}
              >
                Upload Dental Images
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  hidden
                  onChange={handleFileChange}
                />
              </Button>
              {files.length > 0 && (
                <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
                  {files.map((file, index) => (
                    <Chip key={index} label={file.name} variant="outlined" />
                  ))}
                </Stack>
              )}
            </Grid>
            <Grid item xs={12}>
              <Button
                type="submit"
                variant="contained"
                size="large"
                disabled={loading || files.length === 0}
                fullWidth
              >
                {loading ? 'Creating Case...' : 'Create Case & Classify Images'}
              </Button>
            </Grid>
          </Grid>
        </Box>

        {classifications.length > 0 && (
          <Box sx={{ mt: 4 }}>
            <Typography variant="h6" gutterBottom>
              AI Classifications
            </Typography>
            <Grid container spacing={2}>
              {classifications.map((classification, index) => (
                <Grid item xs={12} md={6} key={index}>
                  <Paper sx={{ p: 2 }} variant="outlined">
                    <Typography variant="subtitle1" gutterBottom>
                      {classification.filename}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Classification: <strong>{classification.classification}</strong>
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Confidence: {(classification.confidence * 100).toFixed(1)}%
                    </Typography>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}
      </Paper>
    </Container>
  );
};

export default NewCase; 