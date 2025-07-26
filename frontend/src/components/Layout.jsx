import React, { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard,
  Users,
  Mail,
  BarChart3,
  Play,
  Settings,
  Sparkles,
  Menu,
  X,
  Search,
  Bell,
  Bot
} from 'lucide-react'

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/prospects', label: 'Prospects', icon: Users },
  { path: '/campaigns', label: 'Campaigns', icon: Mail },
  { path: '/analytics', label: 'Analytics', icon: BarChart3 },
  { path: '/demo', label: 'Live Demo', icon: Play },
  { path: '/settings', label: 'Settings', icon: Settings }
]

const Layout = ({ children }) => {
  const location = useLocation()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  const isActive = (path) => location.pathname === path

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.aside
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed left-0 top-0 h-full w-64 z-20"
          >
            <div className="h-full glass-card rounded-none border-l-0 border-t-0 border-b-0">
              {/* Logo */}
              <div className="p-6 border-b border-border-primary">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                      <Sparkles className="w-6 h-6 text-white" />
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-success rounded-full pulse"></div>
                  </div>
                  <div>
                    <h1 className="text-xl font-bold bg-gradient-to-r from-primary-light to-accent bg-clip-text text-transparent">
                      ARTEMIS
                    </h1>
                    <p className="text-xs text-text-tertiary">AI Sales Intelligence</p>
                  </div>
                </div>
              </div>

              {/* Navigation */}
              <nav className="p-4">
                <ul className="space-y-2">
                  {navItems.map((item) => {
                    const Icon = item.icon
                    const active = isActive(item.path)
                    
                    return (
                      <li key={item.path}>
                        <Link
                          to={item.path}
                          className={`
                            flex items-center gap-3 px-4 py-3 rounded-lg
                            transition-all duration-200 group relative
                            ${active 
                              ? 'bg-primary/10 text-primary border border-primary/20' 
                              : 'hover:bg-bg-glass hover:text-text-primary text-text-secondary'
                            }
                          `}
                        >
                          <Icon className={`w-5 h-5 ${active ? 'text-primary' : 'group-hover:text-primary'}`} />
                          <span className="font-medium">{item.label}</span>
                          
                          {active && (
                            <motion.div
                              layoutId="activeNav"
                              className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-primary to-accent rounded-r-full"
                              initial={false}
                              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                            />
                          )}
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              </nav>

              {/* AI Agent Status */}
              <div className="absolute bottom-6 left-6 right-6">
                <div className="glass-card p-4">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Bot className="w-8 h-8 text-primary" />
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-success rounded-full pulse"></div>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">AI Agents Active</p>
                      <p className="text-xs text-text-tertiary">4 agents running</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className={`flex-1 ${sidebarOpen ? 'ml-64' : 'ml-0'} transition-all duration-300`}>
        {/* Header */}
        <header className="glass sticky top-0 z-10 border-b border-border-primary">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="btn-ghost p-2 rounded-lg"
                >
                  {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>
                
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
                  <input
                    type="text"
                    placeholder="Search prospects, campaigns..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="input pl-10 w-96"
                  />
                </div>
              </div>

              <div className="flex items-center gap-4">
                {/* Notifications */}
                <button className="btn-ghost p-2 rounded-lg relative">
                  <Bell className="w-5 h-5" />
                  <span className="absolute top-1 right-1 w-2 h-2 bg-error rounded-full"></span>
                </button>

                {/* User Profile */}
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-sm font-medium">Admin User</p>
                    <p className="text-xs text-text-tertiary">admin@artemis.ai</p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                    <span className="text-white font-bold">A</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  )
}

export default Layout
