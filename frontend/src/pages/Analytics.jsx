import React from 'react'
import { motion } from 'framer-motion'
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Mail, 
  Target,
  Calendar,
  Download,
  Filter
} from 'lucide-react'
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend
} from 'recharts'

// Mock data
const performanceData = [
  { month: 'Jan', prospects: 120, campaigns: 12, conversions: 8 },
  { month: 'Feb', prospects: 150, campaigns: 15, conversions: 12 },
  { month: 'Mar', prospects: 180, campaigns: 18, conversions: 15 },
  { month: 'Apr', prospects: 220, campaigns: 22, conversions: 18 },
  { month: 'May', prospects: 280, campaigns: 25, conversions: 24 },
  { month: 'Jun', prospects: 342, campaigns: 28, conversions: 32 }
]

const channelData = [
  { channel: 'Email', value: 45, color: '#6366f1' },
  { channel: 'LinkedIn', value: 30, color: '#8b5cf6' },
  { channel: 'Phone', value: 15, color: '#a78bfa' },
  { channel: 'Other', value: 10, color: '#c4b5fd' }
]

const industryData = [
  { industry: 'Technology', prospects: 145, conversion: 12 },
  { industry: 'Healthcare', prospects: 89, conversion: 8 },
  { industry: 'Finance', prospects: 76, conversion: 10 },
  { industry: 'Retail', prospects: 54, conversion: 6 },
  { industry: 'Manufacturing', prospects: 32, conversion: 4 }
]

const agentPerformance = [
  { subject: 'Scout', A: 92, fullMark: 100 },
  { subject: 'Analyst', A: 88, fullMark: 100 },
  { subject: 'Strategist', A: 85, fullMark: 100 },
  { subject: 'Executor', A: 90, fullMark: 100 }
]

const Analytics = () => {
  const [dateRange, setDateRange] = React.useState('month')

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Analytics</h1>
          <p className="text-text-secondary mt-2">
            Track performance and gain insights into your sales operations.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="select"
          >
            <option value="week">Last 7 days</option>
            <option value="month">Last 30 days</option>
            <option value="quarter">Last 3 months</option>
            <option value="year">Last year</option>
          </select>
          
          <button className="btn btn-secondary">
            <Filter className="w-4 h-4" />
            Filters
          </button>
          
          <button className="btn btn-primary">
            <Download className="w-4 h-4" />
            Export Report
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-4 gap-4">
        <div className="glass-card p-4">
          <div className="flex items-center justify-between mb-2">
            <Users className="w-5 h-5 text-primary" />
            <span className="text-xs text-success">+12.5%</span>
          </div>
          <p className="text-2xl font-bold">1,247</p>
          <p className="text-sm text-text-secondary">Total Prospects</p>
        </div>
        
        <div className="glass-card p-4">
          <div className="flex items-center justify-between mb-2">
            <Mail className="w-5 h-5 text-accent" />
            <span className="text-xs text-success">+8.3%</span>
          </div>
          <p className="text-2xl font-bold">3,842</p>
          <p className="text-sm text-text-secondary">Messages Sent</p>
        </div>
        
        <div className="glass-card p-4">
          <div className="flex items-center justify-between mb-2">
            <Target className="w-5 h-5 text-warning" />
            <span className="text-xs text-success">+15.7%</span>
          </div>
          <p className="text-2xl font-bold">68%</p>
          <p className="text-sm text-text-secondary">Avg Open Rate</p>
        </div>
        
        <div className="glass-card p-4">
          <div className="flex items-center justify-between mb-2">
            <TrendingUp className="w-5 h-5 text-success" />
            <span className="text-xs text-success">+22.4%</span>
          </div>
          <p className="text-2xl font-bold">4.8%</p>
          <p className="text-sm text-text-secondary">Conversion Rate</p>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-3 gap-6">
        {/* Performance Trend */}
        <div className="glass-card col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold">Performance Trend</h3>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-primary"></div>
                <span className="text-text-secondary">Prospects</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-accent"></div>
                <span className="text-text-secondary">Campaigns</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-success"></div>
                <span className="text-text-secondary">Conversions</span>
              </div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={performanceData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="month" stroke="#71717a" />
              <YAxis stroke="#71717a" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(20, 20, 20, 0.9)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px'
                }}
              />
              <Line 
                type="monotone" 
                dataKey="prospects" 
                stroke="#6366f1" 
                strokeWidth={2}
                dot={{ fill: '#6366f1', r: 4 }}
              />
              <Line 
                type="monotone" 
                dataKey="campaigns" 
                stroke="#a78bfa" 
                strokeWidth={2}
                dot={{ fill: '#a78bfa', r: 4 }}
              />
              <Line 
                type="monotone" 
                dataKey="conversions" 
                stroke="#10b981" 
                strokeWidth={2}
                dot={{ fill: '#10b981', r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Channel Distribution */}
        <div className="glass-card">
          <h3 className="text-lg font-semibold mb-6">Channel Distribution</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={channelData}
                cx="50%"
                cy="50%"
                outerRadius={80}
                dataKey="value"
                label={({ value }) => `${value}%`}
              >
                {channelData.map((entry, index) => (
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
          <div className="space-y-2 mt-4">
            {channelData.map((channel) => (
              <div key={channel.channel} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: channel.color }} />
                  <span className="text-text-secondary">{channel.channel}</span>
                </div>
                <span className="font-medium">{channel.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-2 gap-6">
        {/* Industry Performance */}
        <div className="glass-card">
          <h3 className="text-lg font-semibold mb-6">Industry Performance</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={industryData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="industry" stroke="#71717a" />
              <YAxis stroke="#71717a" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(20, 20, 20, 0.9)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px'
                }}
              />
              <Bar dataKey="prospects" fill="#6366f1" radius={[8, 8, 0, 0]} />
              <Bar dataKey="conversion" fill="#10b981" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* AI Agent Performance */}
        <div className="glass-card">
          <h3 className="text-lg font-semibold mb-6">AI Agent Performance</h3>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={agentPerformance}>
              <PolarGrid stroke="rgba(255,255,255,0.1)" />
              <PolarAngleAxis dataKey="subject" stroke="#71717a" />
              <PolarRadiusAxis angle={90} domain={[0, 100]} stroke="#71717a" />
              <Radar 
                name="Performance" 
                dataKey="A" 
                stroke="#6366f1" 
                fill="#6366f1" 
                fillOpacity={0.3} 
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(20, 20, 20, 0.9)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px'
                }}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </motion.div>
  )
}

export default Analytics
