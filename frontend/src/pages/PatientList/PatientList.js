import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  TextField,
  Box,
  Alert,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import { 
  Add, 
  Search, 
  Visibility, 
  Edit, 
  Delete 
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';

const PatientList = () => {
  const { user } = useAuth();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      const response = await api.get('/api/patients');
      setPatients(response.data.patients || []);
    } catch (error) {
      setError('Failed to fetch patients');
      console.error('Error fetching patients:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredPatients = patients.filter(patient =>
    patient.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleViewPatient = (patient) => {
    setSelectedPatient(patient);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedPatient(null);
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
        <Typography>Loading patients...</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Patient Management
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Search and Actions */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
          <TextField
            placeholder="Search patients..."
            variant="outlined"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: <Search sx={{ color: 'action.active', mr: 1 }} />
            }}
            sx={{ minWidth: 300 }}
          />
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => {/* Add new patient logic */}}
          >
            Add New Patient
          </Button>
        </Box>

        {/* Patients Table */}
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Patient Name</TableCell>
                <TableCell>Age</TableCell>
                <TableCell>Cases</TableCell>
                <TableCell>Last Visit</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredPatients.length > 0 ? (
                filteredPatients.map((patient) => (
                  <TableRow key={patient.id}>
                    <TableCell>
                      <Typography variant="subtitle2">
                        {patient.name || 'Unknown Patient'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {patient.email || 'No email'}
                      </Typography>
                    </TableCell>
                    <TableCell>{patient.age || 'N/A'}</TableCell>
                    <TableCell>{patient.case_count || 0}</TableCell>
                    <TableCell>
                      {patient.last_visit 
                        ? new Date(patient.last_visit).toLocaleDateString()
                        : 'Never'
                      }
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={patient.status || 'Active'}
                        color={patient.status === 'Active' ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <IconButton
                        color="primary"
                        onClick={() => handleViewPatient(patient)}
                        size="small"
                      >
                        <Visibility />
                      </IconButton>
                      <IconButton
                        color="secondary"
                        onClick={() => {/* Edit patient logic */}}
                        size="small"
                      >
                        <Edit />
                      </IconButton>
                      <IconButton
                        color="error"
                        onClick={() => {/* Delete patient logic */}}
                        size="small"
                      >
                        <Delete />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    <Typography variant="body1" color="text.secondary" sx={{ py: 4 }}>
                      {searchTerm ? 'No patients found matching your search.' : 'No patients yet.'}
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Patient Details Dialog */}
        <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
          <DialogTitle>Patient Details</DialogTitle>
          <DialogContent>
            {selectedPatient && (
              <Box sx={{ pt: 2 }}>
                <Typography variant="h6" gutterBottom>
                  {selectedPatient.name}
                </Typography>
                <Typography variant="body1" gutterBottom>
                  <strong>Age:</strong> {selectedPatient.age || 'N/A'}
                </Typography>
                <Typography variant="body1" gutterBottom>
                  <strong>Email:</strong> {selectedPatient.email || 'N/A'}
                </Typography>
                <Typography variant="body1" gutterBottom>
                  <strong>Cases:</strong> {selectedPatient.case_count || 0}
                </Typography>
                <Typography variant="body1" gutterBottom>
                  <strong>Last Visit:</strong> {
                    selectedPatient.last_visit 
                      ? new Date(selectedPatient.last_visit).toLocaleDateString()
                      : 'Never'
                  }
                </Typography>
                <Typography variant="body1" gutterBottom>
                  <strong>Status:</strong> {selectedPatient.status || 'Active'}
                </Typography>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Close</Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Container>
  );
};

export default PatientList; 