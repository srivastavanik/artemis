import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Filter, X, ChevronDown } from 'lucide-react'

const ProspectFilters = ({ filters, onFiltersChange }) => {
  const [isOpen, setIsOpen] = React.useState(false)

  const handleFilterChange = (filterType, value) => {
    onFiltersChange({
      ...filters,
      [filterType]: value
    })
  }

  const activeFiltersCount = Object.values(filters).filter(value => value !== 'all').length

  const clearFilters = () => {
    onFiltersChange({
      status: 'all',
      scoreRange: 'all',
      industry: 'all',
      dateRange: 'all'
    })
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="btn btn-secondary flex items-center gap-2"
      >
        <Filter className="w-4 h-4" />
        <span>Filters</span>
        {activeFiltersCount > 0 && (
          <span className="px-1.5 py-0.5 rounded-full bg-primary text-white text-xs font-medium">
            {activeFiltersCount}
          </span>
        )}
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-30"
              onClick={() => setIsOpen(false)}
            />

            {/* Dropdown */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="absolute right-0 mt-2 w-80 glass-card z-40"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Filter Prospects</h3>
                {activeFiltersCount > 0 && (
                  <button
                    onClick={clearFilters}
                    className="text-xs text-primary hover:text-primary-hover"
                  >
                    Clear all
                  </button>
                )}
              </div>

              <div className="space-y-4">
                {/* Status Filter */}
                <div>
                  <label className="label">Status</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { value: 'all', label: 'All' },
                      { value: 'hot', label: 'Hot' },
                      { value: 'warm', label: 'Warm' },
                      { value: 'cold', label: 'Cold' }
                    ].map(option => (
                      <button
                        key={option.value}
                        onClick={() => handleFilterChange('status', option.value)}
                        className={`
                          px-3 py-2 rounded-lg text-sm font-medium transition-all
                          ${filters.status === option.value
                            ? 'bg-primary text-white'
                            : 'bg-bg-glass hover:bg-bg-glass-hover text-text-secondary'
                          }
                        `}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Score Range Filter */}
                <div>
                  <label className="label">Score Range</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { value: 'all', label: 'All' },
                      { value: 'high', label: '80-100' },
                      { value: 'medium', label: '50-79' },
                      { value: 'low', label: '0-49' }
                    ].map(option => (
                      <button
                        key={option.value}
                        onClick={() => handleFilterChange('scoreRange', option.value)}
                        className={`
                          px-3 py-2 rounded-lg text-sm font-medium transition-all
                          ${filters.scoreRange === option.value
                            ? 'bg-primary text-white'
                            : 'bg-bg-glass hover:bg-bg-glass-hover text-text-secondary'
                          }
                        `}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Industry Filter */}
                <div>
                  <label className="label">Industry</label>
                  <select
                    value={filters.industry}
                    onChange={(e) => handleFilterChange('industry', e.target.value)}
                    className="select w-full"
                  >
                    <option value="all">All Industries</option>
                    <option value="Technology">Technology</option>
                    <option value="Healthcare">Healthcare</option>
                    <option value="Finance">Finance</option>
                    <option value="Retail">Retail</option>
                    <option value="Manufacturing">Manufacturing</option>
                    <option value="Education">Education</option>
                    <option value="Real Estate">Real Estate</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                {/* Date Range Filter */}
                <div>
                  <label className="label">Last Activity</label>
                  <select
                    value={filters.dateRange}
                    onChange={(e) => handleFilterChange('dateRange', e.target.value)}
                    className="select w-full"
                  >
                    <option value="all">Any Time</option>
                    <option value="today">Today</option>
                    <option value="week">Last 7 days</option>
                    <option value="month">Last 30 days</option>
                    <option value="quarter">Last 3 months</option>
                  </select>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-end gap-3">
                <button
                  onClick={() => setIsOpen(false)}
                  className="btn btn-ghost"
                >
                  Cancel
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="btn btn-primary"
                >
                  Apply Filters
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

export default ProspectFilters
