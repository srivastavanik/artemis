import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { campaignsService } from '../services/campaigns.service';

const Campaigns = () => {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [creatingCampaign, setCreatingCampaign] = useState(false);
  const [selectedChannel, setSelectedChannel] = useState('email');
  
  const [newCampaign, setNewCampaign] = useState({
    name: '',
    targetAudience: '',
    channel: 'email',
    message: ''
  });

  useEffect(() => {
    loadCampaigns();
  }, []);

  const loadCampaigns = async () => {
    try {
      setLoading(true);
      const data = await campaignsService.getAllCampaigns();
      setCampaigns(data);
    } catch (error) {
      console.error('Error loading campaigns:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCampaign = async () => {
    try {
      setCreatingCampaign(true);
      await campaignsService.createCampaign(newCampaign);
      await loadCampaigns();
      setNewCampaign({ name: '', targetAudience: '', channel: 'email', message: '' });
    } catch (error) {
      console.error('Error creating campaign:', error);
    } finally {
      setCreatingCampaign(false);
    }
  };

  const handleGenerateWithAI = async () => {
    try {
      setCreatingCampaign(true);
      const aiGenerated = await campaignsService.generateWithAI(newCampaign);
      setNewCampaign({ ...newCampaign, message: aiGenerated.message });
    } catch (error) {
      console.error('Error generating with AI:', error);
    } finally {
      setCreatingCampaign(false);
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-light tracking-tight mb-4">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">
              Campaign
            </span>{' '}
            Builder
          </h1>
          <p className="text-gray-400 font-extralight text-lg">
            Multi-channel orchestration powered by AI
          </p>
        </div>

        {/* Create New Campaign */}
        <div className="border border-gray-800 rounded-lg p-8 mb-12">
          <h2 className="text-2xl font-light tracking-tight mb-6">Create New Campaign</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm text-gray-400 font-extralight mb-2">Campaign Name</label>
              <input
                type="text"
                value={newCampaign.name}
                onChange={(e) => setNewCampaign({ ...newCampaign, name: e.target.value })}
                className="w-full bg-transparent border border-gray-800 rounded-md px-4 py-3 text-white placeholder-gray-600 focus:border-indigo-500 focus:outline-none transition-colors font-light"
                placeholder="e.g., Q2 Enterprise Outreach"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 font-extralight mb-2">Target Audience</label>
              <input
                type="text"
                value={newCampaign.targetAudience}
                onChange={(e) => setNewCampaign({ ...newCampaign, targetAudience: e.target.value })}
                className="w-full bg-transparent border border-gray-800 rounded-md px-4 py-3 text-white placeholder-gray-600 focus:border-indigo-500 focus:outline-none transition-colors font-light"
                placeholder="e.g., VP Sales at SaaS companies"
              />
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm text-gray-400 font-extralight mb-4">Select Channels</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {['email', 'linkedin', 'twitter', 'phone'].map((channel) => (
                <button
                  key={channel}
                  onClick={() => setNewCampaign({ ...newCampaign, channel })}
                  className={`border rounded-lg p-4 transition-all ${
                    newCampaign.channel === channel
                      ? 'border-indigo-500 bg-indigo-500/10'
                      : 'border-gray-800 hover:border-gray-700'
                  }`}
                >
                  <p className="font-light capitalize">{channel}</p>
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleGenerateWithAI}
            disabled={creatingCampaign || !newCampaign.name || !newCampaign.targetAudience}
            className="bg-white text-black font-light rounded-md px-6 py-3 hover:bg-opacity-90 transition-all disabled:opacity-50"
          >
            {creatingCampaign ? 'Generating...' : 'Generate Campaign with AI'}
          </button>
        </div>

        {/* Active Campaigns */}
        <div>
          <h2 className="text-2xl font-light tracking-tight mb-6">Active Campaigns</h2>
          <p className="text-gray-400 font-extralight mb-8">Monitor and optimize your outreach</p>

          {loading ? (
            <div className="text-center py-12 text-gray-400 font-extralight">
              Loading campaigns...
            </div>
          ) : campaigns.length === 0 ? (
            <div className="border border-gray-800 rounded-lg p-12 text-center">
              <p className="text-gray-400 font-extralight">
                No active campaigns. Create your first campaign above.
              </p>
            </div>
          ) : (
            <div className="grid gap-6">
              {campaigns.map((campaign) => (
                <div key={campaign.id} className="border border-gray-800 rounded-lg p-6 hover:border-gray-700 transition-colors">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-light mb-1">{campaign.name}</h3>
                      <p className="text-gray-400 font-extralight">{campaign.targetAudience}</p>
                    </div>
                    <span className={`text-sm font-extralight px-3 py-1 rounded-full ${
                      campaign.status === 'active' 
                        ? 'bg-green-900/30 text-green-400 border border-green-800' 
                        : campaign.status === 'paused'
                        ? 'bg-yellow-900/30 text-yellow-400 border border-yellow-800'
                        : 'bg-gray-900/30 text-gray-400 border border-gray-800'
                    }`}>
                      {campaign.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-4 gap-4 mb-4">
                    <div>
                      <p className="text-2xl font-light">{campaign.messagesSent || 0}</p>
                      <p className="text-gray-400 font-extralight text-sm">Sent</p>
                    </div>
                    <div>
                      <p className="text-2xl font-light">{campaign.opened || 0}</p>
                      <p className="text-gray-400 font-extralight text-sm">Opened</p>
                    </div>
                    <div>
                      <p className="text-2xl font-light">{campaign.replied || 0}</p>
                      <p className="text-gray-400 font-extralight text-sm">Replied</p>
                    </div>
                    <div>
                      <p className="text-2xl font-light">{campaign.conversionRate || 0}%</p>
                      <p className="text-gray-400 font-extralight text-sm">Conversion</p>
                    </div>
                  </div>

                  <div className="flex space-x-4">
                    <button className="text-indigo-400 hover:text-indigo-300 transition-colors font-light">
                      View Details
                    </button>
                    <button className="text-gray-400 hover:text-white transition-colors font-light">
                      {campaign.status === 'active' ? 'Pause' : 'Resume'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Campaigns;
