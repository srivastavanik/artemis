import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Layout = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  const isActive = (path) => location.pathname === path;

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white font-light">
      {/* Navigation */}
      <nav className="border-b border-gray-800">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link to="/dashboard" className="text-xl tracking-tight font-medium">
              ARTEMIS
            </Link>
            
            <div className="hidden md:flex items-center space-x-10 text-sm">
              <Link 
                to="/dashboard" 
                className={`transition-colors ${isActive('/dashboard') ? 'text-indigo-400' : 'hover:text-indigo-300'}`}
              >
                Dashboard
              </Link>
              <Link 
                to="/prospects" 
                className={`transition-colors ${isActive('/prospects') ? 'text-indigo-400' : 'hover:text-indigo-300'}`}
              >
                Prospects
              </Link>
              <Link 
                to="/campaigns" 
                className={`transition-colors ${isActive('/campaigns') ? 'text-indigo-400' : 'hover:text-indigo-300'}`}
              >
                Campaigns
              </Link>
              <Link 
                to="/analytics" 
                className={`transition-colors ${isActive('/analytics') ? 'text-indigo-400' : 'hover:text-indigo-300'}`}
              >
                Analytics
              </Link>
            </div>

            <div className="flex items-center space-x-4">
              <Link 
                to="/settings" 
                className="text-sm hover:text-indigo-300 transition-colors"
              >
                Settings
              </Link>
              <button
                onClick={handleSignOut}
                className="text-sm border border-indigo-500/30 rounded-md px-4 py-2 hover:bg-indigo-500/10 transition-all"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
};

export default Layout;
