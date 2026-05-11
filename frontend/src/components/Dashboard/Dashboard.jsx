import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
// Remove: import Navbar from '../Layout/Navbar';
import StatsCard from './StatsCard';
import RecentActivity from './RecentActivity';
import stockService from '../../services/stockService';
import { FiDollarSign, FiTrendingUp, FiActivity, FiUsers } from 'react-icons/fi';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalInvestments: 0,
    totalReturns: 0,
    activePredictions: 0,
    portfolioGrowth: 0
  });
  const [watchlist, setWatchlist] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    
    const watchlistResult = await stockService.getWatchlist();
    if (watchlistResult.success) {
      setWatchlist(watchlistResult.data);
    }
    
    setStats({
      totalInvestments: 12500,
      totalReturns: 2840,
      activePredictions: 12,
      portfolioGrowth: 22.5
    });
    
    setLoading(false);
  };

  return (
    // Remove <Navbar /> from here
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {user?.full_name || user?.username}!
        </h1>
        <p className="text-gray-600 mt-1">Here's what's happening with your investments today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <StatsCard
          title="Total Investments"
          value={`$${stats.totalInvestments.toLocaleString()}`}
          icon={FiDollarSign}
          color="blue"
        />
        <StatsCard
          title="Total Returns"
          value={`+$${stats.totalReturns.toLocaleString()}`}
          icon={FiTrendingUp}
          color="green"
        />
        <StatsCard
          title="Active Predictions"
          value={stats.activePredictions}
          icon={FiActivity}
          color="purple"
        />
        <StatsCard
          title="Portfolio Growth"
          value={`+${stats.portfolioGrowth}%`}
          icon={FiUsers}
          color="orange"
        />
      </div>

      {/* Recent Activity */}
      <RecentActivity />

      {/* Watchlist Preview */}
      {watchlist.length > 0 && (
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Your Watchlist</h2>
          <div className="space-y-3">
            {watchlist.slice(0, 5).map((stock) => (
              <div key={stock.symbol} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                <div>
                  <p className="font-medium text-gray-900">{stock.symbol}</p>
                  <p className="text-sm text-gray-500">{stock.name}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-gray-900">${stock.current_price?.toFixed(2)}</p>
                  <p className={`text-sm ${(stock.change_percent || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {(stock.change_percent || 0) >= 0 ? '+' : ''}{stock.change_percent?.toFixed(2)}%
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;