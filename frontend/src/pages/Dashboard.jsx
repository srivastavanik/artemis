import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { analyticsService } from '../services/analytics.service';
import ActivityFeed from '../components/ActivityFeed';

const Dashboard = () => {
  const [metrics, setMetrics] = useState({
    totalProspects: 2847,
    activeCampaigns: 15,
    conversionRate: 24,
    roi: 312,
    prospectsGrowth: 12,
    campaignsGrowth: 8,
    conversionGrowth: 5,
    roiGrowth: 18
  });

  const [agentStatus, setAgentStatus] = useState({
    scout: { status: 'active', message: 'Discovering new prospects...' },
    analyst: { status: 'active', message: 'Analyzing prospect data...' },
    strategist: { status: 'idle', message: 'Ready to design campaigns' },
    executor: { status: 'idle', message: 'Awaiting campaign approval' }
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const dashboardData = await analyticsService.getDashboardMetrics();
      if (dashboardData) {
        setMetrics(dashboardData);
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-light tracking-tight mb-4">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">
              Sales Intelligence
            </span>{' '}
            that drives results
          </h1>
          <p className="text-gray-400 font-extralight text-lg">
            AI-powered prospect discovery and engagement at scale
          </p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <div className="border border-gray-800 rounded-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-gray-400 font-extralight">Total Prospects</p>
              <span className="text-green-400 text-sm font-light">+{metrics.prospectsGrowth}%</span>
            </div>
            <p className="text-3xl font-light">{metrics.totalProspects.toLocaleString()}</p>
          </div>

          <div className="border border-gray-800 rounded-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-gray-400 font-extralight">Active Campaigns</p>
              <span className="text-green-400 text-sm font-light">+{metrics.campaignsGrowth}%</span>
            </div>
            <p className="text-3xl font-light">{metrics.activeCampaigns}</p>
          </div>

          <div className="border border-gray-800 rounded-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-gray-400 font-extralight">Conversion Rate</p>
              <span className="text-green-400 text-sm font-light">+{metrics.conversionGrowth}%</span>
            </div>
            <p className="text-3xl font-light">{metrics.conversionRate}%</p>
          </div>

          <div className="border border-gray-800 rounded-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-gray-400 font-extralight">ROI</p>
              <span className="text-green-400 text-sm font-light">+{metrics.roiGrowth}%</span>
            </div>
            <p className="text-3xl font-light">{metrics.roi}%</p>
          </div>
        </div>

        <div className="h-px bg-gradient-to-r from-transparent via-gray-800 to-transparent my-12"></div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* AI Agent Status */}
          <div className="lg:col-span-2">
            <h2 className="text-2xl font-light tracking-tight mb-6">AI Agent Status</h2>
            <div className="space-y-4">
              {Object.entries(agentStatus).map(([agent, status]) => (
                <div key={agent} className="border border-gray-800 rounded-lg p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center space-x-3">
                        <div className={`w-2 h-2 rounded-full ${
                          status.status === 'active' ? 'bg-green-400' : 'bg-gray-600'
                        } ${status.status === 'active' ? 'animate-pulse' : ''}`}></div>
                        <h3 className="text-lg font-light capitalize">{agent} Agent</h3>
                      </div>
                      <p className="text-gray-400 font-extralight text-sm mt-1">{status.message}</p>
                    </div>
                    <span className={`text-sm font-extralight ${
                      status.status === 'active' ? 'text-green-400' : 'text-gray-500'
                    }`}>
                      {status.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div>
            <h2 className="text-2xl font-light tracking-tight mb-6">Quick Actions</h2>
            <div className="space-y-4">
              <Link to="/prospects" className="block border border-gray-800 rounded-lg p-6 hover:border-indigo-500/50 transition-colors">
                <h3 className="text-lg font-light mb-2">Discover Prospects</h3>
                <p className="text-gray-400 font-extralight text-sm">
                  Find new leads with AI
                </p>
              </Link>
              <Link to="/campaigns" className="block border border-gray-800 rounded-lg p-6 hover:border-indigo-500/50 transition-colors">
                <h3 className="text-lg font-light mb-2">Create Campaign</h3>
                <p className="text-gray-400 font-extralight text-sm">
                  Design multi-channel outreach
                </p>
              </Link>
              <Link to="/analytics" className="block border border-gray-800 rounded-lg p-6 hover:border-indigo-500/50 transition-colors">
                <h3 className="text-lg font-light mb-2">View Analytics</h3>
                <p className="text-gray-400 font-extralight text-sm">
                  Track performance metrics
                </p>
              </Link>
            </div>
          </div>
        </div>

        <div className="h-px bg-gradient-to-r from-transparent via-gray-800 to-transparent my-12"></div>

        {/* Recent Activity */}
        <div>
          <h2 className="text-2xl font-light tracking-tight mb-6">Recent Activity</h2>
          <ActivityFeed />
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
