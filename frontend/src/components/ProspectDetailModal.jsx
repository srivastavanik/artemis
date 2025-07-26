import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  X, 
  Building2, 
  User, 
  Mail, 
  Phone, 
  Globe, 
  MapPin,
  Linkedin,
  Calendar,
  DollarSign,
  Users,
  TrendingUp,
  Activity,
  FileText,
  ExternalLink,
  Download,
  MessageSquare,
  Zap
} from 'lucide-react'

const ProspectDetailModal = ({ prospect, onClose }) => {
  if (!prospect) return null

  const statusColors = {
    hot: { bg: 'bg-error/10', text: 'text-error', label: 'Hot Lead' },
    warm: { bg: 'bg-warning/10', text: 'text-warning', label: 'Warm Lead' },
    cold: { bg: 'bg-info/10', text: 'text-info', label: 'Cold Lead' },
    qualified: { bg: 'bg-success/10', text: 'text-success', label: 'Qualified' }
  }

  const statusConfig = statusColors[prospect.status] || statusColors.cold
  const scoreColor = prospect.score >= 80 ? 'text-success' : 
                    prospect.score >= 60 ? 'text-warning' : 'text-error'

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ type: 'spring', duration: 0.3 }}
          className="glass-card w-full max-w-4xl max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-border-primary">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center">
                <Building2 className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">{prospect.company}</h2>
                <p className="text-text-secondary">{prospect.industry} • {prospect.location}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-bg-glass transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-100px)]">
            <div className="grid grid-cols-3 gap-6">
              {/* Left Column - Contact & Company Info */}
              <div className="col-span-2 space-y-6">
                {/* Score and Status */}
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <TrendingUp className={`w-5 h-5 ${scoreColor}`} />
                    <span className={`text-2xl font-bold ${scoreColor}`}>{prospect.score}</span>
                    <span className="text-text-tertiary">/100</span>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusConfig.bg} ${statusConfig.text}`}>
                    {statusConfig.label}
                  </span>
                  <div className="flex-1 h-2 bg-bg-tertiary rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-primary to-accent"
                      initial={{ width: 0 }}
                      animate={{ width: `${prospect.score}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                    />
                  </div>
                </div>

                {/* Contact Information */}
                <div className="glass-card p-4">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <User className="w-4 h-4 text-primary" />
                    Contact Information
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{prospect.contact.name}</p>
                        <p className="text-sm text-text-tertiary">{prospect.contact.title}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <a
                          href={`mailto:${prospect.contact.email}`}
                          className="p-2 rounded-lg hover:bg-bg-glass transition-colors"
                          title="Send email"
                        >
                          <Mail className="w-4 h-4" />
                        </a>
                        <a
                          href={`tel:${prospect.contact.phone}`}
                          className="p-2 rounded-lg hover:bg-bg-glass transition-colors"
                          title="Call"
                        >
                          <Phone className="w-4 h-4" />
                        </a>
                        <a
                          href={`https://${prospect.contact.linkedin}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 rounded-lg hover:bg-bg-glass transition-colors"
                          title="View LinkedIn"
                        >
                          <Linkedin className="w-4 h-4" />
                        </a>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-text-tertiary">Email</p>
                        <p className="font-medium">{prospect.contact.email}</p>
                      </div>
                      <div>
                        <p className="text-text-tertiary">Phone</p>
                        <p className="font-medium">{prospect.contact.phone}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Company Details */}
                <div className="glass-card p-4">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-primary" />
                    Company Details
                  </h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-text-tertiary mb-1">Website</p>
                      <a
                        href={`https://${prospect.website}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-primary hover:text-primary-hover flex items-center gap-1"
                      >
                        {prospect.website}
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                    <div>
                      <p className="text-text-tertiary mb-1">Location</p>
                      <p className="font-medium flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {prospect.location}
                      </p>
                    </div>
                    <div>
                      <p className="text-text-tertiary mb-1">Employees</p>
                      <p className="font-medium flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {prospect.employees}
                      </p>
                    </div>
                    <div>
                      <p className="text-text-tertiary mb-1">Revenue</p>
                      <p className="font-medium flex items-center gap-1">
                        <DollarSign className="w-3 h-3" />
                        {prospect.revenue}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Enrichment Data */}
                {prospect.enrichmentData && (
                  <div className="glass-card p-4">
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                      <Zap className="w-4 h-4 text-primary" />
                      AI-Enriched Insights
                    </h3>
                    <div className="space-y-4">
                      {prospect.enrichmentData.technologies && (
                        <div>
                          <p className="text-sm text-text-tertiary mb-2">Technologies Used</p>
                          <div className="flex flex-wrap gap-2">
                            {prospect.enrichmentData.technologies.map((tech) => (
                              <span
                                key={tech}
                                className="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm"
                              >
                                {tech}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      {prospect.enrichmentData.fundingRound && (
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-text-tertiary">Funding Round</p>
                            <p className="font-medium">{prospect.enrichmentData.fundingRound}</p>
                          </div>
                          <div>
                            <p className="text-sm text-text-tertiary">Amount Raised</p>
                            <p className="font-medium">{prospect.enrichmentData.fundingAmount}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column - Activity & Actions */}
              <div className="space-y-6">
                {/* Quick Actions */}
                <div className="glass-card p-4">
                  <h3 className="font-semibold mb-4">Quick Actions</h3>
                  <div className="space-y-2">
                    <button className="btn btn-primary w-full">
                      <MessageSquare className="w-4 h-4" />
                      Start Campaign
                    </button>
                    <button className="btn btn-secondary w-full">
                      <Calendar className="w-4 h-4" />
                      Schedule Meeting
                    </button>
                    <button className="btn btn-secondary w-full">
                      <FileText className="w-4 h-4" />
                      Generate Report
                    </button>
                    <button className="btn btn-ghost w-full">
                      <Download className="w-4 h-4" />
                      Export Data
                    </button>
                  </div>
                </div>

                {/* Recent Activity */}
                <div className="glass-card p-4">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-primary" />
                    Recent Activity
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 rounded-full bg-success mt-1.5"></div>
                      <div className="flex-1">
                        <p className="text-sm">Email opened</p>
                        <p className="text-xs text-text-tertiary">2 hours ago</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 rounded-full bg-primary mt-1.5"></div>
                      <div className="flex-1">
                        <p className="text-sm">Link clicked</p>
                        <p className="text-xs text-text-tertiary">5 hours ago</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 rounded-full bg-warning mt-1.5"></div>
                      <div className="flex-1">
                        <p className="text-sm">Added to campaign</p>
                        <p className="text-xs text-text-tertiary">1 day ago</p>
                      </div>
                    </div>
                  </div>
                  <button className="text-xs text-primary hover:text-primary-hover mt-4">
                    View all activity →
                  </button>
                </div>

                {/* AI Recommendations */}
                <div className="glass-card p-4">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-accent" />
                    AI Recommendations
                  </h3>
                  <div className="space-y-3 text-sm">
                    <div className="p-3 rounded-lg bg-success/10 border border-success/20">
                      <p className="text-success font-medium">High engagement potential</p>
                      <p className="text-xs mt-1">Recent website activity suggests active buying interest</p>
                    </div>
                    <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
                      <p className="font-medium">Best outreach time</p>
                      <p className="text-xs mt-1">Tuesday-Thursday, 10 AM - 2 PM PST</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

export default ProspectDetailModal
