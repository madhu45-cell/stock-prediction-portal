import React, { useState, useEffect } from 'react';
// Remove: import Navbar from '../Layout/Navbar';
import { FiCalendar, FiTrendingUp, FiTrendingDown, FiMinus, FiExternalLink } from 'react-icons/fi';

const NewsPage = () => {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [marketSummary, setMarketSummary] = useState(null);

  const categories = [
    { id: 'all', name: 'All News' },
    { id: 'economy', name: 'Economy' },
    { id: 'technology', name: 'Technology' },
    { id: 'earnings', name: 'Earnings' },
    { id: 'crypto', name: 'Cryptocurrency' },
    { id: 'stocks', name: 'Stocks' },
  ];

  useEffect(() => {
    loadNews();
    loadMarketSummary();
  }, [selectedCategory]);

  const loadNews = async () => {
    setLoading(true);
    // Mock news data
    const mockNews = [
      {
        id: 1,
        title: "Federal Reserve Signals Rate Cuts Coming Soon",
        summary: "Fed officials indicate potential rate cuts in second half of 2024, boosting market sentiment across all sectors.",
        source: "Reuters",
        time: "2 hours ago",
        sentiment: "positive",
        category: "economy",
        image: "https://images.unsplash.com/photo-1611974789855-9c56a6915841?w=400&h=200&fit=crop",
        url: "#"
      },
      {
        id: 2,
        title: "AI Boom Drives Tech Stocks to Record Highs",
        summary: "NVIDIA, Microsoft, and other AI-related stocks surge as demand for AI chips and services continues to grow exponentially.",
        source: "Bloomberg",
        time: "4 hours ago",
        sentiment: "positive",
        category: "technology",
        image: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400&h=200&fit=crop",
        url: "#"
      },
      {
        id: 3,
        title: "Oil Prices Drop on Supply Concerns",
        summary: "Crude oil prices fall as OPEC+ considers increasing production to meet global demand.",
        source: "CNBC",
        time: "6 hours ago",
        sentiment: "negative",
        category: "economy",
        image: "https://images.unsplash.com/photo-1569767101480-f003ce9d21bc?w=400&h=200&fit=crop",
        url: "#"
      },
      {
        id: 4,
        title: "Bitcoin Surges Past $70,000",
        summary: "Cryptocurrency market rallies as institutional investors increase exposure to digital assets.",
        source: "CoinDesk",
        time: "8 hours ago",
        sentiment: "positive",
        category: "crypto",
        image: "https://images.unsplash.com/photo-1518546305927-5a555bb7020d?w=400&h=200&fit=crop",
        url: "#"
      },
      {
        id: 5,
        title: "Tech Earnings: Apple Beats Expectations",
        summary: "Apple reports strong quarterly results driven by iPhone sales and services revenue growth.",
        source: "Wall Street Journal",
        time: "12 hours ago",
        sentiment: "positive",
        category: "earnings",
        image: "https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=400&h=200&fit=crop",
        url: "#"
      },
      {
        id: 6,
        title: "Market Volatility Expected This Week",
        summary: "Analysts predict increased market volatility as economic data and corporate earnings are released.",
        source: "Financial Times",
        time: "1 day ago",
        sentiment: "neutral",
        category: "stocks",
        image: "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=400&h=200&fit=crop",
        url: "#"
      },
    ];

    const filtered = selectedCategory === 'all' 
      ? mockNews 
      : mockNews.filter(n => n.category === selectedCategory);
    
    setNews(filtered);
    setLoading(false);
  };

  const loadMarketSummary = async () => {
    setMarketSummary({
      sp500: { value: 5234.56, change: 0.85, changePercent: 1.25 },
      nasdaq: { value: 18456.78, change: 1.23, changePercent: 2.15 },
      dow: { value: 38945.67, change: 0.45, changePercent: 0.67 },
      vix: { value: 13.45, change: -0.23, changePercent: -1.68 },
    });
  };

  const getSentimentIcon = (sentiment) => {
    if (sentiment === 'positive') return <FiTrendingUp className="text-green-500" />;
    if (sentiment === 'negative') return <FiTrendingDown className="text-red-500" />;
    return <FiMinus className="text-yellow-500" />;
  };

  const getSentimentColor = (sentiment) => {
    if (sentiment === 'positive') return 'bg-green-100 text-green-800';
    if (sentiment === 'negative') return 'bg-red-100 text-red-800';
    return 'bg-yellow-100 text-yellow-800';
  };

  return (
    // Remove <Navbar /> from here
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Market News</h1>
          <p className="text-gray-600 mt-1">Latest financial news and market updates</p>
        </div>

        {/* Market Summary */}
        {marketSummary && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-sm text-gray-500">S&P 500</p>
              <p className="text-xl font-bold">{marketSummary.sp500.value.toFixed(2)}</p>
              <p className={`text-sm ${marketSummary.sp500.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {marketSummary.sp500.change >= 0 ? '+' : ''}{marketSummary.sp500.changePercent.toFixed(2)}%
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-sm text-gray-500">NASDAQ</p>
              <p className="text-xl font-bold">{marketSummary.nasdaq.value.toFixed(2)}</p>
              <p className={`text-sm ${marketSummary.nasdaq.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {marketSummary.nasdaq.change >= 0 ? '+' : ''}{marketSummary.nasdaq.changePercent.toFixed(2)}%
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-sm text-gray-500">Dow Jones</p>
              <p className="text-xl font-bold">{marketSummary.dow.value.toFixed(2)}</p>
              <p className={`text-sm ${marketSummary.dow.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {marketSummary.dow.change >= 0 ? '+' : ''}{marketSummary.dow.changePercent.toFixed(2)}%
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-sm text-gray-500">VIX (Fear Index)</p>
              <p className="text-xl font-bold">{marketSummary.vix.value.toFixed(2)}</p>
              <p className={`text-sm ${marketSummary.vix.change <= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {marketSummary.vix.change >= 0 ? '+' : ''}{marketSummary.vix.changePercent.toFixed(2)}%
              </p>
            </div>
          </div>
        )}

        {/* Category Filters */}
        <div className="flex flex-wrap gap-2 mb-6">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                selectedCategory === cat.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* News Grid */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {news.map((item) => (
              <div key={item.id} className="bg-white rounded-lg shadow overflow-hidden hover:shadow-lg transition">
                {item.image && (
                  <img src={item.image} alt={item.title} className="w-full h-48 object-cover" />
                )}
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-xs px-2 py-1 rounded-full ${getSentimentColor(item.sentiment)}`}>
                      <span className="flex items-center gap-1">
                        {getSentimentIcon(item.sentiment)}
                        {item.sentiment.charAt(0).toUpperCase() + item.sentiment.slice(1)}
                      </span>
                    </span>
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <FiCalendar className="h-3 w-3" />
                      {item.time}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">{item.title}</h3>
                  <p className="text-gray-600 text-sm mb-3 line-clamp-3">{item.summary}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">{item.source}</span>
                    <a 
                      href={item.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-700 text-sm flex items-center gap-1"
                    >
                      Read more <FiExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && news.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No news found for this category.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default NewsPage;