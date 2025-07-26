import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { analyticsService } from '../services/analytics.service';
import { prospectService } from '../services/prospects.service';
import { campaignService } from '../services/campaigns.service';
import MetricCard from '../components/MetricCard';
import ActivityFeed from '../components/ActivityFeed';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState({
    prospects: 0,
    campaigns: 0,
    responses: 0,
    meetings: 0,
    growth: 0
  });
  const [agentStatus, setAgentStatus] = useState({
    scout: { active: true, prospects: 0, processing: 0 },
    analyst: { active: true, enriched: 0, processing: 0 },
    strategist: { active: true, campaigns: 0, processing: 0 },
    executor: { active: true, messages: 0, processing: 0 }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      const [analyticsData, prospectsData, campaignsData, agentsData] = await Promise.all([
        analyticsService.getMetrics(),
        prospectService.list({ limit: 5 }),
        campaignService.list({ limit: 5 }),
        analyticsService.getAgentActivity()
      ]);

      setMetrics({
        prospects: analyticsData.data?.totalProspects || 0,
        campaigns: analyticsData.data?.activeCampaigns || 0,
        responses: analyticsData.data?.responses || 0,
        meetings: analyticsData.data?.meetings || 0,
        growth: analyticsData.data?.growthRate || 0
      });

      // Simulate agent status updates
      setAgentStatus({
        scout: { 
          active: true, 
          prospects: agentsData.data?.scout?.discovered || 247, 
          processing: Math.floor(Math.random() * 10) 
        },
        analyst: { 
          active: true, 
          enriched: agentsData.data?.analyst?.enriched || 198, 
          processing: Math.floor(Math.random() * 10) 
        },
        strategist: { 
          active: true, 
          campaigns: agentsData.data?.strategist?.designed || 15, 
          processing: Math.floor(Math.random() * 5) 
        },
        executor: { 
          active: true, 
          messages: agentsData.data?.executor?.sent || 342, 
          processing: Math.floor(Math.random() * 20) 
        }
      });
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black">
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-light tracking-tight text-white mb-2">
            Welcome back, {user?.user_metadata?.name || 'there'}
          </h1>
          <p className="text-gray-400 font-extralight">
            Your AI agents are actively working on {metrics.campaigns} campaigns
          </p>
        </div>

        <div className="h-px bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent mb-8"></div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-12">
          <MetricCard
            title="Total Prospects"
            value={metrics.prospects}
            trend="+12%"
            trendUp={true}
          />
          <MetricCard
            title="Active Campaigns"
            value={metrics.campaigns}
            trend="+8%"
            trendUp={true}
          />
          <MetricCard
            title="Responses"
            value={metrics.responses}
            trend="+24%"
            trendUp={true}
          />
          <MetricCard
            title="Meetings Booked"
            value={metrics.meetings}
            trend="+15%"
            trendUp={true}
          />
          <MetricCard
            title="Pipeline Growth"
            value={`${metrics.growth}%`}
            trend="+5%"
            trendUp={true}
          />
        </div>

        {/* AI Agents Status */}
        <div className="mb-12">
          <h2 className="text-2xl font-light tracking-tight text-white mb-6">
            AI Agent Activity
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Scout Agent */}
            <div className="bg-gray-900/30 backdrop-blur-sm border border-gray-800 rounded-lg p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="text-indigo-400 text-sm font-medium mb-1">SCOUT</div>
                  <h3 className="text-lg font-light text-white">Discovery Agent</h3>
                </div>
                <div className={`w-2 h-2 rounded-full ${agentStatus.scout.active ? 'bg-green-400 animate-pulse' : 'bg-gray-600'}`}></div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Prospects Found</span>
                  <span className="text-white font-medium">{agentStatus.scout.prospects}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Processing</span>
                  <span className="text-white font-medium">{agentStatus.scout.processing}</span>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-800">
                  <div className="text-xs text-gray-500 mb-2">Current Task</div>
                  <div className="text-sm text-gray-300">Scanning tech companies in SF Bay Area...</div>
                </div>
              </div>
            </div>

            {/* Analyst Agent */}
            <div className="bg-gray-900/30 backdrop-blur-sm border border-gray-800 rounded-lg p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="text-purple-400 text-sm font-medium mb-1">ANALYST</div>
                  <h3 className="text-lg font-light text-white">Intelligence Agent</h3>
                </div>
                <div className={`w-2 h-2 rounded-full ${agentStatus.analyst.active ? 'bg-green-400 animate-pulse' : 'bg-gray-600'}`}></div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Enriched</span>
                  <span className="text-white font-medium">{agentStatus.analyst.enriched}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Processing</span>
                  <span className="text-white font-medium">{agentStatus.analyst.processing}</span>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-800">
                  <div className="text-xs text-gray-500 mb-2">Current Task</div>
                  <div className="text-sm text-gray-300">Analyzing prospect engagement patterns...</div>
                </div>
              </div>
            </div>

            {/* Strategist Agent */}
            <div className="bg-gray-900/30 backdrop-blur-sm border border-gray-800 rounded-lg p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="text-blue-400 text-sm font-medium mb-1">STRATEGIST</div>
                  <h3 className="text-lg font-light text-white">Campaign Agent</h3>
                </div>
                <div className={`w-2 h-2 rounded-full ${agentStatus.strategist.active ? 'bg-green-400 animate-pulse' : 'bg-gray-600'}`}></div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Campaigns</span>
                  <span className="text-white font-medium">{agentStatus.strategist.campaigns}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Processing</span>
                  <span className="text-white font-medium">{agentStatus.strategist.processing}</span>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-800">
                  <div className="text-xs text-gray-500 mb-2">Current Task</div>
                  <div className="text-sm text-gray-300">Personalizing outreach for Series A startups...</div>
                </div>
              </div>
            </div>

            {/* Executor Agent */}
            <div className="bg-gray-900/30 backdrop-blur-sm border border-gray-800 rounded-lg p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="text-green-400 text-sm font-medium mb-1">EXECUTOR</div>
                  <h3 className="text-lg font-light text-white">Engagement Agent</h3>
                </div>
                <div className={`w-2 h-2 rounded-full ${agentStatus.executor.active ? 'bg-green-400 animate-pulse' : 'bg-gray-600'}`}></div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Messages Sent</span>
                  <span className="text-white font-medium">{agentStatus.executor.messages}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Processing</span>
                  <span className="text-white font-medium">{agentStatus.executor.processing}</span>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-800">
                  <div className="text-xs text-gray-500 mb-2">Current Task</div>
                  <div className="text-sm text-gray-300">Executing LinkedIn sequence for Campaign #42...</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="h-px bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent mb-8"></div>

        {/* Quick Actions & Activity Feed */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Quick Actions */}
          <div className="lg:col-span-1">
            <h2 className="text-2xl font-light tracking-tight text-white mb-6">
              Quick Actions
            </h2>
            <div className="space-y-3">
              <Link
                to="/prospects"
                className="block bg-gray-900/30 backdrop-blur-sm border border-gray-800 rounded-lg p-4 hover:bg-gray-900/50 transition-all"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-white font-light mb-1">Find New Prospects</h3>
                    <p className="text-sm text-gray-400">Launch AI discovery</p>
                  </div>
                  <div className="text-gray-400">→</div>
                </div>
              </Link>
              <Link
                to="/campaigns/new"
                className="block bg-gray-900/30 backdrop-blur-sm border border-gray-800 rounded-lg p-4 hover:bg-gray-900/50 transition-all"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-white font-light mb-1">Create Campaign</h3>
                    <p className="text-sm text-gray-400">Start new outreach</p>
                  </div>
                  <div className="text-gray-400">→</div>
                </div>
              </Link>
              <Link
                to="/analytics"
                className="block bg-gray-900/30 backdrop-blur-sm border border-gray-800 rounded-lg p-4 hover:bg-gray-900/50 transition-all"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-white font-light mb-1">View Analytics</h3>
                    <p className="text-sm text-gray-400">Performance insights</p>
                  </div>
                  <div className="text-gray-400">→</div>
                </div>
              </Link>
            </div>
          </div>

          {/* Activity Feed */}
          <div className="lg:col-span-2">
            <h2 className="text-2xl font-light tracking-tight text-white mb-6">
              Recent Activity
            </h2>
            <ActivityFeed />
          </div>
        </div>

        {/* Human-in-the-Loop Control */}
        <div className="mt-12">
          <div className="bg-indigo-900/20 border border-indigo-500/30 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-light text-white mb-2">Human-in-the-Loop Control Active</h3>
                <p className="text-sm text-gray-400">
                  You have 3 campaigns awaiting approval before execution
                </p>
              </div>
              <Link
                to="/campaigns?filter=pending"
                className="bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 px-4 py-2 rounded-md text-sm transition-all"
              >
                Review Campaigns
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
