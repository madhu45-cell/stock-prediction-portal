import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import stockService from '../../services/stockService';
import predictionService from '../../services/predictionService';
import { useAuth } from '../../context/AuthContext';
import { 
  FiStar, FiTrendingUp, FiTrendingDown, FiActivity, 
  FiDollarSign, FiBarChart2, FiClock, FiInfo 
} from 'react-icons/fi';
import toast from 'react-hot-toast';

const StockDetail = () => {
  const { symbol } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stock, setStock] = useState(null);
  const [history, setHistory] = useState([]);
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [inWatchlist, setInWatchlist] = useState(false);
  const [period, setPeriod] = useState('1mo');
  const [chartType, setChartType] = useState('line');

  useEffect(() => {
    loadStockData();
    checkWatchlist();
    const interval = setInterval(updateRealTimePrice, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, [symbol, period]);

  const loadStockData = async () => {
    setLoading(true);
    
    const detailResult = await stockService.getStockDetail(symbol);
    if (detailResult.success) {
      setStock(detailResult.data);
    }
    
    const historyResult = await stockService.getStockHistory(symbol, period);
    if (historyResult.success) {
      setHistory(historyResult.data);
    }
    
    const predictionResult = await predictionService.getLatestPrediction(symbol);
    if (predictionResult.success && predictionResult.data) {
      setPrediction(predictionResult.data);
    }
    
    setLoading(false);
  };

  const updateRealTimePrice = async () => {
    const result = await stockService.getRealtimePrice(symbol);
    if (result.success && result.data) {
      setStock(prev => ({ ...prev, ...result.data }));
    }
  };

  const checkWatchlist = async () => {
    const result = await predictionService.getWatchlist();
    if (result.success) {
      setInWatchlist(result.data.some(item => item.symbol === symbol));
    }
  };

  const handleAddToWatchlist = async () => {
    const result = await predictionService.addToWatchlist(symbol);
    if (result.success) {
      setInWatchlist(true);
      toast.success(`${symbol} added to watchlist`);
    } else {
      toast.error(result.error);
    }
  };

  const handleRemoveFromWatchlist = async () => {
    const result = await predictionService.removeFromWatchlist(symbol);
    if (result.success) {
      setInWatchlist(false);
      toast.success(`${symbol} removed from watchlist`);
    } else {
      toast.error(result.error);
    }
  };

  const handleGetPrediction = async () => {
    const result = await predictionService.getPrediction(symbol);
    if (result.success) {
      toast.success('Prediction started! Check back in a moment.');
      setTimeout(loadStockData, 5000);
    } else {
      toast.error(result.error);
    }
  };

  // Simple chart component
  const renderChart = () => {
    if (!history || history.length === 0) {
      return <div className="text-center py-12 text-gray-500">No chart data available</div>;
    }

    const prices = history.map(h => h.close);
    const maxPrice = Math.max(...prices);
    const minPrice = Math.min(...prices);
    const range = maxPrice - minPrice;
    const height = 300;

    return (
      <div className="relative" style={{ height: `${height}px` }}>
        <svg width="100%" height={height} className="overflow-visible">
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
            const y = height * (1 - ratio);
            const price = minPrice + range * ratio;
            return (
              <g key={i}>
                <line x1="0" y1={y} x2="100%" y2={y} stroke="#e5e7eb" strokeWidth="1" />
                <text x="5" y={y - 3} fontSize="10" fill="#9ca3af">${price.toFixed(2)}</text>
              </g>
            );
          })}
          
          {/* Price line */}
          <polyline
            points={prices.map((price, i) => {
              const x = (i / (prices.length - 1)) * window.innerWidth * 0.8;
              const y = height - ((price - minPrice) / range) * height;
              return `${x},${y}`;
            }).join(' ')}
            fill="none"
            stroke="#3b82f6"
            strokeWidth="2"
          />
          
          {/* Area under line */}
          <polygon
            points={prices.map((price, i) => {
              const x = (i / (prices.length - 1)) * window.innerWidth * 0.8;
              const y = height - ((price - minPrice) / range) * height;
              return `${x},${y}`;
            }).join(' ') + ` ${window.innerWidth * 0.8},${height} 0,${height}`}
            fill="url(#gradient)"
            opacity="0.1"
          />
          
          <defs>
            <linearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!stock) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Stock not found</p>
        <button onClick={() => navigate('/stocks')} className="mt-4 text-blue-600 hover:underline">
          Back to Search
        </button>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-wrap justify-between items-start gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{stock.symbol}</h1>
            <p className="text-gray-600">{stock.name}</p>
            <p className="text-sm text-gray-500 mt-1">
              Sector: {stock.sector || 'N/A'} | Industry: {stock.industry || 'N/A'}
            </p>
          </div>
          <div className="flex gap-3">
            {inWatchlist ? (
              <button
                onClick={handleRemoveFromWatchlist}
                className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 flex items-center gap-2"
              >
                <FiStar /> Watchlisted
              </button>
            ) : (
              <button
                onClick={handleAddToWatchlist}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center gap-2"
              >
                <FiStar /> Add to Watchlist
              </button>
            )}
            <button
              onClick={handleGetPrediction}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <FiTrendingUp /> AI Prediction
            </button>
          </div>
        </div>

        {/* Price Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center text-gray-500 mb-1">
              <FiDollarSign className="mr-1" /> Current Price
            </div>
            <div className="text-2xl font-bold text-gray-900">
              ${stock.current_price?.toFixed(2) || 'N/A'}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center text-gray-500 mb-1">
              <FiTrendingUp className="mr-1" /> Change
            </div>
            <div className={`text-2xl font-bold ${(stock.change_percent || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {(stock.change_percent || 0) >= 0 ? '+' : ''}{stock.change_percent?.toFixed(2)}%
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center text-gray-500 mb-1">
              <FiBarChart2 className="mr-1" /> Day Range
            </div>
            <div className="text-gray-900">
              ${stock.day_low?.toFixed(2)} - ${stock.day_high?.toFixed(2)}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center text-gray-500 mb-1">
              <FiClock className="mr-1" /> Prev Close
            </div>
            <div className="text-gray-900">${stock.prev_close?.toFixed(2) || 'N/A'}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center text-gray-500 mb-1">
              <FiActivity className="mr-1" /> Volume
            </div>
            <div className="text-gray-900">{stock.volume?.toLocaleString() || 'N/A'}</div>
          </div>
        </div>

        {/* Chart */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex flex-wrap justify-between items-center mb-4">
            <h2 className="text-lg font-medium text-gray-900">Price Chart</h2>
            <div className="flex gap-2">
              {['1d', '1wk', '1mo', '3mo', '1y'].map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p === '1d' ? '1d' : p === '1wk' ? '1wk' : p === '1mo' ? '1mo' : p === '3mo' ? '3mo' : '1y')}
                  className={`px-3 py-1 rounded text-sm ${period === p ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
          {renderChart()}
        </div>

        {/* Prediction Section */}
        {prediction && (
          <div className="bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 rounded-lg shadow p-6 text-white">
            <h2 className="text-xl font-bold mb-2 flex items-center gap-2">
              <FiTrendingUp /> AI Price Prediction
            </h2>
            <p className="text-purple-100 mb-4">Based on ensemble model (LSTM + XGBoost + Prophet)</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white/10 rounded-lg p-3">
                <p className="text-sm opacity-80">Current Price</p>
                <p className="text-2xl font-bold">${prediction.current_price?.toFixed(2)}</p>
              </div>
              <div className="bg-white/10 rounded-lg p-3">
                <p className="text-sm opacity-80">Predicted Price (7 days)</p>
                <p className="text-2xl font-bold">${prediction.predicted_price?.toFixed(2)}</p>
              </div>
              <div className="bg-white/10 rounded-lg p-3">
                <p className="text-sm opacity-80">Confidence Score</p>
                <p className="text-2xl font-bold">{(prediction.confidence_score * 100).toFixed(1)}%</p>
              </div>
            </div>
            {(prediction.price_target_low || prediction.price_target_high) && (
              <div className="mt-4 pt-4 border-t border-white/20">
                <p className="text-sm">
                  Target Range: ${prediction.price_target_low?.toFixed(2)} - ${prediction.price_target_high?.toFixed(2)}
                </p>
              </div>
            )}
          </div>
        )}

        {/* About Section */}
        <div className="mt-6 bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-3 flex items-center gap-2">
            <FiInfo /> About {stock.symbol}
          </h2>
          <p className="text-gray-600">
            {stock.name} ({stock.symbol}) is a {stock.sector || 'leading'} company in the {stock.industry || 'financial'} sector.
            Market capitalization: ${(stock.market_cap / 1000000000).toFixed(2)}B
          </p>
        </div>
      </div>
    </div>
  );
};

export default StockDetail;