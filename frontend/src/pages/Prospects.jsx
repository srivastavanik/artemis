import React, { useState, useEffect } from 'react';
import { prospectService } from '../services/prospects.service';
import ProspectTable from '../components/ProspectTable';
import ProspectFilters from '../components/ProspectFilters';
import ProspectDetailModal from '../components/ProspectDetailModal';
import { websocketService } from '../services/websocket.service';

const Prospects = () => {
  const [prospects, setProspects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [discovering, setDiscovering] = useState(false);
  const [selectedProspect, setSelectedProspect] = useState(null);
  const [filters, setFilters] = useState({
    industry: '',
    size: '',
    location: '',
    score: 0
  });
  const [discoveryConfig, setDiscoveryConfig] = useState({
    industry: '',
    companySize: '',
    location: '',
    technologies: [],
    jobTitles: []
  });
  const [showDiscoveryModal, setShowDiscoveryModal] = useState(false);

  useEffect(() => {
    fetchProspects();
    
    // Listen for real-time updates
    const unsubscribe = websocketService.subscribe('prospect_discovered', (data) => {
      setProspects(prev => [data, ...prev]);
    });

    return () => unsubscribe();
  }, [filters]);

  const fetchProspects = async () => {
    try {
      setLoading(true);
      const response = await prospectService.list(filters);
      setProspects(response.data || []);
    } catch (error) {
      console.error('Failed to fetch prospects:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDiscover = async () => {
    try {
      setDiscovering(true);
      setShowDiscoveryModal(false);
      
      await prospectService.discover(discoveryConfig);
      
      // Scout agent will work in background
      setTimeout(() => {
        setDiscovering(false);
        fetchProspects();
      }, 3000);
    } catch (error) {
      console.error('Failed to start discovery:', error);
      setDiscovering(false);
    }
  };

  const handleEnrich = async (prospectId) => {
    try {
      await prospectService.enrich(prospectId);
      fetchProspects();
    } catch (error) {
      console.error('Failed to enrich prospect:', error);
    }
  };

  const handleAnalyze = async (prospectId) => {
    try {
      await prospectService.analyze(prospectId);
      fetchProspects();
    } catch (error) {
      console.error('Failed to analyze prospect:', error);
    }
  };

  return (
    <div className="min-h-screen bg-black">
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-light tracking-tight text-white mb-2">
              Prospects
            </h1>
            <p className="text-gray-400 font-extralight">
              {prospects.length} prospects discovered • {prospects.filter(p => p.enrichment_status === 'enriched').length} enriched
            </p>
          </div>
          <button
            onClick={() => setShowDiscoveryModal(true)}
            className="bg-white text-black font-light rounded-md px-6 py-3 hover:bg-opacity-90 transition-all"
            disabled={discovering}
          >
            {discovering ? 'Discovering...' : 'Start AI Discovery'}
          </button>
        </div>

        <div className="h-px bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent mb-8"></div>

        {/* Discovery Status */}
        {discovering && (
          <div className="mb-8 bg-indigo-900/20 border border-indigo-500/30 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-3 h-3 bg-indigo-400 rounded-full animate-pulse"></div>
                <div>
                  <h3 className="text-lg font-light text-white">Scout Agent Active</h3>
                  <p className="text-sm text-gray-400">Scanning the web for prospects matching your criteria...</p>
                </div>
              </div>
              <div className="text-sm text-indigo-300">
                Powered by BrightData
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <ProspectFilters filters={filters} onFilterChange={setFilters} />

        {/* Prospects Table */}
        <div className="bg-gray-900/30 backdrop-blur-sm border border-gray-800 rounded-lg overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="text-gray-400">Loading prospects...</div>
            </div>
          ) : prospects.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-gray-400 mb-4">No prospects found</p>
              <button
                onClick={() => setShowDiscoveryModal(true)}
                className="text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                Start discovering prospects →
              </button>
            </div>
          ) : (
            <ProspectTable
              prospects={prospects}
              onSelectProspect={setSelectedProspect}
              onEnrich={handleEnrich}
              onAnalyze={handleAnalyze}
            />
          )}
        </div>

        {/* AI Agent Status */}
        <div className="mt-8 grid md:grid-cols-3 gap-6">
          <div className="bg-gray-900/30 backdrop-blur-sm border border-gray-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">Scout Agent</span>
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            </div>
            <p className="text-lg font-light text-white">Discovery Active</p>
            <p className="text-xs text-gray-500 mt-1">247 prospects found today</p>
          </div>
          <div className="bg-gray-900/30 backdrop-blur-sm border border-gray-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">Analyst Agent</span>
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            </div>
            <p className="text-lg font-light text-white">Enrichment Active</p>
            <p className="text-xs text-gray-500 mt-1">98% data completeness</p>
          </div>
          <div className="bg-gray-900/30 backdrop-blur-sm border border-gray-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">LlamaIndex</span>
              <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
            </div>
            <p className="text-lg font-light text-white">AI Analysis Ready</p>
            <p className="text-xs text-gray-500 mt-1">Predictive scoring enabled</p>
          </div>
        </div>
      </div>

      {/* Discovery Modal */}
      {showDiscoveryModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-8 max-w-2xl w-full mx-4">
            <h2 className="text-2xl font-light text-white mb-6">Configure AI Discovery</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Industry</label>
                <input
                  type="text"
                  value={discoveryConfig.industry}
                  onChange={(e) => setDiscoveryConfig({...discoveryConfig, industry: e.target.value})}
                  className="w-full bg-black border border-gray-800 rounded-md px-4 py-2 text-white focus:border-indigo-500 focus:outline-none"
                  placeholder="e.g., Technology, Healthcare, Finance"
                />
              </div>
              
              <div>
                <label className="block text-sm text-gray-400 mb-2">Company Size</label>
                <select
                  value={discoveryConfig.companySize}
                  onChange={(e) => setDiscoveryConfig({...discoveryConfig, companySize: e.target.value})}
                  className="w-full bg-black border border-gray-800 rounded-md px-4 py-2 text-white focus:border-indigo-500 focus:outline-none"
                >
                  <option value="">Any size</option>
                  <option value="1-10">1-10 employees</option>
                  <option value="11-50">11-50 employees</option>
                  <option value="51-200">51-200 employees</option>
                  <option value="201-500">201-500 employees</option>
                  <option value="500+">500+ employees</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm text-gray-400 mb-2">Location</label>
                <input
                  type="text"
                  value={discoveryConfig.location}
                  onChange={(e) => setDiscoveryConfig({...discoveryConfig, location: e.target.value})}
                  className="w-full bg-black border border-gray-800 rounded-md px-4 py-2 text-white focus:border-indigo-500 focus:outline-none"
                  placeholder="e.g., San Francisco, New York, Remote"
                />
              </div>
              
              <div>
                <label className="block text-sm text-gray-400 mb-2">Technologies (comma-separated)</label>
                <input
                  type="text"
                  value={discoveryConfig.technologies.join(', ')}
                  onChange={(e) => setDiscoveryConfig({
                    ...discoveryConfig, 
                    technologies: e.target.value.split(',').map(t => t.trim()).filter(t => t)
                  })}
                  className="w-full bg-black border border-gray-800 rounded-md px-4 py-2 text-white focus:border-indigo-500 focus:outline-none"
                  placeholder="e.g., React, AWS, Python"
                />
              </div>
              
              <div>
                <label className="block text-sm text-gray-400 mb-2">Target Job Titles (comma-separated)</label>
                <input
                  type="text"
                  value={discoveryConfig.jobTitles.join(', ')}
                  onChange={(e) => setDiscoveryConfig({
                    ...discoveryConfig, 
                    jobTitles: e.target.value.split(',').map(t => t.trim()).filter(t => t)
                  })}
                  className="w-full bg-black border border-gray-800 rounded-md px-4 py-2 text-white focus:border-indigo-500 focus:outline-none"
                  placeholder="e.g., CTO, VP Sales, Head of Marketing"
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-4 mt-8">
              <button
                onClick={() => setShowDiscoveryModal(false)}
                className="px-6 py-2 text-gray-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDiscover}
                className="bg-white text-black font-light rounded-md px-6 py-2 hover:bg-opacity-90 transition-all"
              >
                Start Discovery
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Prospect Detail Modal */}
      {selectedProspect && (
        <ProspectDetailModal
          prospect={selectedProspect}
          onClose={() => setSelectedProspect(null)}
          onEnrich={() => handleEnrich(selectedProspect.id)}
          onAnalyze={() => handleAnalyze(selectedProspect.id)}
        />
      )}
    </div>
  );
};

export default Prospects;
