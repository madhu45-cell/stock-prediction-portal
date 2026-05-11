import api from './api';

const predictionService = {
  // Get prediction for a stock
  async getPrediction(symbol, daysAhead = 7, model = 'ensemble') {
    try {
      const response = await api.post('/predictions/predict', {
        symbol,
        days_ahead: daysAhead,
        model
      });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.detail || 'Prediction failed' };
    }
  },

  // Get latest prediction
  async getLatestPrediction(symbol) {
    try {
      const response = await api.get(`/predictions/${symbol}/latest`);
      return { success: true, data: response.data.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.detail || 'Failed to get prediction' };
    }
  },

  // Train model (admin)
  async trainModel(symbol) {
    try {
      const response = await api.post(`/predictions/train/${symbol}`);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.detail || 'Training failed' };
    }
  },

  // Get training status
  async getTrainingStatus(jobId) {
    try {
      const response = await api.get(`/predictions/training/${jobId}/status`);
      return { success: true, data: response.data.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.detail || 'Failed to get status' };
    }
  },

  // Get watchlist
  async getWatchlist() {
    try {
      const response = await api.get('/watchlist');
      return { success: true, data: response.data.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.detail || 'Failed to get watchlist' };
    }
  },

  // Add to watchlist
  async addToWatchlist(symbol) {
    try {
      const response = await api.post(`/watchlist/${symbol}`);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.detail || 'Failed to add to watchlist' };
    }
  },

  // Remove from watchlist
  async removeFromWatchlist(symbol) {
    try {
      const response = await api.delete(`/watchlist/${symbol}`);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.detail || 'Failed to remove from watchlist' };
    }
  }
};

export default predictionService;