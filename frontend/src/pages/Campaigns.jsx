import { useState, useEffect } from 'react';
import campaignsService from '../services/campaigns.service';

function Campaigns() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedChannel, setSelectedChannel] = useState('email');
  const [newCampaign, setNewCampaign] = useState({
    name: '',
    description: '',
    targetAudience: ''
  });

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      const response = await campaignsService.getCampaigns();
      setCampaigns(response.data || []);
    } catch (error) {
      console.error('Failed to fetch campaigns:', error);
      // Demo data
      setCampaigns([
        { id: 1, name: 'Q1 Enterprise Outreach', status: 'active', prospects: 450, sent: 1200, opened: 780, replied: 95 },
        { id: 2, name: 'Product Launch Campaign', status: 'scheduled', prospects: 280, sent: 0, opened: 0, replied: 0 },
        { id: 3, name: 'Holiday Promo 2024', status: 'completed', prospects: 650, sent: 1950, opened: 1100, replied: 120 },
      ]);
    } finally {
      setLoading(false);
    }
  };
  
  const handleCreateCampaign = async () => {
    if (!newCampaign.name || !newCampaign.targetAudience) return;
    
    try {
      const campaignData = {
        name: newCampaign.name,
        description: newCampaign.description,
        targetCriteria: {
          titles: newCampaign.targetAudience.split(',').map(t => t.trim())
        },
        channels: [selectedChannel],
        messageTemplates: {
          [selectedChannel]: {
            template: `Hi {{firstName}}, I noticed you're the {{jobTitle}} at {{company}} and wanted to reach out...`
          }
        }
      };
      
      await campaignsService.createCampaign(campaignData);
      fetchCampaigns();
      
      // Reset form
      setNewCampaign({ name: '', description: '', targetAudience: '' });
    } catch (error) {
      console.error('Failed to create campaign:', error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'text-green-400';
      case 'scheduled': return 'text-yellow-400';
      case 'completed': return 'text-gray-400';
      default: return 'text-gray-400';
    }
  };

  const channels = [
    { id: 'email', name: 'Email', icon: '✉️' },
    { id: 'linkedin', name: 'LinkedIn', icon: '💼' },
    { id: 'twitter', name: 'Twitter', icon: '🐦' },
    { id: 'phone', name: 'Phone', icon: '📱' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <div className="text-gray-400 font-extralight">Loading campaigns...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 py-16">
      <div className="animate-fade-in">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-extralight tracking-tighter mb-4">
            <span className="gradient-text">Campaign</span> Builder
          </h1>
          <p className="text-gray-400 text-lg font-extralight">
            Multi-channel orchestration powered by AI
          </p>
        </div>

        {/* Create Campaign */}
        <div className="card mb-12">
          <h3 className="text-2xl font-light mb-6">Create New Campaign</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div>
              <label className="block text-sm text-gray-400 mb-2 font-light">Campaign Name</label>
              <input
                type="text"
                className="input-field"
                placeholder="e.g., Q2 Enterprise Outreach"
                value={newCampaign.name}
                onChange={(e) => setNewCampaign({ ...newCampaign, name: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2 font-light">Target Audience</label>
              <input
                type="text"
                className="input-field"
                placeholder="e.g., VP Sales at SaaS companies"
                value={newCampaign.targetAudience}
                onChange={(e) => setNewCampaign({ ...newCampaign, targetAudience: e.target.value })}
              />
            </div>
          </div>

          <div className="mb-8">
            <label className="block text-sm text-gray-400 mb-4 font-light">Select Channels</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {channels.map((channel) => (
                <button
                  key={channel.id}
                  onClick={() => setSelectedChannel(channel.id)}
                  className={`p-4 rounded-lg border transition-all duration-200 ${
                    selectedChannel === channel.id
                      ? 'border-indigo-500/50 bg-indigo-500/10 text-white'
                      : 'border-indigo-500/20 text-gray-400 hover:border-indigo-500/30'
                  }`}
                >
                  <div className="text-2xl mb-2">{channel.icon}</div>
                  <div className="text-sm font-light">{channel.name}</div>
                </button>
              ))}
            </div>
          </div>

          <button 
            className="btn-primary"
            onClick={handleCreateCampaign}
          >
            Generate Campaign with AI
          </button>
        </div>

        <div className="divider-horizontal"></div>

        {/* Active Campaigns */}
        <div>
          <h2 className="section-title">Active Campaigns</h2>
          <p className="section-subtitle mb-8">Monitor and optimize your outreach</p>

          <div className="space-y-6">
            {campaigns.map((campaign) => (
              <div key={campaign.id} className="card">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h3 className="text-xl font-normal mb-2">{campaign.name}</h3>
                    <p className={`text-sm font-light ${getStatusColor(campaign.status)}`}>
                      {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
                    </p>
                  </div>
                  <button className="btn-secondary btn-sm">
                    View Details
                  </button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div>
                    <div className="text-2xl font-light">{campaign.prospects}</div>
                    <div className="text-gray-500 text-sm font-extralight">Prospects</div>
                  </div>
                  <div>
                    <div className="text-2xl font-light">{campaign.sent}</div>
                    <div className="text-gray-500 text-sm font-extralight">Messages Sent</div>
                  </div>
                  <div>
                    <div className="text-2xl font-light">{campaign.opened}</div>
                    <div className="text-gray-500 text-sm font-extralight">Opened</div>
                  </div>
                  <div>
                    <div className="text-2xl font-light text-green-400">{campaign.replied}</div>
                    <div className="text-gray-500 text-sm font-extralight">Replies</div>
                  </div>
                </div>

                {campaign.status === 'active' && (
                  <div className="mt-6 pt-6 border-t border-indigo-500/10">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400 font-light">Campaign Progress</span>
                      <span className="text-gray-300 font-light">
                        {Math.round((campaign.sent / (campaign.prospects * 3)) * 100)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-800 rounded-full h-2 mt-2">
                      <div 
                        className="h-2 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500"
                        style={{ width: `${Math.round((campaign.sent / (campaign.prospects * 3)) * 100)}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Campaign Templates */}
        <div className="mt-16">
          <h2 className="section-title">AI-Powered Templates</h2>
          <p className="section-subtitle mb-8">Start with proven strategies</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="card hover:border-indigo-500/30 cursor-pointer">
              <h3 className="text-lg font-normal mb-2">Cold Outreach</h3>
              <p className="text-gray-400 font-extralight text-sm">
                Multi-touch sequence for new prospects with personalized messaging
              </p>
            </div>
            <div className="card hover:border-indigo-500/30 cursor-pointer">
              <h3 className="text-lg font-normal mb-2">Product Launch</h3>
              <p className="text-gray-400 font-extralight text-sm">
                Announce new features to engaged prospects with targeted follow-ups
              </p>
            </div>
            <div className="card hover:border-indigo-500/30 cursor-pointer">
              <h3 className="text-lg font-normal mb-2">Re-engagement</h3>
              <p className="text-gray-400 font-extralight text-sm">
                Win back inactive prospects with value-driven content sequences
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Campaigns;
