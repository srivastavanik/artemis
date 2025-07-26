import { useState, useEffect } from 'react';
import MetricCard from '../components/MetricCard';
import axios from 'axios';

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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // fetchDashboardData();
    // Using demo data for now
    setRecentActivity([
      { description: 'New prospect discovered: TechCorp Inc.', timestamp: '2 minutes ago' },
      { description: 'Campaign "Q1 Outreach" started', timestamp: '15 minutes ago' },
      { description: 'Email sent to john@example.com', timestamp: '1 hour ago' },
      { description: 'Lead scored: Acme Corp (Score: 85)', timestamp: '2 hours ago' }
    ]);
  }, []);

  const UserAvatars = () => (
    <div className="flex items-center justify-center">
      <div className="flex -space-x-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="w-12 h-12 rounded-full bg-gradient-to-br from-gray-600 to-gray-800 border-2 border-black/50"
          />
        ))}
      </div>
      <span className="ml-4 text-gray-300">+{metrics.activeUsers} active users</span>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Hero Metric Card */}
      <MetricCard
        type="hero"
        title="Total Messages"
        value={metrics.totalMessages}
        subtitle={[
          { label: 'Today', value: metrics.todayMessages },
          { label: 'This Week', value: metrics.weekMessages }
        ]}
      >
        <UserAvatars />
      </MetricCard>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Prospects"
          value={metrics.totalProspects}
        />
        <MetricCard
          title="Active Prospects"
          value={metrics.activeProspects}
        />
        <MetricCard
          title="Active Campaigns"
          value={metrics.campaignsActive}
        />
        <MetricCard
          title="Messages Scheduled"
          value={metrics.messagesScheduled}
        />
      </div>

      {/* Recent Activity */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-md border border-white/10 p-6">
        <h2 className="text-xl font-semibold text-gray-100 mb-6">Recent Activity</h2>
        {recentActivity.length > 0 ? (
          <div className="space-y-4">
            {recentActivity.map((activity, index) => (
              <div key={index} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-white/5 transition-colors duration-200">
                <div className="flex-1">
                  <p className="text-sm text-gray-200">{activity.description}</p>
                  <p className="text-xs text-gray-500 mt-1">{activity.timestamp}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-sm">No recent activity</p>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
