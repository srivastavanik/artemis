import api from './api';

class ProspectsService {
  async getProspects(filters = {}) {
    const queryParams = new URLSearchParams(filters).toString();
    return api.get(`/prospects${queryParams ? `?${queryParams}` : ''}`);
  }

  async getProspectById(id) {
    return api.get(`/prospects/${id}`);
  }

  async createProspect(prospectData) {
    return api.post('/prospects', prospectData);
  }

  async updateProspect(id, updates) {
    return api.put(`/prospects/${id}`, updates);
  }

  async deleteProspect(id) {
    return api.delete(`/prospects/${id}`);
  }

  async discoverProspects(searchCriteria) {
    return api.post('/prospects/discover', searchCriteria);
  }

  async enrichProspect(id) {
    return api.post(`/prospects/${id}/enrich`);
  }

  async analyzeProspect(id) {
    return api.post(`/prospects/${id}/analyze`);
  }

  async getEnrichmentData(prospectId) {
    return api.get(`/prospects/${prospectId}/enrichment`);
  }

  async getEngagementScore(prospectId) {
    return api.get(`/prospects/${prospectId}/score`);
  }
}

export default new ProspectsService();
