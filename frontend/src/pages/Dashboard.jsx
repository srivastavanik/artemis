import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  TrendingUp, 
  Users, 
  Mail, 
  Target,
  Brain,
  Activity,
  Zap,
  AlertCircle,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react'
import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadialBarChart, RadialBar } from 'recharts'
import MetricCard from '../components/MetricCard'
import ActivityFeed from '../components/ActivityFeed'
import ProspectCard from '../components/ProspectCard'

// Mock data for charts
const conversionData = [
  { name: 'Mon', value: 24 },
  { name: 'Tue', value: 32 },
  { name: 'Wed', value: 28 },
  { name: 'Thu', value: 45 },
  { name: 'Fri', value: 38 },
  { name: 'Sat', value: 42 },
  { name: 'Sun', value: 35 }
]

const engagementData = [
  { name: 'Email Opens', value: 68, color: '#6366f1' },
  { name: 'Link Clicks', value: 45, color: '#a78bfa' },
  { name: 'Replies', value: 32, color: '#8b5cf6' },
  { name: 'Meetings', value: 18, color: '#7c3aed' }
]

const scoreDistribution = [
  { score: '90-100', count: 12, color: '#10b981' },
  { score: '70-89', count: 28, color: '#3b82f6' },
  { score: '50-69', count: 45, color: '#f59e0b' },
  { score: '30-49', count: 32, color: '#ef4444' },
  { score: '0-29', count: 18, color: '#6b7280' }
]

const Dashboard = () => {
  const [loading, setLoading] = useState(true)
  const [metrics, setMetrics] = useState({
    totalProspects: 0,
    activeProspects: 0,
    campaigns: 0,
    conversionRate: 0
  })

  useEffect(() => {
    // Simulate loading data
    setTimeout(() => {
      setMetrics({
        totalProspects: 1247,
        activeProspects: 342,
        campaigns: 18,
        conversionRate: 4.8
      })
      setLoading(false)
    }, 1000)
  }, [])

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1
    }
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Header */}
      <motion.div variants={itemVariants}>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-text-secondary mt-2">Welcome back! Here's your sales intelligence overview.</p>
      </motion.div>

      {/* Key Metrics */}
      <motion.div variants={itemVariants} className="grid grid-cols-4 gap-6">
        <MetricCard
          title="Total Prospects"
          value={metrics.totalProspects}
          change={12.5}
          trend="up"
          icon={Users}
          loading={loading}
        />
        <MetricCard
          title="Active Prospects"
          value={metrics.activeProspects}
          change={8.3}
          trend="up"
          icon={Target}
          loading={loading}
        />
        <MetricCard
          title="Running Campaigns"
          value={metrics.campaigns}
          change={-2.1}
          trend="down"
          icon={Mail}
          loading={loading}
        />
        <MetricCard
          title="Conversion Rate"
          value={`${metrics.conversionRate}%`}
          change={15.7}
          trend="up"
          icon={TrendingUp}
          loading={loading}
        />
      </motion.div>

      {/* Charts Row */}
      <motion.div variants={itemVariants} className="grid grid-cols-3 gap-6">
        {/* Conversion Trend */}
        <div className="glass-card col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold">Conversion Trend</h3>
            <div className="flex items-center gap-2">
              <span className="text-sm text-text-tertiary">Last 7 days</span>
              <TrendingUp className="w-4 h-4 text-success" />
            </div>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={conversionData}>
              <defs>
                <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="name" stroke="#71717a" />
              <YAxis stroke="#71717a" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(20, 20, 20, 0.9)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px'
                }}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#6366f1"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Engagement Breakdown */}
        <div className="glass-card">
          <h3 className="text-lg font-semibold mb-6">Engagement Breakdown</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={engagementData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {engagementData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(20, 20, 20, 0.9)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-4 space-y-2">
            {engagementData.map((item) => (
              <div key={item.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-text-secondary">{item.name}</span>
                </div>
                <span className="font-medium">{item.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* AI Insights & Score Distribution */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 gap-6">
        {/* AI Agent Activity */}
        <div className="glass-card">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold">AI Agent Activity</h3>
            <Brain className="w-5 h-5 text-primary" />
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg bg-bg-glass">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Zap className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Scout Agent</p>
                  <p className="text-xs text-text-tertiary">Discovered 47 new prospects</p>
                </div>
              </div>
              <span className="text-xs text-success">2m ago</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-bg-glass">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                  <Activity className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <p className="font-medium">Analyst Agent</p>
                  <p className="text-xs text-text-tertiary">Scored 125 prospects</p>
                </div>
              </div>
              <span className="text-xs text-success">15m ago</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-bg-glass">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-warning" />
                </div>
                <div>
                  <p className="font-medium">Strategist Agent</p>
                  <p className="text-xs text-text-tertiary">Created 3 campaigns</p>
                </div>
              </div>
              <span className="text-xs text-success">1h ago</span>
            </div>
          </div>
        </div>

        {/* Score Distribution */}
        <div className="glass-card">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold">Lead Score Distribution</h3>
            <Target className="w-5 h-5 text-primary" />
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={scoreDistribution}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="score" stroke="#71717a" />
              <YAxis stroke="#71717a" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(20, 20, 20, 0.9)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px'
                }}
              />
              <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                {scoreDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Recent Activity & Hot Prospects */}
      <motion.div variants={itemVariants} className="grid grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="col-span-2">
          <ActivityFeed />
        </div>

        {/* Hot Prospects */}
        <div className="glass-card">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold">Hot Prospects</h3>
            <button className="text-sm text-primary hover:text-primary-hover flex items-center gap-1">
              View all <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-3">
            <ProspectCard
              name="TechCorp Inc."
              contact="John Smith"
              score={92}
              status="hot"
              lastActivity="Opened email 2h ago"
            />
            <ProspectCard
              name="Innovation Labs"
              contact="Sarah Johnson"
              score={87}
              status="warm"
              lastActivity="Clicked link 5h ago"
            />
            <ProspectCard
              name="Growth Systems"
              contact="Mike Chen"
              score={85}
              status="warm"
              lastActivity="Downloaded whitepaper"
            />
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default Dashboard
