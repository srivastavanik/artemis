import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import prospectsService from '../services/prospects.service';
import ProspectDetailModal from '../components/ProspectDetailModal';

const Prospects = () => {
  const [prospects, setProspects] = useState([]);
  const [selectedProspect, setSelectedProspect] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterScore, setFilterScore] = useState('all');
  const [discovering, setDiscovering] = useState(false);

  const [discoveryConfig, setDiscoveryConfig] = useState({
    industry: '',
    companySize: '',
    region: '',
    technologies: '',
    revenue: ''
  });

  useEffect(() => {
    loadProspects();
  }, [filterScore]);

  const loadProspects = async () => {
    try {
      setLoading(true);
      const data = await prospectsService.getAllProspects();
      setProspects(data);
    } catch (error) {
      console.error('Error loading prospects:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDiscoverProspects = async () => {
    try {
      setDiscovering(true);
      await prospectsService.discoverProspects(discoveryConfig);
      await loadProspects();
    } catch (error) {
      console.error('Error discovering prospects:', error);
    } finally {
      setDiscovering(false);
    }
  };

  const filteredProspects = prospects.filter(prospect => {
    const matchesSearch = 
      prospect.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prospect.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prospect.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesScore = 
      filterScore === 'all' || 
      (filterScore === 'high' && prospect.score >= 80) ||
      (filterScore === 'medium' && prospect.score >= 50 && prospect.score < 80) ||
      (filterScore === 'low' && prospect.score < 50);
    
    return matchesSearch && matchesScore;
  });

  return (
    <Layout>
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-light tracking-tight mb-4">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">
              Prospect
            </span>{' '}
            Discovery
          </h1>
          <p className="text-gray-400 font-extralight text-lg">
            AI-powered lead identification and enrichment
          </p>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search by name, company, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-transparent border border-gray-800 rounded-md px-4 py-3 text-white placeholder-gray-600 focus:border-indigo-500 focus:outline-none transition-colors font-light"
            />
          </div>
          <select
            value={filterScore}
            onChange={(e) => setFilterScore(e.target.value)}
            className="bg-transparent border border-gray-800 rounded-md px-4 py-3 text-white focus:border-indigo-500 focus:outline-none transition-colors font-light"
          >
            <option value="all">All scores</option>
            <option value="high">High (80+)</option>
            <option value="medium">Medium (50-79)</option>
            <option value="low">Low (&lt;50)</option>
          </select>
          <button
            onClick={handleDiscoverProspects}
            disabled={discovering}
            className="bg-white text-black font-light rounded-md px-6 py-3 hover:bg-opacity-90 transition-all disabled:opacity-50"
          >
            {discovering ? 'Discovering...' : 'Discover New Prospects'}
          </button>
        </div>

        {/* Prospects Table */}
        <div className="border border-gray-800 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-left py-4 px-6 font-light text-gray-400">Name</th>
                  <th className="text-left py-4 px-6 font-light text-gray-400">Company</th>
                  <th className="text-left py-4 px-6 font-light text-gray-400">Title</th>
                  <th className="text-left py-4 px-6 font-light text-gray-400">Score</th>
                  <th className="text-left py-4 px-6 font-light text-gray-400">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="5" className="text-center py-12 text-gray-400 font-extralight">
                      Loading prospects...
                    </td>
                  </tr>
                ) : filteredProspects.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center py-12 text-gray-400 font-extralight">
                      No prospects found. Try adjusting your filters or discover new prospects.
                    </td>
                  </tr>
                ) : (
                  filteredProspects.map((prospect) => (
                    <tr key={prospect.id} className="border-b border-gray-800 hover:bg-gray-900/30 transition-colors">
                      <td className="py-4 px-6">
                        <div>
                          <p className="font-light">{prospect.name}</p>
                          <p className="text-sm text-gray-400 font-extralight">{prospect.email}</p>
                        </div>
                      </td>
                      <td className="py-4 px-6 font-light">{prospect.company}</td>
                      <td className="py-4 px-6 font-light text-gray-300">{prospect.title}</td>
                      <td className="py-4 px-6">
                        <div className="flex items-center">
                          <div className={`w-2 h-2 rounded-full mr-2 ${
                            prospect.score >= 80 ? 'bg-green-400' :
                            prospect.score >= 50 ? 'bg-yellow-400' : 'bg-red-400'
                          }`}></div>
                          <span className="font-light">{prospect.score}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <button
                          onClick={() => setSelectedProspect(prospect)}
                          className="text-indigo-400 hover:text-indigo-300 transition-colors font-light"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-8">
          <div className="text-center">
            <p className="text-3xl font-light">{prospects.length}</p>
            <p className="text-gray-400 font-extralight mt-1">Prospects shown</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-light">
              {prospects.filter(p => p.score >= 80).length}
            </p>
            <p className="text-gray-400 font-extralight mt-1">High quality leads</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-light">
              {prospects.length > 0 ? Math.round(prospects.reduce((acc, p) => acc + p.score, 0) / prospects.length) : 0}
            </p>
            <p className="text-gray-400 font-extralight mt-1">Average score</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-light">24h</p>
            <p className="text-gray-400 font-extralight mt-1">Last enrichment</p>
          </div>
        </div>

        {/* Prospect Detail Modal */}
        {selectedProspect && (
          <ProspectDetailModal
            prospect={selectedProspect}
            onClose={() => setSelectedProspect(null)}
          />
        )}
      </div>
    </Layout>
  );
};

export default Prospects;
