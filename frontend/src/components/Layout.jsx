import { Link, useLocation } from 'react-router-dom';

function Layout({ children }) {
  const location = useLocation();
  
  const navigation = [
    { name: 'Dashboard', href: '/dashboard' },
    { name: 'Prospects', href: '/prospects' },
    { name: 'Campaigns', href: '/campaigns' },
    { name: 'Analytics', href: '/analytics' },
    { name: 'Settings', href: '/settings' }
  ];
  
  return (
    <div className="min-h-screen bg-[#0a0a0a] grid-pattern">
      {/* Header */}
      <header className="glass border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold gradient-text">ARTEMIS</h1>
            </div>
            <nav className="flex space-x-1">
              {navigation.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`nav-item ${isActive ? 'nav-item-active' : ''}`}
                  >
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="page-container">
        {children}
      </main>
    </div>
  );
}

export default Layout;
