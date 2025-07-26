import { useState, useEffect } from 'react';
import axios from 'axios';

function Prospects() {
  const [prospects, setProspects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    minScore: 0,
    status: 'all'
  });

  useEffect(() => {
    fetchProspects();
  }, [filters]);

  const fetchProspects = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.search) params.append('name', filters.search);
      if (filters.minScore > 0) params.append('minScore', filters.minScore);
      
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/prospects?${params}`);
      setProspects(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch prospects:', error);
      // Use demo data on error
      setProspects([
        { id: 1, first_name: 'John', last_name: 'Smith', email: 'john@techcorp.com', company_name: 'TechCorp Inc.', job_title: 'VP Sales', score: 85 },
        { id: 2, first_name: 'Sarah', last_name: 'Johnson', email: 'sarah@acme.com', company_name: 'Acme Corp', job_title: 'Director of Marketing', score: 92 },
        { id: 3, first_name: 'Michael', last_name: 'Chen', email: 'mchen@startup.io', company_name: 'Startup.io', job_title: 'CEO', score: 78 },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleEnrichProspect = async (prospectId) => {
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/prospects/${prospectId}/enrich`);
      fetchProspects();
    } catch (error) {
      console.error('Failed to enrich prospect:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <div className="text-gray-400 font-extralight">Loading prospects...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 py-16">
      <div className="animate-fade-in">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-extralight tracking-tighter mb-4">
            <span className="gradient-text">Prospect</span> Discovery
          </h1>
          <p className="text-gray-400 text-lg font-extralight">
            AI-powered lead identification and enrichment
          </p>
        </div>

        {/* Filters */}
        <div className="card mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm text-gray-400 mb-2 font-light">Search prospects</label>
              <input
                type="text"
                className="input-field"
                placeholder="Name, company, or email..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2 font-light">Min. Score</label>
              <select
                className="input-field"
                value={filters.minScore}
                onChange={(e) => setFilters({ ...filters, minScore: parseInt(e.target.value) })}
              >
                <option value="0">All scores</option>
                <option value="70">70+</option>
                <option value="80">80+</option>
                <option value="90">90+</option>
              </select>
            </div>
            <div className="flex items-end">
              <button className="btn-primary w-full">
                Discover New Prospects
              </button>
            </div>
          </div>
        </div>

        <div className="divider-horizontal"></div>

        {/* Prospects Table */}
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Company</th>
                <th>Title</th>
                <th>Score</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {prospects.map((prospect) => (
                <tr key={prospect.id} className="hover:bg-indigo-500/5">
                  <td>
                    <div>
                      <div className="font-normal text-white">
                        {prospect.first_name} {prospect.last_name}
                      </div>
                      <div className="text-sm text-gray-500 font-extralight">{prospect.email}</div>
                    </div>
                  </td>
                  <td className="font-light">{prospect.company_name}</td>
                  <td className="font-light">{prospect.job_title}</td>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${prospect.score >= 80 ? 'bg-green-400 glow-sm' : 'bg-yellow-400'}`}></div>
                      <span className="font-light">{prospect.score || 75}</span>
                    </div>
                  </td>
                  <td>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleEnrichProspect(prospect.id)}
                        className="text-indigo-400 hover:text-indigo-300 text-sm font-light transition-colors"
                      >
                        Enrich
                      </button>
                      <span className="text-gray-600">•</span>
                      <button className="text-indigo-400 hover:text-indigo-300 text-sm font-light transition-colors">
                        Add to Campaign
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {prospects.length === 0 && (
            <div className="text-center py-16 text-gray-500 font-extralight">
              No prospects found. Try adjusting your filters or discover new prospects.
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-12">
          <div>
            <p className="text-2xl font-light mb-1 tracking-tight">{prospects.length}</p>
            <p className="text-gray-500 font-extralight">Prospects shown</p>
          </div>
          <div>
            <p className="text-2xl font-light mb-1 tracking-tight">
              {prospects.filter(p => (p.score || 75) >= 80).length}
            </p>
            <p className="text-gray-500 font-extralight">High quality leads</p>
          </div>
          <div>
            <p className="text-2xl font-light mb-1 tracking-tight">
              {Math.round(prospects.reduce((acc, p) => acc + (p.score || 75), 0) / (prospects.length || 1))}
            </p>
            <p className="text-gray-500 font-extralight">Average score</p>
          </div>
          <div>
            <p className="text-2xl font-light mb-1 tracking-tight">24h</p>
            <p className="text-gray-500 font-extralight">Last enrichment</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Prospects;
