import React from 'react'
import { motion } from 'framer-motion'
import { 
  Mail, 
  Link2, 
  MessageSquare, 
  Calendar, 
  FileText, 
  UserPlus,
  Activity
} from 'lucide-react'

const activities = [
  {
    id: 1,
    type: 'email',
    icon: Mail,
    color: 'text-primary',
    bg: 'bg-primary/10',
    title: 'Email sent to John Smith',
    description: 'Product demo follow-up email delivered',
    time: '2 minutes ago',
    user: 'Scout Agent'
  },
  {
    id: 2,
    type: 'link',
    icon: Link2,
    color: 'text-accent',
    bg: 'bg-accent/10',
    title: 'Link clicked by Sarah Johnson',
    description: 'Pricing page viewed for 3 minutes',
    time: '15 minutes ago',
    prospect: 'Innovation Labs'
  },
  {
    id: 3,
    type: 'reply',
    icon: MessageSquare,
    color: 'text-success',
    bg: 'bg-success/10',
    title: 'Reply received from Mike Chen',
    description: 'Interested in scheduling a demo',
    time: '1 hour ago',
    prospect: 'Growth Systems'
  },
  {
    id: 4,
    type: 'meeting',
    icon: Calendar,
    color: 'text-warning',
    bg: 'bg-warning/10',
    title: 'Meeting scheduled with TechCorp',
    description: 'Demo call on Monday at 2 PM PST',
    time: '2 hours ago',
    user: 'Executor Agent'
  },
  {
    id: 5,
    type: 'whitepaper',
    icon: FileText,
    color: 'text-info',
    bg: 'bg-info/10',
    title: 'Whitepaper downloaded',
    description: 'AI Sales Automation Guide downloaded by DataSync Inc.',
    time: '3 hours ago',
    prospect: 'DataSync Inc.'
  },
  {
    id: 6,
    type: 'prospect',
    icon: UserPlus,
    color: 'text-primary',
    bg: 'bg-primary/10',
    title: 'New prospect discovered',
    description: 'CloudTech Solutions added to pipeline',
    time: '4 hours ago',
    user: 'Scout Agent'
  }
]

const ActivityFeed = () => {
  return (
    <div className="glass-card">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold">Recent Activity</h3>
        <Activity className="w-5 h-5 text-primary" />
      </div>
      
      <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
        {activities.map((activity, index) => {
          const Icon = activity.icon
          
          return (
            <motion.div
              key={activity.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-start gap-3 p-3 rounded-lg hover:bg-bg-glass transition-colors"
            >
              <div className={`w-10 h-10 rounded-lg ${activity.bg} flex items-center justify-center flex-shrink-0`}>
                <Icon className={`w-5 h-5 ${activity.color}`} />
              </div>
              
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">{activity.title}</p>
                <p className="text-xs text-text-tertiary mt-0.5">{activity.description}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs text-text-muted">{activity.time}</span>
                  {activity.user && (
                    <>
                      <span className="text-xs text-text-muted">•</span>
                      <span className="text-xs text-primary">{activity.user}</span>
                    </>
                  )}
                  {activity.prospect && (
                    <>
                      <span className="text-xs text-text-muted">•</span>
                      <span className="text-xs text-accent">{activity.prospect}</span>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>
      
      <div className="mt-4 pt-4 border-t border-border-primary">
        <button className="btn btn-secondary w-full">
          View All Activity
        </button>
      </div>
    </div>
  )
}

export default ActivityFeed
