import api from './api';

class CampaignsService {
  async getCampaigns() {
    return api.get('/campaigns');
  }

  async getCampaignById(id) {
    return api.get(`/campaigns/${id}`);
  }

  async createCampaign(campaignData) {
    return api.post('/campaigns', campaignData);
  }

  async updateCampaign(id, updates) {
    return api.put(`/campaigns/${id}`, updates);
  }

  async deleteCampaign(id) {
    return api.delete(`/campaigns/${id}`);
  }

  async executeCampaign(campaignData) {
    return api.post('/campaigns/execute', campaignData);
  }

  async pauseCampaign(id) {
    return api.post(`/campaigns/${id}/pause`);
  }

  async resumeCampaign(id) {
    return api.post(`/campaigns/${id}/resume`);
  }

  async getCampaignAnalytics(id) {
    return api.get(`/campaigns/${id}/analytics`);
  }

  async getCampaignMessages(id) {
    return api.get(`/campaigns/${id}/messages`);
  }

  async assignProspectsToCampaign(id, prospectIds) {
    return api.post(`/campaigns/${id}/prospects`, { prospectIds });
  }

  // Alias for Campaigns page
  async getAllCampaigns() {
    return this.getCampaigns();
  }
}

export default new CampaignsService();
