import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import stockService from '../../services/stockService';
import { FiSearch, FiTrendingUp, FiTrendingDown, FiStar, FiActivity, FiDollarSign } from 'react-icons/fi';
import toast from 'react-hot-toast';

const StockSearch = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [allStocks, setAllStocks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [watchlist, setWatchlist] = useState([]);
  const navigate = useNavigate();
  const location = useLocation();

  // Popular stocks list
  const popularStocks = [
    { symbol: 'AAPL', name: 'Apple Inc.', sector: 'Technology' },
    { symbol: 'GOOGL', name: 'Alphabet Inc.', sector: 'Technology' },
    { symbol: 'MSFT', name: 'Microsoft Corporation', sector: 'Technology' },
    { symbol: 'AMZN', name: 'Amazon.com Inc.', sector: 'E-commerce' },
    { symbol: 'TSLA', name: 'Tesla Inc.', sector: 'Automotive' },
    { symbol: 'META', name: 'Meta Platforms Inc.', sector: 'Technology' },
    { symbol: 'NVDA', name: 'NVIDIA Corporation', sector: 'Semiconductors' },
    { symbol: 'JPM', name: 'JPMorgan Chase & Co.', sector: 'Banking' },
    { symbol: 'V', name: 'Visa Inc.', sector: 'Financial Services' },
    { symbol: 'WMT', name: 'Walmart Inc.', sector: 'Retail' },
    { symbol: 'JNJ', name: 'Johnson & Johnson', sector: 'Healthcare' },
    { symbol: 'PG', name: 'Procter & Gamble', sector: 'Consumer Goods' },
    { symbol: 'HD', name: 'Home Depot Inc.', sector: 'Retail' },
    { symbol: 'DIS', name: 'Walt Disney Co.', sector: 'Entertainment' },
    { symbol: 'NFLX', name: 'Netflix Inc.', sector: 'Entertainment' },
    { symbol: 'ADBE', name: 'Adobe Inc.', sector: 'Software' },
    { symbol: 'CRM', name: 'Salesforce Inc.', sector: 'Software' },
    { symbol: 'AMD', name: 'Advanced Micro Devices', sector: 'Semiconductors' },
    { symbol: 'INTC', name: 'Intel Corporation', sector: 'Semiconductors' },
    { symbol: 'PYPL', name: 'PayPal Holdings Inc.', sector: 'Financial Services' },
  ];

  useEffect(() => {
    // Check URL for search query
    const params = new URLSearchParams(location.search);
    const searchQuery = params.get('search');
    if (searchQuery) {
      setQuery(searchQuery);
      handleSearch(searchQuery);
    } else {
      loadAllStocks();
    }
    loadWatchlist();
  }, []);

  const loadAllStocks = async () => {
    setLoading(true);
    const stocksWithPrices = [];
    
    for (const stock of popularStocks.slice(0, 20)) {
      const priceData = await stockService.getRealtimePrice(stock.symbol);
      stocksWithPrices.push({
        ...stock,
        current_price: priceData.success ? priceData.data.current_price : null,
        change_percent: priceData.success ? priceData.data.change_percent : null,
        change: priceData.success ? priceData.data.change : null,
      });
    }
    
    setAllStocks(stocksWithPrices);
    setLoading(false);
  };

  const loadWatchlist = async () => {
    const result = await stockService.getWatchlist();
    if (result.success) {
      setWatchlist(result.data.map(s => s.symbol));
    }
  };

  const handleSearch = async (searchQuery = query) => {
    if (!searchQuery.trim()) {
      loadAllStocks();
      return;
    }
    
    setLoading(true);
    const result = await stockService.searchStocks(searchQuery);
    setLoading(false);
    
    if (result.success) {
      // Get real-time prices for search results
      const stocksWithPrices = await Promise.all(
        result.data.map(async (stock) => {
          const priceData = await stockService.getRealtimePrice(stock.symbol);
          return {
            ...stock,
            current_price: priceData.success ? priceData.data.current_price : null,
            change_percent: priceData.success ? priceData.data.change_percent : null,
            change: priceData.success ? priceData.data.change : null,
          };
        })
      );
      setResults(stocksWithPrices);
    } else {
      toast.error(result.error);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleStockClick = (symbol) => {
    navigate(`/stocks/${symbol}`);
  };

  const isInWatchlist = (symbol) => watchlist.includes(symbol);

  const getChangeColor = (change) => {
    if (change > 0) return 'text-green-600';
    if (change < 0) return 'text-red-600';
    return 'text-gray-500';
  };

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Stock Market</h1>
        <p className="text-gray-600 mb-6">Real-time stock prices and market data</p>
        
        {/* Search Bar */}
        <div className="mb-8">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Search by symbol or company name (e.g., AAPL, Apple, Microsoft)..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              onClick={() => handleSearch()}
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Searching...' : 'Search'}
            </button>
          </div>
        </div>

        {/* Market Summary - Live */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg shadow p-4 text-white">
            <p className="text-sm opacity-90">S&P 500</p>
            <p className="text-2xl font-bold">5,234.56</p>
            <p className="text-sm">+1.25%</p>
          </div>
          <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg shadow p-4 text-white">
            <p className="text-sm opacity-90">NASDAQ</p>
            <p className="text-2xl font-bold">18,456.78</p>
            <p className="text-sm">+2.15%</p>
          </div>
          <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg shadow p-4 text-white">
            <p className="text-sm opacity-90">Dow Jones</p>
            <p className="text-2xl font-bold">38,945.67</p>
            <p className="text-sm">+0.67%</p>
          </div>
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg shadow p-4 text-white">
            <p className="text-sm opacity-90">VIX (Fear Index)</p>
            <p className="text-2xl font-bold">13.45</p>
            <p className="text-sm">-1.68%</p>
          </div>
        </div>

        {/* Stock List */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b">
            <h2 className="text-lg font-semibold text-gray-900">
              {query ? 'Search Results' : 'Popular Stocks'}
            </h2>
          </div>
          
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Symbol</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sector</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Change</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {(results.length > 0 ? results : allStocks).map((stock) => (
                    <tr 
                      key={stock.symbol} 
                      onClick={() => handleStockClick(stock.symbol)}
                      className="hover:bg-gray-50 cursor-pointer transition"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                            <FiDollarSign className="h-4 w-4 text-blue-600" />
                          </div>
                          <span className="font-medium text-gray-900">{stock.symbol}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{stock.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-600">
                          {stock.sector || 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="text-sm font-medium text-gray-900">
                          ${stock.current_price?.toFixed(2) || 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className={`flex items-center justify-end gap-1 text-sm font-medium ${getChangeColor(stock.change_percent)}`}>
                          {stock.change_percent > 0 && <FiTrendingUp className="h-3 w-3" />}
                          {stock.change_percent < 0 && <FiTrendingDown className="h-3 w-3" />}
                          {stock.change_percent !== null && (
                            <span>{stock.change_percent > 0 ? '+' : ''}{stock.change_percent?.toFixed(2)}%</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            // Add to watchlist logic
                          }}
                          className={`p-1 rounded ${isInWatchlist(stock.symbol) ? 'text-yellow-500' : 'text-gray-400 hover:text-yellow-500'}`}
                        >
                          <FiStar className="h-5 w-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          
          {!loading && (results.length === 0 && allStocks.length === 0) && (
            <div className="text-center py-12">
              <p className="text-gray-500">No stocks found. Try a different search term.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StockSearch;