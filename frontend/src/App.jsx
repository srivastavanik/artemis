import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Prospects from './pages/Prospects'
import Campaigns from './pages/Campaigns'
import Analytics from './pages/Analytics'
import Settings from './pages/Settings'
import LiveDemo from './pages/LiveDemo'
import ConnectionTest from './components/ConnectionTest'

// Auth pages
import Login from './pages/auth/Login'
import Signup from './pages/auth/Signup'
import Onboarding from './pages/auth/Onboarding'
import AuthCallback from './pages/auth/AuthCallback'

function App() {
  const isDevelopment = import.meta.env.VITE_ENV === 'development' || import.meta.env.DEV;
  
  return (
    <AuthProvider>
      <Routes>
        {/* Auth Routes */}
        <Route path="/auth">
          <Route path="login" element={<Login />} />
          <Route path="signup" element={<Signup />} />
          <Route path="callback" element={<AuthCallback />} />
          <Route path="success" element={<AuthCallback />} />
          <Route path="error" element={<AuthCallback />} />
        </Route>
        
        {/* Onboarding Route */}
        <Route path="/onboarding" element={
          <ProtectedRoute requireWorkspace={false}>
            <Onboarding />
          </ProtectedRoute>
        } />
        
        {/* Protected App Routes */}
        <Route path="/" element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }>
          <Route index element={<Dashboard />} />
          <Route path="prospects" element={<Prospects />} />
          <Route path="campaigns" element={<Campaigns />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="settings" element={<Settings />} />
          <Route path="demo" element={<LiveDemo />} />
        </Route>
        
        {/* Redirect any unknown routes to dashboard */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      
      {isDevelopment && <ConnectionTest />}
    </AuthProvider>
  )
}

export default App
