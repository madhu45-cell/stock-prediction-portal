import React from 'react';

const RecentActivity = () => {
  const activities = [
    { id: 1, type: 'prediction', stock: 'AAPL', message: 'AI predicted 15% increase', time: '2 hours ago', status: 'completed' },
    { id: 2, type: 'watchlist', stock: 'TSLA', message: 'Added to watchlist', time: '5 hours ago', status: 'completed' },
    { id: 3, type: 'prediction', stock: 'GOOGL', message: 'Prediction in progress', time: '1 day ago', status: 'pending' },
  ];

  const statusColors = {
    completed: 'bg-green-100 text-green-800',
    pending: 'bg-yellow-100 text-yellow-800',
    failed: 'bg-red-100 text-red-800'
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h2>
      <div className="space-y-4">
        {activities.map((activity) => (
          <div key={activity.id} className="flex items-center justify-between py-3 border-b last:border-0">
            <div>
              <p className="text-sm font-medium text-gray-900">{activity.stock} - {activity.message}</p>
              <p className="text-xs text-gray-500">{activity.time}</p>
            </div>
            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusColors[activity.status]}`}>
              {activity.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecentActivity;