import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  ArrowRightOnRectangleIcon,
  UserCircleIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline';

function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  
  const navigation = [
    { name: 'Dashboard', href: '/' },
    { name: 'Prospects', href: '/prospects' },
    { name: 'Campaigns', href: '/campaigns' },
    { name: 'Analytics', href: '/analytics' },
  ];
  
  const isActive = (path) => location.pathname === path;

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth/login');
  };

  return (
    <div className="min-h-screen bg-black text-white relative">
      {/* Navigation */}
      <nav className="container mx-auto px-6 py-6 relative z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <svg className="h-8 w-8 text-indigo-400" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span className="ml-3 text-xl tracking-tight font-medium">ARTEMIS</span>
          </div>
          
          <div className="hidden md:flex space-x-10">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`nav-item ${isActive(item.href) ? 'nav-item-active' : ''}`}
              >
                {item.name}
              </Link>
            ))}
          </div>
          
          <div className="flex items-center gap-4">
            <Link 
              to="/settings" 
              className="btn-secondary btn-sm"
            >
              Settings
            </Link>

            {/* User Menu */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-900/50 hover:bg-gray-800/50 transition-colors"
              >
                {user?.avatar_url ? (
                  <img 
                    src={user.avatar_url} 
                    alt={user.full_name} 
                    className="w-8 h-8 rounded-full"
                  />
                ) : (
                  <UserCircleIcon className="w-8 h-8 text-gray-400" />
                )}
                <span className="text-sm font-medium">{user?.full_name || user?.email}</span>
                <ChevronDownIcon className="w-4 h-4 text-gray-400" />
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-gray-900 border border-gray-800 rounded-lg shadow-lg z-50">
                  <div className="px-4 py-3 border-b border-gray-800">
                    <p className="text-sm font-medium">{user?.full_name}</p>
                    <p className="text-xs text-gray-400">{user?.email}</p>
                    {user?.workspaces && (
                      <p className="text-xs text-gray-500 mt-1">{user.workspaces.name}</p>
                    )}
                  </div>

                  <div className="py-1">
                    <Link
                      to="/settings"
                      onClick={() => setShowUserMenu(false)}
                      className="flex items-center px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
                    >
                      Account Settings
                    </Link>
                    
                    {user?.role === 'owner' && (
                      <Link
                        to="/settings/team"
                        onClick={() => setShowUserMenu(false)}
                        className="flex items-center px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
                      >
                        Team Management
                      </Link>
                    )}
                  </div>

                  <div className="border-t border-gray-800">
                    <button
                      onClick={handleSignOut}
                      className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
                    >
                      <ArrowRightOnRectangleIcon className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      <div className="divider-horizontal"></div>

      {/* Main Content */}
      <main className="relative z-10">
        <Outlet />
      </main>

      {/* Click outside to close user menu */}
      {showUserMenu && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowUserMenu(false)}
        />
      )}
    </div>
  );
}

export default Layout;
