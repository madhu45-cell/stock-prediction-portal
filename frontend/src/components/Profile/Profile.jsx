import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiUser, 
  FiLock, 
  FiSave, 
  FiTrash2, 
  FiAlertCircle,
  FiCalendar,
  FiActivity,
  FiShield,
  FiKey,
  FiClock,
  FiStar,
  FiTrendingUp,
  FiCpu,
  FiAward,
  FiZap,
  FiMail,
  FiCheckCircle,
  FiBarChart2
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../../services/api';

const Profile = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [userStats, setUserStats] = useState({
    totalPredictions: 0,
    watchlistCount: 0,
    joinedDate: '',
    lastActive: ''
  });
  
  const [profileData, setProfileData] = useState({
    full_name: '',
    username: '',
    email: ''
  });
  
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });

  const achievements = [
    { id: 1, name: 'First Prediction', progress: 100, color: 'blue', completed: true },
    { id: 2, name: 'Market Analyst', progress: 65, color: 'purple', completed: false },
    { id: 3, name: 'Watchlist Guru', progress: 40, color: 'orange', completed: false },
    { id: 4, name: 'AI Expert', progress: 80, color: 'green', completed: false },
  ];

  useEffect(() => {
    if (user) {
      setProfileData({
        full_name: user.full_name || '',
        username: user.username || '',
        email: user.email || ''
      });
      loadUserStats();
    }
  }, [user]);

  const loadUserStats = async () => {
    try {
      const watchlistRes = await api.get('/watchlist');
      setUserStats({
        totalPredictions: 0,
        watchlistCount: watchlistRes.data?.data?.length || 0,
        joinedDate: user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A',
        lastActive: new Date().toLocaleDateString()
      });
    } catch (error) {
      console.error('Error loading user stats:', error);
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await api.put('/auth/profile', {
        full_name: profileData.full_name
      });
      
      if (response.data.success) {
        toast.success('Profile updated successfully');
        const updatedUser = { ...user, full_name: profileData.full_name };
        localStorage.setItem('user', JSON.stringify(updatedUser));
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    if (passwordData.new_password !== passwordData.confirm_password) {
      toast.error('New passwords do not match');
      setLoading(false);
      return;
    }
    
    if (passwordData.new_password.length < 8) {
      toast.error('Password must be at least 8 characters');
      setLoading(false);
      return;
    }
    
    try {
      const response = await api.post('/auth/change-password', {
        current_password: passwordData.current_password,
        new_password: passwordData.new_password,
        confirm_new_password: passwordData.confirm_password
      });
      
      if (response.data.success) {
        toast.success('Password changed successfully');
        setShowChangePassword(false);
        setPasswordData({
          current_password: '',
          new_password: '',
          confirm_password: ''
        });
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    setLoading(true);
    try {
      const response = await api.delete('/auth/me');
      if (response.data.success) {
        toast.success('Account deleted successfully');
        await logout();
        navigate('/login');
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to delete account');
    } finally {
      setLoading(false);
      setShowDeleteConfirm(false);
    }
  };

  const getColorClasses = (color) => {
    const colors = {
      blue: { bg: 'bg-blue-500/10', border: 'border-blue-500/20', text: 'text-blue-400', progress: 'bg-blue-500' },
      purple: { bg: 'bg-purple-500/10', border: 'border-purple-500/20', text: 'text-purple-400', progress: 'bg-purple-500' },
      orange: { bg: 'bg-orange-500/10', border: 'border-orange-500/20', text: 'text-orange-400', progress: 'bg-orange-500' },
      green: { bg: 'bg-green-500/10', border: 'border-green-500/20', text: 'text-green-400', progress: 'bg-green-500' },
    };
    return colors[color] || colors.blue;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900">Profile Settings</h1>
          <p className="text-gray-500 mt-1">Manage your account and preferences</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Profile Card */}
          <div className="lg:col-span-1">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
            >
              {/* Profile Header */}
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-8 text-center">
                <div className="relative">
                  <div className="w-24 h-24 mx-auto mb-4 bg-white rounded-full flex items-center justify-center shadow-lg">
                    <span className="text-3xl font-bold text-blue-600">
                      {profileData.username?.charAt(0).toUpperCase() || 'U'}
                    </span>
                  </div>
                  <h2 className="text-xl font-bold text-white">{profileData.full_name || profileData.username}</h2>
                  <p className="text-blue-100 mt-1">@{profileData.username}</p>
                  <div className="inline-flex items-center mt-3 px-3 py-1 rounded-full bg-white/20 text-white text-xs">
                    <FiZap className="h-3 w-3 mr-1" />
                    Premium Member
                  </div>
                </div>
              </div>
              
              {/* Stats Grid */}
              <div className="p-4 border-b border-gray-100">
                <div className="grid grid-cols-2 gap-3">
                  <div className="text-center p-3 rounded-xl bg-gray-50">
                    <p className="text-xs text-gray-500">Watchlist</p>
                    <p className="text-xl font-bold text-gray-900">{userStats.watchlistCount}</p>
                  </div>
                  <div className="text-center p-3 rounded-xl bg-gray-50">
                    <p className="text-xs text-gray-500">Predictions</p>
                    <p className="text-xl font-bold text-gray-900">{userStats.totalPredictions}</p>
                  </div>
                  <div className="text-center p-3 rounded-xl bg-gray-50">
                    <p className="text-xs text-gray-500">Accuracy</p>
                    <p className="text-xl font-bold text-green-600">87%</p>
                  </div>
                  <div className="text-center p-3 rounded-xl bg-gray-50">
                    <p className="text-xs text-gray-500">Rank</p>
                    <p className="text-xl font-bold text-gray-900">#1,234</p>
                  </div>
                </div>
              </div>
              
              {/* Account Info */}
              <div className="p-4 border-b border-gray-100">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Account Information</h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-center py-2">
                    <span className="text-gray-500 flex items-center gap-2 text-sm">
                      <FiCalendar className="text-gray-400" />
                      Joined
                    </span>
                    <span className="font-medium text-gray-900 text-sm">{userStats.joinedDate}</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-gray-500 flex items-center gap-2 text-sm">
                      <FiClock className="text-gray-400" />
                      Last Active
                    </span>
                    <span className="font-medium text-gray-900 text-sm">{userStats.lastActive}</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-gray-500 flex items-center gap-2 text-sm">
                      <FiMail className="text-gray-400" />
                      Email
                    </span>
                    <span className="font-medium text-gray-900 text-sm truncate">{profileData.email}</span>
                  </div>
                </div>
              </div>
              
              {/* Security Status */}
              <div className="p-4">
                <div className="bg-green-50 rounded-xl p-3 border border-green-100">
                  <div className="flex items-center gap-3">
                    <FiShield className="text-green-600 text-lg" />
                    <div>
                      <p className="text-sm font-medium text-green-700">Account Secure</p>
                      <p className="text-xs text-green-600">Protected & Verified</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Right Column */}
          <div className="lg:col-span-2 space-y-5">
            {/* Achievements Section */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5"
            >
              <div className="flex items-center gap-3 mb-5">
                <div className="p-2 bg-yellow-100 rounded-xl">
                  <FiAward className="text-yellow-600 text-lg" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-gray-900">Achievements</h3>
                  <p className="text-xs text-gray-500">Your trading milestones</p>
                </div>
              </div>
              
              <div className="space-y-4">
                {achievements.map((achievement, idx) => {
                  const colors = getColorClasses(achievement.color);
                  return (
                    <motion.div
                      key={achievement.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + idx * 0.1 }}
                      className="flex items-center gap-3"
                    >
                      <div className={`p-2 rounded-lg ${colors.bg}`}>
                        <FiBarChart2 className={`h-4 w-4 ${colors.text}`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm font-medium text-gray-800">{achievement.name}</span>
                          <span className="text-xs text-gray-500">{achievement.progress}%</span>
                        </div>
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${achievement.progress}%` }}
                            transition={{ duration: 1, delay: 0.5 + idx * 0.1 }}
                            className={`h-full rounded-full ${colors.progress}`}
                          />
                        </div>
                      </div>
                      {achievement.completed && (
                        <FiCheckCircle className="text-green-500 text-sm" />
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>

            {/* Profile Settings */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5"
            >
              <div className="flex items-center gap-3 mb-5">
                <div className="p-2 bg-blue-100 rounded-xl">
                  <FiUser className="text-blue-600 text-lg" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-gray-900">Profile Information</h3>
                  <p className="text-xs text-gray-500">Update your personal details</p>
                </div>
              </div>
              
              <form onSubmit={handleProfileUpdate} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    value={profileData.full_name}
                    onChange={(e) => setProfileData({ ...profileData, full_name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                    placeholder="Enter your full name"
                  />
                </div>
                
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all disabled:opacity-50 text-sm"
                >
                  <FiSave className="h-4 w-4" />
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </form>
            </motion.div>

            {/* Security Settings */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5"
            >
              <div className="flex items-center gap-3 mb-5">
                <div className="p-2 bg-purple-100 rounded-xl">
                  <FiKey className="text-purple-600 text-lg" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-gray-900">Security</h3>
                  <p className="text-xs text-gray-500">Manage your password</p>
                </div>
              </div>
              
              {!showChangePassword ? (
                <button
                  onClick={() => setShowChangePassword(true)}
                  className="flex items-center gap-2 px-4 py-2 border border-purple-500 text-purple-600 rounded-xl hover:bg-purple-50 transition-all text-sm"
                >
                  <FiLock className="h-4 w-4" />
                  Change Password
                </button>
              ) : (
                <form onSubmit={handleChangePassword} className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                    <input
                      type="password"
                      value={passwordData.current_password}
                      onChange={(e) => setPasswordData({ ...passwordData, current_password: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                    <input
                      type="password"
                      value={passwordData.new_password}
                      onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">Minimum 8 characters</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                    <input
                      type="password"
                      value={passwordData.confirm_password}
                      onChange={(e) => setPasswordData({ ...passwordData, confirm_password: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
                      required
                    />
                  </div>
                  
                  <div className="flex gap-3">
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-all text-sm"
                    >
                      <FiSave className="h-4 w-4" />
                      {loading ? 'Updating...' : 'Update Password'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowChangePassword(false)}
                      className="px-4 py-2 border border-gray-300 text-gray-600 rounded-xl hover:bg-gray-50 transition-all text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </motion.div>

            {/* Danger Zone */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="bg-white rounded-2xl shadow-sm border border-red-100 p-5"
            >
              <div className="flex items-center gap-3 mb-5">
                <div className="p-2 bg-red-100 rounded-xl">
                  <FiTrash2 className="text-red-600 text-lg" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-red-600">Delete Account</h3>
                  <p className="text-xs text-gray-500">Permanently delete your account</p>
                </div>
              </div>
              
              {!showDeleteConfirm ? (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all text-sm"
                >
                  <FiTrash2 className="h-4 w-4" />
                  Delete Account
                </button>
              ) : (
                <AnimatePresence>
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="bg-red-50 border border-red-200 rounded-xl p-4"
                  >
                    <div className="flex items-start gap-3">
                      <FiAlertCircle className="text-red-500 text-lg flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-red-800">Warning: This action cannot be undone!</p>
                        <p className="text-sm text-gray-600 mt-1">
                          Deleting your account will permanently remove all your data.
                        </p>
                        <div className="flex gap-3 mt-4">
                          <button
                            onClick={handleDeleteAccount}
                            disabled={loading}
                            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all text-sm"
                          >
                            <FiTrash2 className="h-4 w-4" />
                            {loading ? 'Deleting...' : 'Yes, Delete Account'}
                          </button>
                          <button
                            onClick={() => setShowDeleteConfirm(false)}
                            className="px-4 py-2 border border-gray-300 text-gray-600 rounded-xl hover:bg-gray-50 transition-all text-sm"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </AnimatePresence>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;