import React from 'react'
import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Prospects from './pages/Prospects'
import Campaigns from './pages/Campaigns'
import Analytics from './pages/Analytics'
import Settings from './pages/Settings'
import LiveDemo from './pages/LiveDemo'
import ConnectionTest from './components/ConnectionTest'

function App() {
  const isDevelopment = import.meta.env.VITE_ENV === 'development' || import.meta.env.DEV;
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/prospects" element={<Prospects />} />
        <Route path="/campaigns" element={<Campaigns />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/demo" element={<LiveDemo />} />
      </Routes>
      
      {isDevelopment && <ConnectionTest />}
    </Layout>
  )
}

export default App
