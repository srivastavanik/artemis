import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import Dashboard from './pages/Dashboard'
import Prospects from './pages/Prospects'
import Campaigns from './pages/Campaigns'
import Analytics from './pages/Analytics'
import Settings from './pages/Settings'
import LiveDemo from './pages/LiveDemo'

function App() {
  return (
    <Routes>
      {/* Public Home Page */}
      <Route path="/" element={<Home />} />
      
      {/* All App Routes - No Auth Required */}
      <Route path="/app" element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="prospects" element={<Prospects />} />
        <Route path="campaigns" element={<Campaigns />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="settings" element={<Settings />} />
        <Route path="demo" element={<LiveDemo />} />
      </Route>
      
      {/* Direct access routes */}
      <Route path="/dashboard" element={<Navigate to="/app" replace />} />
      <Route path="/prospects" element={<Navigate to="/app/prospects" replace />} />
      <Route path="/campaigns" element={<Navigate to="/app/campaigns" replace />} />
      <Route path="/analytics" element={<Navigate to="/app/analytics" replace />} />
      <Route path="/demo" element={<Navigate to="/app/demo" replace />} />
      
      {/* Redirect any unknown routes to dashboard */}
      <Route path="*" element={<Navigate to="/app" replace />} />
    </Routes>
  )
}

export default App
