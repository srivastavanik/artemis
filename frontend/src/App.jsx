import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Prospects from './pages/Prospects'
import Campaigns from './pages/Campaigns'
import Analytics from './pages/Analytics'
import LiveDemo from './pages/LiveDemo'
import Settings from './pages/Settings'

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/prospects" element={<Prospects />} />
        <Route path="/campaigns" element={<Campaigns />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/demo" element={<LiveDemo />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </Layout>
  )
}

export default App
