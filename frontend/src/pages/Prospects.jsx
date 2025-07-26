import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Search, 
  Filter, 
  Plus, 
  Download, 
  Upload,
  Building2,
  User,
  Mail,
  Phone,
  Globe,
  MapPin,
  Calendar,
  TrendingUp,
  MoreVertical,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react'
import ProspectTable from '../components/ProspectTable'
import ProspectFilters from '../components/ProspectFilters'
import ProspectDetailModal from '../components/ProspectDetailModal'

const Prospects = () => {
  const [prospects, setProspects] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedProspect, setSelectedProspect] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState({
    status: 'all',
    scoreRange: 'all',
    industry: 'all',
    dateRange: 'all'
  })
  const [showDetailModal, setShowDetailModal] = useState(false)

  useEffect(() => {
    // Simulate loading prospects
    setTimeout(() => {
      setProspects([
        {
          id: 1,
          company: 'TechCorp Inc.',
          contact: {
            name: 'John Smith',
            title: 'VP of Sales',
            email: 'john.smith@techcorp.com',
            phone: '+1 (555) 123-4567',
            linkedin: 'linkedin.com/in/johnsmith'
          },
          score: 92,
          status: 'hot',
          industry: 'Technology',
          location: 'San Francisco, CA',
          employees: '500-1000',
          revenue: '$50M-$100M',
          lastActivity: '2 hours ago',
          website: 'techcorp.com',
          enrichmentData: {
            technologies: ['Salesforce', 'HubSpot', 'Slack'],
            fundingRound: 'Series B',
            fundingAmount: '$45M',
            competitors: ['CompetitorA', 'CompetitorB']
          }
        },
        {
          id: 2,
          company: 'Innovation Labs',
          contact: {
            name: 'Sarah Johnson',
            title: 'Director of Operations',
            email: 'sarah@innovationlabs.io',
            phone: '+1 (555) 234-5678',
            linkedin: 'linkedin.com/in/sarahjohnson'
          },
          score: 87,
          status: 'warm',
          industry: 'Healthcare',
          location: 'Boston, MA',
          employees: '100-500',
          revenue: '$10M-$50M',
          lastActivity: '5 hours ago',
          website: 'innovationlabs.io'
        },
        {
          id: 3,
          company: 'Growth Systems',
          contact: {
            name: 'Mike Chen',
            title: 'CEO',
            email: 'mike@growthsystems.com',
            phone: '+1 (555) 345-6789',
            linkedin: 'linkedin.com/in/mikechen'
          },
          score: 85,
          status: 'warm',
          industry: 'Finance',
          location: 'New York, NY',
          employees: '50-100',
          revenue: '$5M-$10M',
          lastActivity: '1 day ago',
          website: 'growthsystems.com'
        },
        {
          id: 4,
          company: 'DataSync Inc.',
          contact: {
            name: 'Emily Davis',
            title: 'Head of IT',
            email: 'emily@datasync.com',
            phone: '+1 (555) 456-7890',
            linkedin: 'linkedin.com/in/emilydavis'
          },
          score: 78,
          status: 'warm',
          industry: 'Technology',
          location: 'Austin, TX',
          employees: '100-500',
          revenue: '$20M-$50M',
          lastActivity: '1 day ago',
          website: 'datasync.com'
        },
        {
          id: 5,
          company: 'CloudTech Solutions',
          contact: {
            name: 'Robert Wilson',
            title: 'CTO',
            email: 'robert@cloudtech.io',
            phone: '+1 (555) 567-8901',
            linkedin: 'linkedin.com/in/robertwilson'
          },
          score: 72,
          status: 'cold',
          industry: 'Technology',
          location: 'Seattle, WA',
          employees: '1000-5000',
          revenue: '$100M-$500M',
          lastActivity: '3 days ago',
          website: 'cloudtech.io'
        }
      ])
      setLoading(false)
    }, 1000)
  }, [])

  const handleProspectClick = (prospect) => {
    setSelectedProspect(prospect)
    setShowDetailModal(true)
  }

  const handleExport = () => {
    // Export prospects to CSV
    console.log('Exporting prospects...')
  }

  const handleImport = () => {
    // Import prospects from CSV
    console.log('Importing prospects...')
  }

  const filteredProspects = prospects.filter(prospect => {
    const matchesSearch = 
      prospect.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prospect.contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prospect.contact.email.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesStatus = filters.status === 'all' || prospect.status === filters.status
    const matchesIndustry = filters.industry === 'all' || prospect.industry === filters.industry
    
    const matchesScore = filters.scoreRange === 'all' || 
      (filters.scoreRange === 'high' && prospect.score >= 80) ||
      (filters.scoreRange === 'medium' && prospect.score >= 50 && prospect.score < 80) ||
      (filters.scoreRange === 'low' && prospect.score < 50)
    
    return matchesSearch && matchesStatus && matchesIndustry && matchesScore
  })

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Prospects</h1>
          <p className="text-text-secondary mt-2">
            Manage and enrich your prospect pipeline with AI-powered insights.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={handleImport}
            className="btn btn-secondary"
          >
            <Upload className="w-4 h-4" />
            Import
          </button>
          <button 
            onClick={handleExport}
            className="btn btn-secondary"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
          <button className="btn btn-primary">
            <Plus className="w-4 h-4" />
            Add Prospect
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
          <input
            type="text"
            placeholder="Search by company, contact name, or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input pl-10 w-full"
          />
        </div>
        
        <ProspectFilters 
          filters={filters}
          onFiltersChange={setFilters}
        />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="glass-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-secondary">Total Prospects</p>
              <p className="text-2xl font-bold mt-1">{prospects.length}</p>
            </div>
            <Building2 className="w-8 h-8 text-primary opacity-50" />
          </div>
        </div>
        
        <div className="glass-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-secondary">Hot Leads</p>
              <p className="text-2xl font-bold mt-1">
                {prospects.filter(p => p.status === 'hot').length}
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-error opacity-50" />
          </div>
        </div>
        
        <div className="glass-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-secondary">Avg Score</p>
              <p className="text-2xl font-bold mt-1">
                {Math.round(prospects.reduce((acc, p) => acc + p.score, 0) / prospects.length)}
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-success opacity-50" />
          </div>
        </div>
        
        <div className="glass-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-secondary">Enriched Today</p>
              <p className="text-2xl font-bold mt-1">47</p>
            </div>
            <AlertCircle className="w-8 h-8 text-warning opacity-50" />
          </div>
        </div>
      </div>

      {/* Prospects Table */}
      <ProspectTable 
        prospects={filteredProspects}
        loading={loading}
        onProspectClick={handleProspectClick}
      />

      {/* Prospect Detail Modal */}
      {showDetailModal && (
        <ProspectDetailModal
          prospect={selectedProspect}
          onClose={() => setShowDetailModal(false)}
        />
      )}
    </motion.div>
  )
}

export default Prospects
