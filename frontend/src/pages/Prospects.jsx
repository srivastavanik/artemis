import { useState, useEffect } from 'react';
import axios from 'axios';

function Prospects() {
  const [prospects, setProspects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    minScore: '',
    company: '',
    status: 'all'
  });

  useEffect(() => {
    fetchProspects();
  }, []);

  const fetchProspects = async () => {
    try {
      const params = {};
      if (searchTerm) params.search = searchTerm;
      if (filters.minScore) params.minScore = filters.minScore;
      if (filters.company) params.company = filters.company;
      if (filters.status !== 'all') params.status = filters.status;

      const response = await axios.get(`${import.meta.env.VITE_API_URL}/prospects`, { params });
      setProspects(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch prospects:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchProspects();
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
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-neutral-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Prospects</h1>
        <button
          onClick={() => window.location.href = '/prospects/search'}
          className="btn-primary"
        >
          Find New Prospects
        </button>
      </div>

      {/* Search and Filters */}
      <div className="card">
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="flex gap-4">
            <input
              type="text"
              placeholder="Search by name, email, or company..."
              className="input-field flex-1"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button type="submit" className="btn-primary">
              Search
            </button>
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            <div className="form-group">
              <label className="form-label">Min Score</label>
              <input
                type="number"
                placeholder="0-100"
                className="input-field"
                value={filters.minScore}
                onChange={(e) => setFilters({...filters, minScore: e.target.value})}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Company</label>
              <input
                type="text"
                placeholder="Company name"
                className="input-field"
                value={filters.company}
                onChange={(e) => setFilters({...filters, company: e.target.value})}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Status</label>
              <select
                className="input-field"
                value={filters.status}
                onChange={(e) => setFilters({...filters, status: e.target.value})}
              >
                <option value="all">All</option>
                <option value="new">New</option>
                <option value="enriched">Enriched</option>
                <option value="contacted">Contacted</option>
              </select>
            </div>
          </div>
        </form>
      </div>

      {/* Prospects Table */}
      <div className="card p-0">
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Company</th>
                <th>Title</th>
                <th>Score</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {prospects.length > 0 ? (
                prospects.map((prospect) => (
                  <tr key={prospect.id}>
                    <td>
                      <div>
                        <div className="font-medium">{prospect.first_name} {prospect.last_name}</div>
                        <div className="text-sm text-neutral-600">{prospect.email}</div>
                      </div>
                    </td>
                    <td>{prospect.company_name}</td>
                    <td>{prospect.job_title}</td>
                    <td>
                      <span className="font-medium">
                        {prospect.score || '-'}
                      </span>
                    </td>
                    <td>
                      <span className={`status-dot ${prospect.status === 'enriched' ? 'status-active' : 'status-inactive'}`}></span>
                      <span className="ml-2 text-sm">{prospect.status}</span>
                    </td>
                    <td>
                      {prospect.status === 'new' && (
                        <button
                          onClick={() => handleEnrichProspect(prospect.id)}
                          className="text-sm text-neutral-600 hover:text-neutral-900"
                        >
                          Enrich
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="text-center text-neutral-500">
                    No prospects found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Prospects;
