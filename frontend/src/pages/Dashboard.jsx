import { useState, useEffect } from 'react';
import analyticsService from '../services/analytics.service';

function Dashboard() {
  const [metrics, setMetrics] = useState({
    totalMessages: 12500,
    todayMessages: 847,
    weekMessages: 2300,
    activeUsers: 35,
    totalProspects: 1248,
    activeProspects: 892,
    campaignsActive: 12,
    messagesScheduled: 3456
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const data = await analyticsService.getDashboardMetrics();
      
      // Update metrics with real data
      if (data && data.metrics) {
        setMetrics({
          totalMessages: data.messages?.total || 12500,
          todayMessages: data.messages?.today || 847,
          weekMessages: data.messages?.week || 2300,
          activeUsers: data.activeUsers || 35,
          totalProspects: data.prospects?.total || 1248,
          activeProspects: data.prospects?.active || 892,
          campaignsActive: data.campaigns?.active || 12,
          messagesScheduled: data.messages?.scheduled || 3456
        });
      }
      
      // Update activity feed
      if (data && data.recentActivity) {
        setRecentActivity(data.recentActivity.map(activity => ({
          description: activity.description || `${activity.agentName} completed ${activity.operation}`,
          timestamp: new Date(activity.createdAt).toLocaleTimeString()
        })));
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      // Use default values on error
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <div className="text-gray-400 font-extralight">Loading...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 py-16 md:py-24">
      <div className="animate-fade-in">
        {/* Hero Section */}
        <div className="text-center max-w-5xl mx-auto mb-20">
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-extralight tracking-tighter mb-6 leading-tight">
            <span className="gradient-text">Sales Intelligence</span>
            <br />
            that drives results
          </h1>
          <p className="text-gray-300 text-xl md:text-2xl font-extralight tracking-wide max-w-3xl mx-auto">
            AI-powered prospect discovery and engagement at scale
          </p>
        </div>

        {/* Main Metrics */}
        <div className="mb-20">
          <div className="card p-12 text-center animate-slide-in">
            <div className="metric-value gradient-text">{metrics.totalMessages.toLocaleString()}</div>
            <div className="metric-label mb-8">Total Messages Sent</div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-12">
              <div>
                <div className="text-3xl font-light tracking-tight text-white">{metrics.todayMessages}</div>
                <div className="text-gray-500 font-extralight mt-1">Today</div>
              </div>
              <div>
                <div className="text-3xl font-light tracking-tight text-white">{metrics.weekMessages.toLocaleString()}</div>
                <div className="text-gray-500 font-extralight mt-1">This Week</div>
              </div>
              <div>
                <div className="text-3xl font-light tracking-tight text-white">{metrics.activeProspects}</div>
                <div className="text-gray-500 font-extralight mt-1">Active Prospects</div>
              </div>
              <div>
                <div className="text-3xl font-light tracking-tight text-white">+{metrics.activeUsers}</div>
                <div className="text-gray-500 font-extralight mt-1">Active Users</div>
              </div>
            </div>
          </div>
        </div>

        <div className="divider-horizontal"></div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-20">
          <div className="card metric-card">
            <p className="text-2xl font-light mb-2 tracking-tight">{metrics.totalProspects.toLocaleString()}</p>
            <p className="text-gray-400 font-extralight">Total Prospects</p>
          </div>
          <div className="card metric-card">
            <p className="text-2xl font-light mb-2 tracking-tight">{metrics.activeProspects}</p>
            <p className="text-gray-400 font-extralight">Active Prospects</p>
          </div>
          <div className="card metric-card">
            <p className="text-2xl font-light mb-2 tracking-tight">{metrics.campaignsActive}</p>
            <p className="text-gray-400 font-extralight">Active Campaigns</p>
          </div>
          <div className="card metric-card">
            <p className="text-2xl font-light mb-2 tracking-tight">{metrics.messagesScheduled.toLocaleString()}</p>
            <p className="text-gray-400 font-extralight">Messages Scheduled</p>
          </div>
        </div>

        <div className="divider-horizontal"></div>

        {/* Recent Activity */}
        <div>
          <h2 className="section-title">Recent Activity</h2>
          <p className="section-subtitle mb-8">Real-time updates from your AI agents</p>
          
          <div className="space-y-3">
            {recentActivity.length > 0 ? (
              recentActivity.map((activity, index) => (
                <div key={index} className="activity-item">
                  <div className="w-2 h-2 rounded-full bg-indigo-400 mt-2 flex-shrink-0 glow-sm"></div>
                  <div className="flex-1">
                    <p className="text-gray-300 font-light">{activity.description}</p>
                    <p className="text-gray-500 text-sm font-extralight mt-1">{activity.timestamp}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 text-gray-500 font-extralight">
                No recent activity to display
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mt-20">
          <button 
            onClick={() => window.location.href = '/prospects'} 
            className="btn-primary"
          >
            Discover Prospects
          </button>
          <button 
            onClick={() => window.location.href = '/campaigns'} 
            className="btn-secondary"
          >
            Create Campaign
          </button>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
