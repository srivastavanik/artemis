import React from 'react'
import { motion } from 'framer-motion'
import { Building2, User, TrendingUp, Clock } from 'lucide-react'

const ProspectCard = ({ name, contact, score, status, lastActivity }) => {
  const statusColors = {
    hot: { bg: 'bg-error/10', text: 'text-error', label: 'Hot Lead' },
    warm: { bg: 'bg-warning/10', text: 'text-warning', label: 'Warm Lead' },
    cold: { bg: 'bg-info/10', text: 'text-info', label: 'Cold Lead' },
    qualified: { bg: 'bg-success/10', text: 'text-success', label: 'Qualified' }
  }

  const scoreColor = score >= 80 ? 'text-success' : score >= 60 ? 'text-warning' : 'text-error'
  const statusConfig = statusColors[status] || statusColors.cold

  return (
    <motion.div
      className="p-4 rounded-lg bg-bg-glass hover:bg-bg-glass-hover transition-all cursor-pointer border border-border-secondary hover:border-border-primary"
      whileHover={{ scale: 1.01 }}
      transition={{ type: 'spring', stiffness: 400 }}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Building2 className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h4 className="font-medium text-sm">{name}</h4>
            <div className="flex items-center gap-1 mt-0.5">
              <User className="w-3 h-3 text-text-tertiary" />
              <p className="text-xs text-text-tertiary">{contact}</p>
            </div>
          </div>
        </div>
        <div className={`px-2 py-1 rounded-full text-xs font-medium ${statusConfig.bg} ${statusConfig.text}`}>
          {statusConfig.label}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <TrendingUp className={`w-3 h-3 ${scoreColor}`} />
          <span className={`text-sm font-semibold ${scoreColor}`}>{score}</span>
          <span className="text-xs text-text-tertiary">/100</span>
        </div>
        
        <div className="flex items-center gap-1 text-xs text-text-tertiary">
          <Clock className="w-3 h-3" />
          <span>{lastActivity}</span>
        </div>
      </div>

      {/* Score Progress Bar */}
      <div className="mt-3 h-1 bg-bg-tertiary rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-primary to-accent"
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      </div>
    </motion.div>
  )
}

export default ProspectCard
