import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import predictionService from '../../services/predictionService';
import { FiTrash2, FiTrendingUp, FiTrendingDown } from 'react-icons/fi';
import toast from 'react-hot-toast';

const Watchlist = () => {
  const [watchlist, setWatchlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadWatchlist();
  }, []);

  const loadWatchlist = async () => {
    const result = await predictionService.getWatchlist();
    if (result.success) {
      setWatchlist(result.data);
    }
    setLoading(false);
  };

  const handleRemove = async (symbol) => {
    const result = await predictionService.removeFromWatchlist(symbol);
    if (result.success) {
      toast.success(`${symbol} removed from watchlist`);
      loadWatchlist();
    } else {
      toast.error(result.error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">My Watchlist</h1>
        
        {watchlist.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <p className="text-gray-500 mb-4">Your watchlist is empty</p>
            <button
              onClick={() => navigate('/stocks')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Browse Stocks
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Symbol</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Change</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {watchlist.map((stock) => (
                  <tr key={stock.symbol} className="hover:bg-gray-50 cursor-pointer" onClick={() => navigate(`/stocks/${stock.symbol}`)}>
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{stock.symbol}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600">{stock.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-900">${stock.current_price?.toFixed(2)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`flex items-center ${(stock.change_percent || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {(stock.change_percent || 0) >= 0 ? <FiTrendingUp className="mr-1" /> : <FiTrendingDown className="mr-1" />}
                        {(stock.change_percent || 0) >= 0 ? '+' : ''}{stock.change_percent?.toFixed(2)}%
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemove(stock.symbol);
                        }}
                        className="text-red-600 hover:text-red-800"
                      >
                        <FiTrash2 />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Watchlist;