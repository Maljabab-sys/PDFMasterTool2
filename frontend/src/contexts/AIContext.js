import React, { createContext, useContext, useState, useEffect } from 'react';
import { aiService } from '../services/aiService';

const AIContext = createContext();

export const useAI = () => {
  const context = useContext(AIContext);
  if (!context) {
    throw new Error('useAI must be used within an AIProvider');
  }
  return context;
};

export const AIProvider = ({ children }) => {
  const [modelStatus, setModelStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [classifications, setClassifications] = useState([]);
  const [trainingStats, setTrainingStats] = useState(null);

  useEffect(() => {
    loadModelStatus();
  }, []);

  const loadModelStatus = async () => {
    try {
      const status = await aiService.getModelStatus();
      setModelStatus(status);
    } catch (error) {
      console.error('Failed to load model status:', error);
    }
  };

  const classifyImages = async (images) => {
    setLoading(true);
    try {
      const results = await aiService.bulkClassify(images);
      setClassifications(results);
      return results;
    } catch (error) {
      console.error('Classification failed:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const testClassification = async (imageFile) => {
    setLoading(true);
    try {
      const result = await aiService.testClassification(imageFile);
      return result;
    } catch (error) {
      console.error('Test classification failed:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const correctClassification = async (imageId, correctCategory) => {
    try {
      await aiService.correctClassification(imageId, correctCategory);
      // Update local state if needed
    } catch (error) {
      console.error('Failed to correct classification:', error);
      throw error;
    }
  };

  const triggerTraining = async () => {
    try {
      const result = await aiService.triggerTraining();
      return result;
    } catch (error) {
      console.error('Failed to trigger training:', error);
      throw error;
    }
  };

  const getTrainingStats = async () => {
    try {
      const stats = await aiService.getTrainingStats();
      setTrainingStats(stats);
      return stats;
    } catch (error) {
      console.error('Failed to get training stats:', error);
      throw error;
    }
  };

  const value = {
    modelStatus,
    loading,
    classifications,
    trainingStats,
    classifyImages,
    testClassification,
    correctClassification,
    triggerTraining,
    getTrainingStats,
    loadModelStatus
  };

  return (
    <AIContext.Provider value={value}>
      {children}
    </AIContext.Provider>
  );
}; 