import React from 'react';
import { useAuth } from '../../context/AuthContext';
import Navbar from './Navbar';

const Dashboard = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Welcome back, {user?.full_name || user?.username}!
          </h1>
          <p className="text-gray-600">Your dashboard is ready. Start exploring stock predictions!</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;