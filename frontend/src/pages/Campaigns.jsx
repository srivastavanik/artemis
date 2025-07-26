import { useState, useEffect } from 'react';
import axios from 'axios';

function Campaigns() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    type: 'email',
    targetScore: 70,
    messageTemplate: ''
  });

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/campaigns`);
      setCampaigns(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch campaigns:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/campaigns`, formData);
      setShowCreateForm(false);
      setFormData({
        name: '',
        type: 'email',
        targetScore: 70,
        messageTemplate: ''
      });
      fetchCampaigns();
    } catch (error) {
      console.error('Failed to create campaign:', error);
    }
  };

  const handleLaunchCampaign = async (campaignId) => {
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/campaigns/${campaignId}/launch`);
      fetchCampaigns();
    } catch (error) {
      console.error('Failed to launch campaign:', error);
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
        <h1 className="text-2xl font-semibold">Campaigns</h1>
        <button
          onClick={() => setShowCreateForm(true)}
          className="btn-primary"
        >
          Create Campaign
        </button>
      </div>

      {/* Create Campaign Form */}
      {showCreateForm && (
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">New Campaign</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="form-group">
              <label className="form-label">Campaign Name</label>
              <input
                type="text"
                required
                className="input-field"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="form-group">
                <label className="form-label">Type</label>
                <select
                  className="input-field"
                  value={formData.type}
                  onChange={(e) => setFormData({...formData, type: e.target.value})}
                >
                  <option value="email">Email</option>
                  <option value="sms">SMS</option>
                  <option value="multi">Multi-channel</option>
                </select>
              </div>
              
              <div className="form-group">
                <label className="form-label">Min Prospect Score</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  className="input-field"
                  value={formData.targetScore}
                  onChange={(e) => setFormData({...formData, targetScore: parseInt(e.target.value)})}
                />
              </div>
            </div>
            
            <div className="form-group">
              <label className="form-label">Message Template</label>
              <textarea
                rows="4"
                className="input-field"
                placeholder="Hi {{first_name}}, ..."
                value={formData.messageTemplate}
                onChange={(e) => setFormData({...formData, messageTemplate: e.target.value})}
              />
            </div>
            
            <div className="flex gap-3">
              <button type="submit" className="btn-primary">
                Create Campaign
              </button>
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Campaigns Table */}
      <div className="card p-0">
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Campaign Name</th>
                <th>Type</th>
                <th>Status</th>
                <th>Prospects</th>
                <th>Sent</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.length > 0 ? (
                campaigns.map((campaign) => (
                  <tr key={campaign.id}>
                    <td className="font-medium">{campaign.name}</td>
                    <td>{campaign.type}</td>
                    <td>
                      <span className={`status-dot ${campaign.status === 'active' ? 'status-active' : 'status-inactive'}`}></span>
                      <span className="ml-2 text-sm">{campaign.status}</span>
                    </td>
                    <td>{campaign.prospect_count || 0}</td>
                    <td>{campaign.messages_sent || 0}</td>
                    <td>
                      {campaign.status === 'draft' && (
                        <button
                          onClick={() => handleLaunchCampaign(campaign.id)}
                          className="text-sm text-neutral-600 hover:text-neutral-900"
                        >
                          Launch
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="text-center text-neutral-500">
                    No campaigns found
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

export default Campaigns;
