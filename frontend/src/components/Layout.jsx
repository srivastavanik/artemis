import React from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';

const Layout = () => {
  const location = useLocation();

  const isActive = (path) => {
    if (path === '/app' && location.pathname === '/app') return true;
    if (path !== '/app' && location.pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <div className="min-h-screen bg-black text-white font-light">
      {/* Navigation */}
      <nav className="border-b border-gray-800">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link to="/app" className="text-xl tracking-tight font-medium">
              ARTEMIS
            </Link>
            
            <div className="hidden md:flex items-center space-x-10 text-sm">
              <Link 
                to="/app" 
                className={`transition-colors ${isActive('/app') && location.pathname === '/app' ? 'text-indigo-400' : 'hover:text-indigo-300'}`}
              >
                Dashboard
              </Link>
              <Link 
                to="/app/prospects" 
                className={`transition-colors ${isActive('/app/prospects') ? 'text-indigo-400' : 'hover:text-indigo-300'}`}
              >
                Prospects
              </Link>
              <Link 
                to="/app/campaigns" 
                className={`transition-colors ${isActive('/app/campaigns') ? 'text-indigo-400' : 'hover:text-indigo-300'}`}
              >
                Campaigns
              </Link>
              <Link 
                to="/app/analytics" 
                className={`transition-colors ${isActive('/app/analytics') ? 'text-indigo-400' : 'hover:text-indigo-300'}`}
              >
                Analytics
              </Link>
              <Link 
                to="/app/demo" 
                className={`transition-colors ${isActive('/app/demo') ? 'text-indigo-400' : 'hover:text-indigo-300'}`}
              >
                Live Demo
              </Link>
            </div>

            <div className="flex items-center space-x-4">
              <Link 
                to="/app/settings" 
                className="text-sm hover:text-indigo-300 transition-colors"
              >
                Settings
              </Link>
              <Link
                to="/"
                className="text-sm border border-indigo-500/30 rounded-md px-4 py-2 hover:bg-indigo-500/10 transition-all"
              >
                Home
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
