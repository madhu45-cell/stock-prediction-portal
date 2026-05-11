import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  FiUser, 
  FiLogOut, 
  FiTrendingUp, 
  FiMenu, 
  FiX,
  FiHome,
  FiBarChart2,
  FiActivity,
  FiStar,
  FiBell,
  FiSearch,
  FiChevronDown,
  FiBookOpen,
  FiZap,
  FiCpu
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [hoveredItem, setHoveredItem] = useState(null);

  // Navigation items with AI-inspired colors
  const navItems = [
    { path: '/dashboard', name: 'Dashboard', icon: FiHome, color: '#3b82f6', glow: 'shadow-blue-400' },
    { path: '/stocks', name: 'Stocks', icon: FiBarChart2, color: '#10b981', glow: 'shadow-emerald-400' },
    { path: '/predictions', name: 'Predictions', icon: FiCpu, color: '#8b5cf6', glow: 'shadow-purple-400' },
    { path: '/watchlist', name: 'Watchlist', icon: FiStar, color: '#f59e0b', glow: 'shadow-amber-400' },
    { path: '/news', name: 'News', icon: FiBookOpen, color: '#ec4899', glow: 'shadow-pink-400' },
  ];

  useEffect(() => {
    if (isAuthenticated) {
      setNotifications([
        { id: 1, message: '🎯 AI predicts AAPL to rise 5.2%', time: '5 min ago', read: false },
        { id: 2, message: '📊 New market analysis available', time: '1 hour ago', read: false },
        { id: 3, message: '🤖 ML model updated for better accuracy', time: '3 hours ago', read: true },
      ]);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
    toast.success('Logged out successfully');
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/stocks?search=${searchQuery}`);
      setSearchQuery('');
    }
  };

  const handleNavigation = (path) => {
    navigate(path);
    setIsMobileMenuOpen(false);
    setShowUserDropdown(false);
    setShowNotifications(false);
  };

  if (!isAuthenticated) return null;

  return (
    <>
      <nav className={`fixed top-0 w-full z-50 transition-all duration-500 ${
        scrolled 
          ? 'bg-gradient-to-r from-slate-900/95 via-slate-800/95 to-slate-900/95 backdrop-blur-xl shadow-2xl border-b border-white/10' 
          : 'bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 shadow-lg'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            
            {/* Logo with AI Glow */}
            <div className="flex items-center">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link 
                  to="/dashboard" 
                  className="flex items-center space-x-2 group"
                  onClick={() => handleNavigation('/dashboard')}
                >
                  <div className="relative">
                    <motion.div 
                      className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full blur-md opacity-75"
                      animate={{ 
                        scale: [1, 1.2, 1],
                        opacity: [0.5, 1, 0.5]
                      }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                    <FiTrendingUp className="relative h-5 w-5 text-transparent bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text" />
                  </div>
                  <span className="font-bold text-lg bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                    StockAI
                  </span>
                </Link>
              </motion.div>
              
              {/* Desktop Navigation */}
              <div className="hidden md:flex ml-8 space-x-1">
                {navItems.map((item) => {
                  const isActive = location.pathname === item.path;
                  const isHovered = hoveredItem === item.path;
                  return (
                    <motion.button
                      key={item.path}
                      onMouseEnter={() => setHoveredItem(item.path)}
                      onMouseLeave={() => setHoveredItem(null)}
                      onClick={() => handleNavigation(item.path)}
                      className={`relative px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-300 overflow-hidden group ${
                        isActive
                          ? 'text-white'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      <span className="relative z-10 flex items-center gap-1.5">
                        <item.icon className="h-3.5 w-3.5" />
                        {item.name}
                      </span>
                      {(isActive || isHovered) && (
                        <motion.div
                          layoutId="activeNav"
                          className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ type: "spring", duration: 0.5 }}
                        />
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </div>

            {/* Search Bar - Glass Effect */}
            <div className="hidden md:flex items-center flex-1 max-w-sm mx-8">
              <form onSubmit={handleSearch} className="w-full">
                <div className="relative group">
                  <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4 group-hover:text-blue-400 transition-colors" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search stocks..."
                    className="w-full pl-9 pr-3 py-1.5 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-gray-200 placeholder-gray-500 transition-all group-hover:border-white/20"
                  />
                </div>
              </form>
            </div>

            {/* Right Actions */}
            <div className="flex items-center space-x-2">
              
              {/* Notifications with Pulse Effect */}
              <div className="relative">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-all"
                >
                  <FiBell className="h-5 w-5" />
                  {notifications.filter(n => !n.read).length > 0 && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ repeat: Infinity, duration: 1.5 }}
                      className="absolute -top-0.5 -right-0.5 h-2 w-2 bg-red-500 rounded-full"
                    />
                  )}
                </motion.button>
                
                <AnimatePresence>
                  {showNotifications && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute right-0 mt-2 w-80 bg-slate-800 rounded-xl shadow-2xl border border-white/10 z-50 overflow-hidden"
                    >
                      <div className="p-3 border-b border-white/10 bg-gradient-to-r from-blue-600/20 to-purple-600/20">
                        <h3 className="font-medium text-white">Notifications</h3>
                      </div>
                      <div className="max-h-80 overflow-y-auto">
                        {notifications.map((notif) => (
                          <div key={notif.id} className="p-3 hover:bg-white/5 border-b border-white/5 cursor-pointer transition-colors">
                            <p className="text-sm text-gray-300">{notif.message}</p>
                            <p className="text-xs text-gray-500 mt-1">{notif.time}</p>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* User Dropdown with Glowing Avatar */}
              <div className="relative">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowUserDropdown(!showUserDropdown)}
                  className="flex items-center space-x-2 text-gray-300 hover:text-white focus:outline-none group"
                >
                  <div className="relative">
                    <motion.div 
                      className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full blur-sm"
                      animate={{ 
                        scale: [1, 1.1, 1],
                        opacity: [0.5, 1, 0.5]
                      }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                    <div className="relative w-7 h-7 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-medium shadow-lg">
                      {user?.username?.[0]?.toUpperCase() || 'U'}
                    </div>
                  </div>
                  <span className="hidden md:block text-sm font-medium">
                    {user?.username || user?.email?.split('@')[0]}
                  </span>
                  <FiChevronDown className="hidden md:block h-3 w-3 text-gray-500 group-hover:text-blue-400 transition-colors" />
                </motion.button>
                
                <AnimatePresence>
                  {showUserDropdown && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute right-0 mt-2 w-56 bg-slate-800 rounded-xl shadow-2xl py-1 z-10 border border-white/10 overflow-hidden"
                    >
                      <div className="px-4 py-3 border-b border-white/10 bg-gradient-to-r from-blue-600/10 to-purple-600/10">
                        <p className="text-sm font-medium text-white">{user?.full_name || user?.username}</p>
                        <p className="text-xs text-gray-400">{user?.email}</p>
                      </div>
                      <button onClick={() => handleNavigation('/profile')} className="block w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-colors">
                        <FiUser className="inline mr-2 h-4 w-4" /> Profile
                      </button>
                      <hr className="my-1 border-white/10" />
                      <button onClick={handleLogout} className="block w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors">
                        <FiLogOut className="inline mr-2 h-4 w-4" /> Logout
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Mobile menu button */}
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-all"
              >
                {isMobileMenuOpen ? <FiX className="h-5 w-5" /> : <FiMenu className="h-5 w-5" />}
              </motion.button>
            </div>
          </div>
        </div>

        {/* Mobile Menu with Glass Effect */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-slate-900/95 backdrop-blur-xl border-t border-white/10 shadow-2xl overflow-hidden"
            >
              <div className="px-3 py-2 space-y-1">
                {navItems.map((item, idx) => (
                  <motion.button
                    key={item.path}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    onClick={() => handleNavigation(item.path)}
                    className={`flex items-center w-full px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      location.pathname === item.path
                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                        : 'text-gray-300 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <item.icon className="h-4 w-4 mr-3" />
                    {item.name}
                  </motion.button>
                ))}
                <div className="border-t border-white/10 my-2"></div>
                <motion.button
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                  onClick={() => handleNavigation('/profile')}
                  className="flex items-center w-full px-3 py-2 rounded-lg text-sm font-medium text-gray-300 hover:bg-white/10 hover:text-white"
                >
                  <FiUser className="h-4 w-4 mr-3" />
                  Profile
                </motion.button>
                <motion.button
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.35 }}
                  onClick={handleLogout}
                  className="flex items-center w-full px-3 py-2 rounded-lg text-sm font-medium text-red-400 hover:bg-red-500/10 hover:text-red-300"
                >
                  <FiLogOut className="h-4 w-4 mr-3" />
                  Logout
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Spacer */}
      <div className="h-14"></div>

      {/* AI Glow Effect at Bottom */}
      <div className="fixed bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-50 z-50"></div>
    </>
  );
};

export default Navbar;