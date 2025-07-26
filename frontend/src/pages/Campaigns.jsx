import React from 'react'
import { motion } from 'framer-motion'
import { Mail, Plus, Play, Pause, BarChart3, Calendar, Target, Users } from 'lucide-react'

const Campaigns = () => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Campaigns</h1>
          <p className="text-text-secondary mt-2">
            Orchestrate multi-channel outreach campaigns powered by AI agents.
          </p>
        </div>
        
        <button className="btn btn-primary">
          <Plus className="w-4 h-4" />
          Create Campaign
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="glass-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-secondary">Active Campaigns</p>
              <p className="text-2xl font-bold mt-1">8</p>
            </div>
            <Play className="w-8 h-8 text-success opacity-50" />
          </div>
        </div>
        
        <div className="glass-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-secondary">Total Recipients</p>
              <p className="text-2xl font-bold mt-1">342</p>
            </div>
            <Users className="w-8 h-8 text-primary opacity-50" />
          </div>
        </div>
        
        <div className="glass-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-secondary">Avg Open Rate</p>
              <p className="text-2xl font-bold mt-1">68%</p>
            </div>
            <Mail className="w-8 h-8 text-accent opacity-50" />
          </div>
        </div>
        
        <div className="glass-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-secondary">Conversions</p>
              <p className="text-2xl font-bold mt-1">47</p>
            </div>
            <Target className="w-8 h-8 text-warning opacity-50" />
          </div>
        </div>
      </div>

      {/* Campaign List */}
      <div className="glass-card">
        <div className="p-6 text-center">
          <Mail className="w-12 h-12 text-text-tertiary mx-auto mb-4" />
          <p className="text-lg font-medium text-text-secondary">Campaign management coming soon</p>
          <p className="text-sm text-text-tertiary mt-2">
            Create and manage AI-powered multi-channel campaigns
          </p>
        </div>
      </div>
    </motion.div>
  )
}

export default Campaigns
