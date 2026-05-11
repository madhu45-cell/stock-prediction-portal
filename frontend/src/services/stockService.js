import api from './api';

const stockService = {
  // Search stocks - REAL API DATA
  async searchStocks(query) {
    try {
      const response = await api.get(`/stocks/search?query=${query}`);
      return { success: true, data: response.data.results || [] };
    } catch (error) {
      console.error('Search error:', error);
      return { success: false, data: [], error: error.message };
    }
  },

  // Get trending stocks - REAL API DATA
  async getTrendingStocks() {
    try {
      const response = await api.get('/stocks/trending');
      return { success: true, data: response.data.data || [] };
    } catch (error) {
      console.error('Trending error:', error);
      return { success: false, data: [], error: error.message };
    }
  },

  // Get stock details - REAL API DATA
  async getStockDetail(symbol) {
    try {
      const response = await api.get(`/stocks/${symbol}`);
      return { success: true, data: response.data.data };
    } catch (error) {
      console.error('Stock detail error:', error);
      return { success: false, data: null, error: error.message };
    }
  },

  // Get historical data - REAL API DATA
  async getStockHistory(symbol, period = '1mo', interval = '1d') {
    try {
      const response = await api.get(`/stocks/${symbol}/history?period=${period}&interval=${interval}`);
      return { success: true, data: response.data.data || [] };
    } catch (error) {
      console.error('History error:', error);
      return { success: false, data: [], error: error.message };
    }
  },

  // Get real-time price - REAL API DATA
  async getRealtimePrice(symbol) {
    try {
      const response = await api.get(`/stocks/${symbol}/realtime`);
      return { success: true, data: response.data.data };
    } catch (error) {
      console.error('Realtime price error:', error);
      return { success: false, data: null, error: error.message };
    }
  },

  // Get watchlist from backend database
  async getWatchlist() {
    try {
      const response = await api.get('/watchlist');
      return { success: true, data: response.data.data || [] };
    } catch (error) {
      console.error('Watchlist error:', error);
      return { success: true, data: [] };
    }
  },

  // Add to watchlist
  async addToWatchlist(symbol) {
    try {
      const response = await api.post(`/watchlist/${symbol}`);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.detail };
    }
  },

  // Remove from watchlist
  async removeFromWatchlist(symbol) {
    try {
      const response = await api.delete(`/watchlist/${symbol}`);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.detail };
    }
  }
};

export default stockService;