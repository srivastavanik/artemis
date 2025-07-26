import { useState, useEffect } from 'react';
import MetricCard from '../components/MetricCard';
import axios from 'axios';

function Dashboard() {
  const [metrics, setMetrics] = useState({
    totalMessages: 0,
    todayMessages: 0,
    weekMessages: 0,
    activeUsers: 0,
    totalProspects: 0,
    activeProspects: 0,
    campaignsActive: 0,
    messagesScheduled: 0
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/analytics/dashboard`);
      if (response.data && response.data.metrics) {
        setMetrics(response.data.metrics);
      }
      setRecentActivity(response.data?.recentActivity || []);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

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
      <span className="ml-4 text-gray-300">+{metrics.activeUsers || 35} active users</span>
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
    <div className="min-h-screen bg-[#0a0a0a]">
      <div className="page-container space-y-8">
        {/* Hero Metric Card */}
        <MetricCard
          type="hero"
          title="Total Messages"
          value={metrics.totalMessages || 12500}
          subtitle={[
            { label: 'Today', value: metrics.todayMessages || 847 },
            { label: 'This Week', value: metrics.weekMessages || 2300 }
          ]}
        >
          <UserAvatars />
        </MetricCard>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title="Total Prospects"
            value={metrics.totalProspects || 1248}
          />
          <MetricCard
            title="Active Prospects"
            value={metrics.activeProspects || 892}
          />
          <MetricCard
            title="Active Campaigns"
            value={metrics.campaignsActive || 12}
          />
          <MetricCard
            title="Messages Scheduled"
            value={metrics.messagesScheduled || 3456}
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
    </div>
  );
}

export default Dashboard;
