import { useState, useEffect } from 'react';
import MetricCard from '../components/MetricCard';
import axios from 'axios';

function Dashboard() {
  const [metrics, setMetrics] = useState({
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
      setMetrics(response.data.metrics);
      setRecentActivity(response.data.recentActivity || []);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
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
    <div className="space-y-8">
      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Prospects"
          value={metrics.totalProspects}
          change={metrics.prospectsChange}
          trend={metrics.prospectsTrend}
        />
        <MetricCard
          title="Active Prospects"
          value={metrics.activeProspects}
          change={metrics.activeChange}
          trend={metrics.activeTrend}
        />
        <MetricCard
          title="Active Campaigns"
          value={metrics.campaignsActive}
          change={metrics.campaignsChange}
          trend={metrics.campaignsTrend}
        />
        <MetricCard
          title="Messages Scheduled"
          value={metrics.messagesScheduled}
          change={metrics.messagesChange}
          trend={metrics.messagesTrend}
        />
      </div>

      {/* Recent Activity */}
      <div className="card">
        <h2 className="section-title">Recent Activity</h2>
        {recentActivity.length > 0 ? (
          <div className="space-y-4">
            {recentActivity.map((activity, index) => (
              <div key={index} className="flex items-start gap-4 pb-4 border-b border-neutral-100 last:border-0">
                <div className="flex-1">
                  <p className="text-sm text-neutral-900">{activity.description}</p>
                  <p className="text-xs text-neutral-500 mt-1">{activity.timestamp}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-neutral-500 text-sm">No recent activity</p>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
