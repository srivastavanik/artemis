import { Link, useLocation } from 'react-router-dom';

function Layout({ children }) {
  const location = useLocation();
  
  const navigation = [
    { name: 'Dashboard', href: '/' },
    { name: 'Prospects', href: '/prospects' },
    { name: 'Campaigns', href: '/campaigns' },
    { name: 'Analytics', href: '/analytics' },
  ];
  
  const isActive = (path) => location.pathname === path;

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
          
          <div>
            <Link 
              to="/settings" 
              className="btn-secondary btn-sm"
            >
              Settings
            </Link>
          </div>
        </div>
      </nav>

      <div className="divider-horizontal"></div>

      {/* Main Content */}
      <main className="relative z-10">
        {children}
      </main>
    </div>
  );
}

export default Layout;
