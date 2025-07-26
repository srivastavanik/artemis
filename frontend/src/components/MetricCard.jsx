import React from 'react'
import { motion } from 'framer-motion'
import { ArrowUpRight, ArrowDownRight } from 'lucide-react'

const MetricCard = ({ title, value, change, trend, icon: Icon, loading }) => {
  const isPositive = trend === 'up'
  const TrendIcon = isPositive ? ArrowUpRight : ArrowDownRight
  const changeColor = isPositive ? 'text-success' : 'text-error'
  const changePrefix = isPositive ? '+' : ''

  if (loading) {
    return (
      <div className="glass-card">
        <div className="flex items-center justify-between mb-4">
          <div className="skeleton h-4 w-24 rounded"></div>
          <div className="skeleton h-10 w-10 rounded-lg"></div>
        </div>
        <div className="skeleton h-8 w-32 rounded mb-2"></div>
        <div className="skeleton h-4 w-20 rounded"></div>
      </div>
    )
  }

  return (
    <motion.div
      className="glass-card group"
      whileHover={{ scale: 1.02 }}
      transition={{ type: 'spring', stiffness: 300 }}
    >
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-text-secondary">{title}</p>
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
          <Icon className="w-5 h-5 text-primary" />
        </div>
      </div>
      
      <div className="space-y-1">
        <h3 className="text-2xl font-bold">{value.toLocaleString()}</h3>
        <div className={`flex items-center gap-1 text-sm ${changeColor}`}>
          <TrendIcon className="w-4 h-4" />
          <span>{changePrefix}{Math.abs(change)}%</span>
          <span className="text-text-tertiary">vs last period</span>
        </div>
      </div>
    </motion.div>
  )
}

export default MetricCard
