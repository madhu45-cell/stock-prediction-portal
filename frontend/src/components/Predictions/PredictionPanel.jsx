import React, { useState } from 'react';
import predictionService from '../../services/predictionService';
import PredictionChart from './PredictionChart';
import { FiTrendingUp, FiCpu, FiZap, FiBarChart2, FiClock, FiCalendar, FiInfo } from 'react-icons/fi';
import toast from 'react-hot-toast';

const PredictionPanel = () => {
  const [symbol, setSymbol] = useState('');
  const [daysAhead, setDaysAhead] = useState(7);
  const [model, setModel] = useState('ensemble');
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [recentPredictions, setRecentPredictions] = useState([
    { symbol: 'AAPL', date: '2024-01-15', predictedPrice: 185.50, actualPrice: 182.30, accuracy: 98.2 },
    { symbol: 'TSLA', date: '2024-01-14', predictedPrice: 220.00, actualPrice: 218.50, accuracy: 99.3 },
    { symbol: 'NVDA', date: '2024-01-13', predictedPrice: 580.00, actualPrice: 575.20, accuracy: 99.2 },
  ]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!symbol.trim()) {
      toast.error('Please enter a stock symbol');
      return;
    }

    setLoading(true);
    const result = await predictionService.getPrediction(symbol.toUpperCase(), daysAhead, model);
    setLoading(false);

    if (result.success) {
      toast.success('Prediction initiated! AI is analyzing data...');
      // Poll for result
      const interval = setInterval(async () => {
        const latestResult = await predictionService.getLatestPrediction(symbol.toUpperCase());
        if (latestResult.success && latestResult.data) {
          setPrediction(latestResult.data);
          clearInterval(interval);
          toast.success('Prediction ready!');
        }
      }, 3000);
    } else {
      toast.error(result.error);
    }
  };

  const getDaysLabel = (days) => {
    if (days === 1) return '1 Day';
    if (days === 7) return '7 Days (1 Week)';
    if (days === 14) return '14 Days (2 Weeks)';
    if (days === 30) return '30 Days (1 Month)';
    return `${days} Days`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">AI Stock Predictions</h1>
          <p className="text-gray-500 mt-1">Leverage machine learning to forecast stock prices</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Prediction Form */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden sticky top-24">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-5 py-4">
                <div className="flex items-center gap-2">
                  <FiCpu className="h-5 w-5 text-white" />
                  <h2 className="text-white font-semibold">Prediction Settings</h2>
                </div>
                <p className="text-blue-100 text-xs mt-1">Configure your AI prediction parameters</p>
              </div>
              
              <form onSubmit={handleSubmit} className="p-5 space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Stock Symbol</label>
                  <input
                    type="text"
                    value={symbol}
                    onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                    placeholder="e.g., AAPL, TSLA, MSFT"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-400"
                    required
                  />
                  <p className="text-xs text-gray-400 mt-1">Enter a valid stock symbol</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Prediction Horizon</label>
                  <select
                    value={daysAhead}
                    onChange={(e) => setDaysAhead(parseInt(e.target.value))}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                  >
                    <option value={1}>1 Day (Short-term)</option>
                    <option value={7}>7 Days (1 Week)</option>
                    <option value={14}>14 Days (2 Weeks)</option>
                    <option value={30}>30 Days (1 Month)</option>
                  </select>
                  <div className="flex items-center gap-1 mt-1">
                    <FiClock className="h-3 w-3 text-gray-400" />
                    <p className="text-xs text-gray-400">Longer predictions have lower confidence</p>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">AI Model</label>
                  <select
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                  >
                    <option value="ensemble">Ensemble (All Models) - Recommended</option>
                    <option value="lstm">LSTM - Deep Learning</option>
                    <option value="xgboost">XGBoost - Gradient Boosting</option>
                    <option value="prophet">Prophet - Time Series</option>
                  </select>
                  <div className="flex items-center gap-1 mt-1">
                    <FiInfo className="h-3 w-3 text-gray-400" />
                    <p className="text-xs text-gray-400">Ensemble combines all models for best accuracy</p>
                  </div>
                </div>
                
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:shadow-lg transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2 font-medium"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <FiZap className="h-4 w-4" />
                      Get AI Prediction
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Recent Predictions */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mt-5">
              <div className="flex items-center gap-2 mb-4">
                <FiBarChart2 className="h-4 w-4 text-gray-500" />
                <h3 className="text-sm font-semibold text-gray-700">Recent Predictions</h3>
              </div>
              <div className="space-y-3">
                {recentPredictions.map((pred, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg transition">
                    <div>
                      <p className="font-medium text-gray-900">{pred.symbol}</p>
                      <p className="text-xs text-gray-400">{pred.date}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">${pred.predictedPrice}</p>
                      <p className="text-xs text-green-600">Accuracy: {pred.accuracy}%</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Prediction Results */}
          <div className="lg:col-span-2">
            {prediction ? (
              <PredictionChart prediction={prediction} />
            ) : (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
                <div className="w-20 h-20 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-5">
                  <FiTrendingUp className="h-10 w-10 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Ready for AI Predictions</h3>
                <p className="text-gray-500 max-w-md mx-auto">
                  Enter a stock symbol and click "Get AI Prediction" to see our machine learning forecast.
                </p>
                <div className="mt-6 flex items-center justify-center gap-2 text-xs text-gray-400">
                  <FiCpu className="h-3 w-3" />
                  <span>Powered by LSTM, XGBoost & Prophet models</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PredictionPanel;