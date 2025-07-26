import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Layout = ({ children }) => {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const navigation = [
    { name: 'Dashboard', href: '/dashboard' },
    { name: 'Prospects', href: '/prospects' },
    { name: 'Campaigns', href: '/campaigns' },
    { name: 'Analytics', href: '/analytics' },
    { name: 'Settings', href: '/settings' }
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Navigation */}
      <nav className="border-b border-gray-800">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-8">
              <Link to="/dashboard" className="text-xl font-medium tracking-tight">
                ARTEMIS
              </Link>
              <div className="hidden md:flex space-x-1">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`px-4 py-2 text-sm rounded-md transition-all ${
                      isActive(item.href)
                        ? 'bg-gray-900 text-white'
                        : 'text-gray-400 hover:text-white hover:bg-gray-900/50'
                    }`}
                  >
                    {item.name}
                  </Link>
                ))}
              </div>
            </div>

            {/* User Menu */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-3 text-sm hover:text-gray-300 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
                  {user?.user_metadata?.name?.charAt(0)?.toUpperCase() || 
                   user?.email?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <span className="hidden md:block font-light">
                  {user?.user_metadata?.name || user?.email?.split('@')[0]}
                </span>
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-gray-900 border border-gray-800 rounded-lg shadow-lg py-2 z-50">
                  <Link
                    to="/settings"
                    className="block px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-800 transition-colors"
                    onClick={() => setShowUserMenu(false)}
                  >
                    Settings
                  </Link>
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      handleSignOut();
                    }}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-800 transition-colors"
                  >
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Status Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-gray-900/80 backdrop-blur-sm border-t border-gray-800">
        <div className="container mx-auto px-6 py-2">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-gray-400">4 AI Agents Active</span>
              </div>
              <div className="text-gray-500">|</div>
              <span className="text-gray-400">WebSocket Connected</span>
              <div className="text-gray-500">|</div>
              <span className="text-gray-400">Last sync: 2 min ago</span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-500">Powered by</span>
              <span className="text-gray-400">BrightData</span>
              <span className="text-gray-500">•</span>
              <span className="text-gray-400">LlamaIndex</span>
              <span className="text-gray-500">•</span>
              <span className="text-gray-400">Arcade</span>
              <span className="text-gray-500">•</span>
              <span className="text-gray-400">Mastra</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Layout;
