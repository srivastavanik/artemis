import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { campaignService } from '../services/campaigns.service';
import { prospectService } from '../services/prospects.service';
import { websocketService } from '../services/websocket.service';

const Campaigns = () => {
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [filters, setFilters] = useState({
    status: 'all',
    channel: 'all'
  });
  const [newCampaign, setNewCampaign] = useState({
    name: '',
    description: '',
    prospectCriteria: {
      industry: '',
      companySize: '',
      score_min: 0
    },
    channels: [],
    messageTemplate: '',
    schedule: {
      startDate: '',
      endDate: '',
      timezone: 'UTC'
    }
  });

  useEffect(() => {
    fetchCampaigns();

    // Listen for real-time updates
    const unsubscribe = websocketService.subscribe('campaign_update', (data) => {
      setCampaigns(prev => prev.map(c => c.id === data.id ? data : c));
    });

    return () => unsubscribe();
  }, [filters]);

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      const response = await campaignService.list(filters);
      setCampaigns(response.data || []);
    } catch (error) {
      console.error('Failed to fetch campaigns:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCampaign = async () => {
    try {
      const response = await campaignService.create(newCampaign);
      setCampaigns(prev => [response.data, ...prev]);
      setShowCreateModal(false);
      navigate(`/campaigns/${response.data.id}`);
    } catch (error) {
      console.error('Failed to create campaign:', error);
    }
  };

  const handleExecuteCampaign = async (campaignId) => {
    try {
      await campaignService.execute({ campaignId });
      fetchCampaigns();
    } catch (error) {
      console.error('Failed to execute campaign:', error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'text-green-400';
      case 'paused': return 'text-yellow-400';
      case 'completed': return 'text-blue-400';
      case 'draft': return 'text-gray-400';
      case 'pending_approval': return 'text-orange-400';
      default: return 'text-gray-400';
    }
  };

  const pendingApprovalCount = campaigns.filter(c => c.status === 'pending_approval').length;

  return (
    <div className="min-h-screen bg-black">
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-light tracking-tight text-white mb-2">
              Campaigns
            </h1>
            <p className="text-gray-400 font-extralight">
              {campaigns.length} total campaigns • {campaigns.filter(c => c.status === 'active').length} active
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-white text-black font-light rounded-md px-6 py-3 hover:bg-opacity-90 transition-all"
          >
            Create Campaign
          </button>
        </div>

        <div className="h-px bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent mb-8"></div>

        {/* Human-in-the-Loop Alert */}
        {pendingApprovalCount > 0 && (
          <div className="mb-8 bg-orange-900/20 border border-orange-500/30 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-3 h-3 bg-orange-400 rounded-full animate-pulse"></div>
                <div>
                  <h3 className="text-lg font-light text-white">Human Approval Required</h3>
                  <p className="text-sm text-gray-400">
                    {pendingApprovalCount} campaign{pendingApprovalCount > 1 ? 's' : ''} ready for your review
                  </p>
                </div>
              </div>
              <button
                onClick={() => setFilters({...filters, status: 'pending_approval'})}
                className="text-orange-300 hover:text-orange-200 text-sm transition-colors"
              >
                Review Now →
              </button>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex space-x-4 mb-8">
          <select
            value={filters.status}
            onChange={(e) => setFilters({...filters, status: e.target.value})}
            className="bg-gray-900/30 border border-gray-800 rounded-md px-4 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
          >
            <option value="all">All Status</option>
            <option value="pending_approval">Pending Approval</option>
            <option value="active">Active</option>
            <option value="paused">Paused</option>
            <option value="completed">Completed</option>
            <option value="draft">Draft</option>
          </select>
          <select
            value={filters.channel}
            onChange={(e) => setFilters({...filters, channel: e.target.value})}
            className="bg-gray-900/30 border border-gray-800 rounded-md px-4 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
          >
            <option value="all">All Channels</option>
            <option value="email">Email</option>
            <option value="linkedin">LinkedIn</option>
            <option value="multi">Multi-channel</option>
          </select>
        </div>

        {/* Campaigns Grid */}
        <div className="grid gap-6">
          {loading ? (
            <div className="bg-gray-900/30 backdrop-blur-sm border border-gray-800 rounded-lg p-12 text-center">
              <div className="text-gray-400">Loading campaigns...</div>
            </div>
          ) : campaigns.length === 0 ? (
            <div className="bg-gray-900/30 backdrop-blur-sm border border-gray-800 rounded-lg p-12 text-center">
              <p className="text-gray-400 mb-4">No campaigns found</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                Create your first campaign →
              </button>
            </div>
          ) : (
            campaigns.map((campaign) => (
              <div key={campaign.id} className="bg-gray-900/30 backdrop-blur-sm border border-gray-800 rounded-lg p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-light text-white mb-1">{campaign.name}</h3>
                    <p className="text-sm text-gray-400">{campaign.description}</p>
                  </div>
                  <span className={`text-sm font-medium ${getStatusColor(campaign.status)}`}>
                    {campaign.status.replace('_', ' ').toUpperCase()}
                  </span>
                </div>

                <div className="grid grid-cols-4 gap-4 mb-6">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Prospects</p>
                    <p className="text-lg font-light text-white">{campaign.prospect_count || 0}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Messages Sent</p>
                    <p className="text-lg font-light text-white">{campaign.messages_sent || 0}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Response Rate</p>
                    <p className="text-lg font-light text-white">{campaign.response_rate || 0}%</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Meetings</p>
                    <p className="text-lg font-light text-white">{campaign.meetings_booked || 0}</p>
                  </div>
                </div>

                {/* AI Agent Status */}
                <div className="flex items-center justify-between p-4 bg-black/30 rounded-lg mb-4">
                  <div className="flex items-center space-x-4">
                    <div className={`w-2 h-2 rounded-full ${campaign.status === 'active' ? 'bg-green-400 animate-pulse' : 'bg-gray-600'}`}></div>
                    <div>
                      <p className="text-sm text-gray-400">Executor Agent</p>
                      <p className="text-xs text-gray-500">
                        {campaign.status === 'active' ? 'Processing outreach sequences' : 'Awaiting activation'}
                      </p>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500">
                    Powered by Arcade
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-xs text-gray-500">
                    <span>Channels:</span>
                    {campaign.channels?.map((channel, idx) => (
                      <span key={idx} className="text-gray-400">{channel}</span>
                    ))}
                  </div>
                  <div className="flex items-center space-x-3">
                    {campaign.status === 'pending_approval' && (
                      <button
                        onClick={() => handleExecuteCampaign(campaign.id)}
                        className="bg-green-500/20 hover:bg-green-500/30 text-green-300 px-4 py-2 rounded-md text-sm transition-all"
                      >
                        Approve & Execute
                      </button>
                    )}
                    <Link
                      to={`/campaigns/${campaign.id}`}
                      className="text-indigo-400 hover:text-indigo-300 text-sm transition-colors"
                    >
                      View Details →
                    </Link>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Agent Orchestration Status */}
        <div className="mt-8 grid md:grid-cols-4 gap-6">
          <div className="bg-gray-900/30 backdrop-blur-sm border border-gray-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">Strategist</span>
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            </div>
            <p className="text-lg font-light text-white">15 Campaigns</p>
            <p className="text-xs text-gray-500 mt-1">AI-designed today</p>
          </div>
          <div className="bg-gray-900/30 backdrop-blur-sm border border-gray-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">Executor</span>
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            </div>
            <p className="text-lg font-light text-white">342 Messages</p>
            <p className="text-xs text-gray-500 mt-1">Sent via Arcade</p>
          </div>
          <div className="bg-gray-900/30 backdrop-blur-sm border border-gray-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">Mastra</span>
              <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
            </div>
            <p className="text-lg font-light text-white">Orchestrating</p>
            <p className="text-xs text-gray-500 mt-1">Multi-agent workflows</p>
          </div>
          <div className="bg-gray-900/30 backdrop-blur-sm border border-gray-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">Human Control</span>
              <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
            </div>
            <p className="text-lg font-light text-white">{pendingApprovalCount} Pending</p>
            <p className="text-xs text-gray-500 mt-1">Awaiting approval</p>
          </div>
        </div>
      </div>

      {/* Create Campaign Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-light text-white mb-6">Create New Campaign</h2>
            
            <div className="space-y-6">
              {/* Basic Info */}
              <div>
                <h3 className="text-lg font-light text-white mb-4">Campaign Details</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Campaign Name</label>
                    <input
                      type="text"
                      value={newCampaign.name}
                      onChange={(e) => setNewCampaign({...newCampaign, name: e.target.value})}
                      className="w-full bg-black border border-gray-800 rounded-md px-4 py-2 text-white focus:border-indigo-500 focus:outline-none"
                      placeholder="e.g., Q1 Enterprise Outreach"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Description</label>
                    <textarea
                      value={newCampaign.description}
                      onChange={(e) => setNewCampaign({...newCampaign, description: e.target.value})}
                      className="w-full bg-black border border-gray-800 rounded-md px-4 py-2 text-white focus:border-indigo-500 focus:outline-none"
                      rows="3"
                      placeholder="Describe your campaign goals..."
                    />
                  </div>
                </div>
              </div>

              {/* Target Criteria */}
              <div>
                <h3 className="text-lg font-light text-white mb-4">Target Prospects</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Industry</label>
                    <input
                      type="text"
                      value={newCampaign.prospectCriteria.industry}
                      onChange={(e) => setNewCampaign({
                        ...newCampaign,
                        prospectCriteria: {...newCampaign.prospectCriteria, industry: e.target.value}
                      })}
                      className="w-full bg-black border border-gray-800 rounded-md px-4 py-2 text-white focus:border-indigo-500 focus:outline-none"
                      placeholder="e.g., Technology"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Company Size</label>
                    <select
                      value={newCampaign.prospectCriteria.companySize}
                      onChange={(e) => setNewCampaign({
                        ...newCampaign,
                        prospectCriteria: {...newCampaign.prospectCriteria, companySize: e.target.value}
                      })}
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
                </div>
              </div>

              {/* Channels */}
              <div>
                <h3 className="text-lg font-light text-white mb-4">Outreach Channels</h3>
                <div className="flex space-x-4">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={newCampaign.channels.includes('email')}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setNewCampaign({...newCampaign, channels: [...newCampaign.channels, 'email']});
                        } else {
                          setNewCampaign({...newCampaign, channels: newCampaign.channels.filter(c => c !== 'email')});
                        }
                      }}
                      className="rounded border-gray-800 bg-black text-indigo-500"
                    />
                    <span className="text-white">Email</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={newCampaign.channels.includes('linkedin')}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setNewCampaign({...newCampaign, channels: [...newCampaign.channels, 'linkedin']});
                        } else {
                          setNewCampaign({...newCampaign, channels: newCampaign.channels.filter(c => c !== 'linkedin')});
                        }
                      }}
                      className="rounded border-gray-800 bg-black text-indigo-500"
                    />
                    <span className="text-white">LinkedIn</span>
                  </label>
                </div>
              </div>

              {/* AI Notice */}
              <div className="bg-indigo-900/20 border border-indigo-500/30 rounded-lg p-4">
                <p className="text-sm text-indigo-300">
                  The Strategist AI agent will design personalized messages for each prospect based on their profile.
                  You'll have the opportunity to review and approve before execution.
                </p>
              </div>
            </div>
            
            <div className="flex justify-end space-x-4 mt-8">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-6 py-2 text-gray-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateCampaign}
                className="bg-white text-black font-light rounded-md px-6 py-2 hover:bg-opacity-90 transition-all"
                disabled={!newCampaign.name || newCampaign.channels.length === 0}
              >
                Create Campaign
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Campaigns;
