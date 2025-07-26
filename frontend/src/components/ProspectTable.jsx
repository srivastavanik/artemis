import React from 'react'
import { motion } from 'framer-motion'
import { 
  Building2, 
  User, 
  Mail, 
  Phone, 
  TrendingUp, 
  MoreVertical,
  ExternalLink,
  ChevronUp,
  ChevronDown
} from 'lucide-react'

const ProspectTable = ({ prospects, loading, onProspectClick }) => {
  const [sortField, setSortField] = React.useState('score')
  const [sortDirection, setSortDirection] = React.useState('desc')

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('desc')
    }
  }

  const sortedProspects = [...prospects].sort((a, b) => {
    let aValue = sortField === 'company' ? a.company :
                 sortField === 'contact' ? a.contact.name :
                 sortField === 'score' ? a.score :
                 sortField === 'status' ? a.status :
                 sortField === 'lastActivity' ? new Date(a.lastActivity) :
                 a[sortField]
    
    let bValue = sortField === 'company' ? b.company :
                 sortField === 'contact' ? b.contact.name :
                 sortField === 'score' ? b.score :
                 sortField === 'status' ? b.status :
                 sortField === 'lastActivity' ? new Date(b.lastActivity) :
                 b[sortField]

    if (sortDirection === 'asc') {
      return aValue > bValue ? 1 : -1
    } else {
      return aValue < bValue ? 1 : -1
    }
  })

  const statusColors = {
    hot: { bg: 'bg-error/10', text: 'text-error', label: 'Hot' },
    warm: { bg: 'bg-warning/10', text: 'text-warning', label: 'Warm' },
    cold: { bg: 'bg-info/10', text: 'text-info', label: 'Cold' },
    qualified: { bg: 'bg-success/10', text: 'text-success', label: 'Qualified' }
  }

  const SortIcon = ({ field }) => {
    if (sortField !== field) return null
    return sortDirection === 'asc' ? 
      <ChevronUp className="w-3 h-3" /> : 
      <ChevronDown className="w-3 h-3" />
  }

  if (loading) {
    return (
      <div className="glass-card">
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-4">
              <div className="skeleton h-10 w-10 rounded-lg"></div>
              <div className="flex-1 space-y-2">
                <div className="skeleton h-4 w-48 rounded"></div>
                <div className="skeleton h-3 w-32 rounded"></div>
              </div>
              <div className="skeleton h-6 w-20 rounded-full"></div>
              <div className="skeleton h-8 w-16 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="glass-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border-primary">
              <th className="text-left p-4">
                <button
                  onClick={() => handleSort('company')}
                  className="flex items-center gap-1 text-xs font-medium text-text-secondary hover:text-text-primary transition-colors"
                >
                  Company
                  <SortIcon field="company" />
                </button>
              </th>
              <th className="text-left p-4">
                <button
                  onClick={() => handleSort('contact')}
                  className="flex items-center gap-1 text-xs font-medium text-text-secondary hover:text-text-primary transition-colors"
                >
                  Contact
                  <SortIcon field="contact" />
                </button>
              </th>
              <th className="text-left p-4">
                <button
                  onClick={() => handleSort('score')}
                  className="flex items-center gap-1 text-xs font-medium text-text-secondary hover:text-text-primary transition-colors"
                >
                  Score
                  <SortIcon field="score" />
                </button>
              </th>
              <th className="text-left p-4">
                <button
                  onClick={() => handleSort('status')}
                  className="flex items-center gap-1 text-xs font-medium text-text-secondary hover:text-text-primary transition-colors"
                >
                  Status
                  <SortIcon field="status" />
                </button>
              </th>
              <th className="text-left p-4">
                <span className="text-xs font-medium text-text-secondary">Industry</span>
              </th>
              <th className="text-left p-4">
                <button
                  onClick={() => handleSort('lastActivity')}
                  className="flex items-center gap-1 text-xs font-medium text-text-secondary hover:text-text-primary transition-colors"
                >
                  Last Activity
                  <SortIcon field="lastActivity" />
                </button>
              </th>
              <th className="text-center p-4">
                <span className="text-xs font-medium text-text-secondary">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedProspects.map((prospect, index) => {
              const statusConfig = statusColors[prospect.status] || statusColors.cold
              const scoreColor = prospect.score >= 80 ? 'text-success' : 
                                prospect.score >= 60 ? 'text-warning' : 'text-error'
              
              return (
                <motion.tr
                  key={prospect.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="border-b border-border-secondary hover:bg-bg-glass transition-colors cursor-pointer"
                  onClick={() => onProspectClick(prospect)}
                >
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Building2 className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{prospect.company}</p>
                        <p className="text-xs text-text-tertiary">{prospect.location}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <div>
                      <p className="text-sm">{prospect.contact.name}</p>
                      <p className="text-xs text-text-tertiary">{prospect.contact.title}</p>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        <TrendingUp className={`w-4 h-4 ${scoreColor}`} />
                        <span className={`font-semibold ${scoreColor}`}>{prospect.score}</span>
                      </div>
                      <div className="w-16 h-1 bg-bg-tertiary rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-primary to-accent"
                          style={{ width: `${prospect.score}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusConfig.bg} ${statusConfig.text}`}>
                      {statusConfig.label}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className="text-sm text-text-secondary">{prospect.industry}</span>
                  </td>
                  <td className="p-4">
                    <span className="text-sm text-text-tertiary">{prospect.lastActivity}</span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          window.open(`https://${prospect.website}`, '_blank')
                        }}
                        className="p-1.5 rounded hover:bg-bg-glass transition-colors"
                        title="Visit website"
                      >
                        <ExternalLink className="w-4 h-4 text-text-secondary" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          window.location.href = `mailto:${prospect.contact.email}`
                        }}
                        className="p-1.5 rounded hover:bg-bg-glass transition-colors"
                        title="Send email"
                      >
                        <Mail className="w-4 h-4 text-text-secondary" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          // More actions menu
                        }}
                        className="p-1.5 rounded hover:bg-bg-glass transition-colors"
                      >
                        <MoreVertical className="w-4 h-4 text-text-secondary" />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              )
            })}
          </tbody>
        </table>
      </div>
      
      {prospects.length === 0 && (
        <div className="p-12 text-center">
          <Building2 className="w-12 h-12 text-text-tertiary mx-auto mb-4" />
          <p className="text-text-secondary">No prospects found</p>
          <p className="text-sm text-text-tertiary mt-1">Try adjusting your filters or search query</p>
        </div>
      )}
    </div>
  )
}

export default ProspectTable
