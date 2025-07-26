import { useState, useEffect } from 'react';
import axios from 'axios';

function Analytics() {
  const [analytics, setAnalytics] = useState({
    conversion: { rate: 0, trend: 'neutral' },
    response: { rate: 0, trend: 'neutral' },
    engagement: { score: 0, trend: 'neutral' },
    roi: { value: 0, trend: 'neutral' }
  });
  const [campaignMetrics, setCampaignMetrics] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/analytics`);
      setAnalytics(response.data.metrics || analytics);
      setCampaignMetrics(response.data.campaigns || []);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
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
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Analytics</h1>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card">
          <div className="text-sm text-neutral-600 mb-2">Conversion Rate</div>
          <div className="metric-value">{analytics.conversion.rate}%</div>
          <div className={`text-sm mt-1 ${analytics.conversion.trend === 'up' ? 'text-green-600' : 'text-neutral-500'}`}>
            vs last period
          </div>
        </div>
        
        <div className="card">
          <div className="text-sm text-neutral-600 mb-2">Response Rate</div>
          <div className="metric-value">{analytics.response.rate}%</div>
          <div className={`text-sm mt-1 ${analytics.response.trend === 'up' ? 'text-green-600' : 'text-neutral-500'}`}>
            vs last period
          </div>
        </div>
        
        <div className="card">
          <div className="text-sm text-neutral-600 mb-2">Engagement Score</div>
          <div className="metric-value">{analytics.engagement.score}</div>
          <div className={`text-sm mt-1 ${analytics.engagement.trend === 'up' ? 'text-green-600' : 'text-neutral-500'}`}>
            vs last period
          </div>
        </div>
        
        <div className="card">
          <div className="text-sm text-neutral-600 mb-2">ROI</div>
          <div className="metric-value">${analytics.roi.value}</div>
          <div className={`text-sm mt-1 ${analytics.roi.trend === 'up' ? 'text-green-600' : 'text-neutral-500'}`}>
            vs last period
          </div>
        </div>
      </div>

      {/* Campaign Performance */}
      <div className="card p-0">
        <div className="p-6 border-b border-neutral-200">
          <h2 className="text-lg font-semibold">Campaign Performance</h2>
        </div>
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Campaign</th>
                <th>Sent</th>
                <th>Opens</th>
                <th>Clicks</th>
                <th>Conversions</th>
                <th>Revenue</th>
              </tr>
            </thead>
            <tbody>
              {campaignMetrics.length > 0 ? (
                campaignMetrics.map((campaign) => (
                  <tr key={campaign.id}>
                    <td className="font-medium">{campaign.name}</td>
                    <td>{campaign.sent || 0}</td>
                    <td>{campaign.opens || 0}</td>
                    <td>{campaign.clicks || 0}</td>
                    <td>{campaign.conversions || 0}</td>
                    <td>${campaign.revenue || 0}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="text-center text-neutral-500">
                    No campaign data available
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

export default Analytics;
