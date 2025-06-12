import api, { apiMultipart } from './api';

export const aiService = {
  // Get AI model status
  getModelStatus: async () => {
    const response = await api.get('/api/ai/model-status');
    return response;
  },

  // Bulk classify images
  bulkClassify: async (files) => {
    const formData = new FormData();
    files.forEach((file, index) => {
      formData.append(`files`, file);
    });

    const response = await apiMultipart.post('/api/ai/bulk-upload-categorize', formData);
    return response;
  },

  // Test single image classification
  testClassification: async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiMultipart.post('/api/ai/test-classification', formData);
    return response;
  },

  // Correct classification
  correctClassification: async (imageId, correctCategory) => {
    const response = await api.post('/api/ai/correct-classification', {
      image_id: imageId,
      correct_category: correctCategory,
    });
    return response;
  },

  // Trigger training
  triggerTraining: async () => {
    const response = await api.post('/api/ai/trigger-training');
    return response;
  },

  // Get training statistics
  getTrainingStats: async () => {
    const response = await api.get('/api/ai/training-stats');
    return response;
  },

  // Get classification categories
  getCategories: async () => {
    const response = await api.get('/api/ai/categories');
    return response;
  },

  // Get classification history
  getClassificationHistory: async (limit = 50) => {
    const response = await api.get(`/api/ai/history?limit=${limit}`);
    return response;
  },

  // Delete classification
  deleteClassification: async (classificationId) => {
    const response = await api.delete(`/api/ai/classification/${classificationId}`);
    return response;
  },

  // Update classification confidence threshold
  updateConfidenceThreshold: async (threshold) => {
    const response = await api.post('/api/ai/confidence-threshold', {
      threshold,
    });
    return response;
  },

  // Get model performance metrics
  getModelMetrics: async () => {
    const response = await api.get('/api/ai/metrics');
    return response;
  },

  // Export training data
  exportTrainingData: async () => {
    const response = await api.get('/api/ai/export-training-data', {
      responseType: 'blob',
    });
    return response;
  },

  // Import training data
  importTrainingData: async (file) => {
    const formData = new FormData();
    formData.append('training_data', file);

    const response = await apiMultipart.post('/api/ai/import-training-data', formData);
    return response;
  },
}; 