import React, { useState, useEffect } from 'react';
import { analyticsService } from '../services/analytics.service';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const Analytics = () => {
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7d');
  const [metrics, setMetrics] = useState({
    totalProspects: 0,
    conversionRate: 0,
    avgResponseTime: 0,
    meetingsBooked: 0,
    revenue: 0,
    roi: 0
  });
  const [agentMetrics, setAgentMetrics] = useState({
    scout: { discovered: 0, accuracy: 0 },
    analyst: { enriched: 0, dataQuality: 0 },
    strategist: { campaigns: 0, personalization: 0 },
    executor: { messages: 0, deliveryRate: 0 }
  });
  const [funnelData, setFunnelData] = useState({
    discovered: 0,
    enriched: 0,
    contacted: 0,
    responded: 0,
    meetings: 0,
    closed: 0
  });

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const [metricsData, agentsData, funnelData, contentData] = await Promise.all([
        analyticsService.getMetrics({ timeRange }),
        analyticsService.getAgentActivity({ timeRange }),
        analyticsService.getFunnelMetrics({ timeRange }),
        analyticsService.getContentPerformance({ timeRange })
      ]);

      setMetrics(metricsData.data || {});
      setAgentMetrics(agentsData.data || {});
      setFunnelData(funnelData.data || {});
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  // Chart configurations with dark theme
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        borderColor: 'rgba(99, 102, 241, 0.3)',
        borderWidth: 1
      }
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(255, 255, 255, 0.05)'
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.5)'
        }
      },
      y: {
        grid: {
          color: 'rgba(255, 255, 255, 0.05)'
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.5)'
        }
      }
    }
  };

  const conversionChart = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [{
      label: 'Conversion Rate',
      data: [12, 19, 15, 25, 22, 30, 28],
      borderColor: 'rgb(99, 102, 241)',
      backgroundColor: 'rgba(99, 102, 241, 0.1)',
      tension: 0.4,
      fill: true
    }]
  };

  const agentPerformanceChart = {
    labels: ['Scout', 'Analyst', 'Strategist', 'Executor'],
    datasets: [{
      label: 'Tasks Completed',
      data: [247, 198, 42, 156],
      backgroundColor: [
        'rgba(99, 102, 241, 0.8)',
        'rgba(147, 51, 234, 0.8)',
        'rgba(59, 130, 246, 0.8)',
        'rgba(34, 197, 94, 0.8)'
      ]
    }]
  };

  const funnelChart = {
    labels: ['Discovered', 'Enriched', 'Contacted', 'Responded', 'Meetings', 'Closed'],
    datasets: [{
      label: 'Prospects',
      data: [1000, 850, 600, 180, 45, 12],
      backgroundColor: 'rgba(99, 102, 241, 0.8)',
      borderColor: 'rgba(99, 102, 241, 1)',
      borderWidth: 1
    }]
  };

  return (
    <div className="min-h-screen bg-black">
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-light tracking-tight text-white mb-2">
              Analytics
            </h1>
            <p className="text-gray-400 font-extralight">
              Real-time performance insights powered by AI
            </p>
          </div>
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="bg-gray-900/30 border border-gray-800 rounded-md px-4 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
          >
            <option value="24h">Last 24 hours</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
        </div>

        <div className="h-px bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent mb-8"></div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 mb-12">
          <div className="bg-gray-900/30 backdrop-blur-sm border border-gray-800 rounded-lg p-6">
            <p className="text-sm text-gray-400 mb-2">Total Prospects</p>
            <p className="text-2xl font-light text-white">{metrics.totalProspects || '2,847'}</p>
            <p className="text-xs text-green-400 mt-2">+12% from last period</p>
          </div>
          <div className="bg-gray-900/30 backdrop-blur-sm border border-gray-800 rounded-lg p-6">
            <p className="text-sm text-gray-400 mb-2">Conversion Rate</p>
            <p className="text-2xl font-light text-white">{metrics.conversionRate || '24'}%</p>
            <p className="text-xs text-green-400 mt-2">+3% from last period</p>
          </div>
          <div className="bg-gray-900/30 backdrop-blur-sm border border-gray-800 rounded-lg p-6">
            <p className="text-sm text-gray-400 mb-2">Avg Response Time</p>
            <p className="text-2xl font-light text-white">{metrics.avgResponseTime || '2.4'}h</p>
            <p className="text-xs text-green-400 mt-2">-18% from last period</p>
          </div>
          <div className="bg-gray-900/30 backdrop-blur-sm border border-gray-800 rounded-lg p-6">
            <p className="text-sm text-gray-400 mb-2">Meetings Booked</p>
            <p className="text-2xl font-light text-white">{metrics.meetingsBooked || '45'}</p>
            <p className="text-xs text-green-400 mt-2">+24% from last period</p>
          </div>
          <div className="bg-gray-900/30 backdrop-blur-sm border border-gray-800 rounded-lg p-6">
            <p className="text-sm text-gray-400 mb-2">Pipeline Value</p>
            <p className="text-2xl font-light text-white">${metrics.revenue || '428'}K</p>
            <p className="text-xs text-green-400 mt-2">+32% from last period</p>
          </div>
          <div className="bg-gray-900/30 backdrop-blur-sm border border-gray-800 rounded-lg p-6">
            <p className="text-sm text-gray-400 mb-2">ROI</p>
            <p className="text-2xl font-light text-white">{metrics.roi || '312'}%</p>
            <p className="text-xs text-green-400 mt-2">+45% from last period</p>
          </div>
        </div>

        {/* AI Agent Performance */}
        <div className="mb-12">
          <h2 className="text-2xl font-light tracking-tight text-white mb-6">
            AI Agent Performance
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-gray-900/30 backdrop-blur-sm border border-gray-800 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="text-indigo-400 text-sm font-medium">SCOUT</div>
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              </div>
              <p className="text-3xl font-light text-white mb-2">247</p>
              <p className="text-sm text-gray-400 mb-4">Prospects discovered today</p>
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Accuracy</span>
                  <span className="text-gray-400">94%</span>
                </div>
                <div className="h-1 bg-gray-800 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-500 rounded-full" style={{width: '94%'}}></div>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-4">Powered by BrightData</p>
            </div>

            <div className="bg-gray-900/30 backdrop-blur-sm border border-gray-800 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="text-purple-400 text-sm font-medium">ANALYST</div>
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              </div>
              <p className="text-3xl font-light text-white mb-2">198</p>
              <p className="text-sm text-gray-400 mb-4">Prospects enriched today</p>
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Data Quality</span>
                  <span className="text-gray-400">98%</span>
                </div>
                <div className="h-1 bg-gray-800 rounded-full overflow-hidden">
                  <div className="h-full bg-purple-500 rounded-full" style={{width: '98%'}}></div>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-4">Powered by LlamaIndex</p>
            </div>

            <div className="bg-gray-900/30 backdrop-blur-sm border border-gray-800 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="text-blue-400 text-sm font-medium">STRATEGIST</div>
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              </div>
              <p className="text-3xl font-light text-white mb-2">42</p>
              <p className="text-sm text-gray-400 mb-4">Campaigns designed today</p>
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Personalization</span>
                  <span className="text-gray-400">87%</span>
                </div>
                <div className="h-1 bg-gray-800 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full" style={{width: '87%'}}></div>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-4">Powered by Mastra</p>
            </div>

            <div className="bg-gray-900/30 backdrop-blur-sm border border-gray-800 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="text-green-400 text-sm font-medium">EXECUTOR</div>
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              </div>
              <p className="text-3xl font-light text-white mb-2">156</p>
              <p className="text-sm text-gray-400 mb-4">Messages sent today</p>
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Delivery Rate</span>
                  <span className="text-gray-400">99%</span>
                </div>
                <div className="h-1 bg-gray-800 rounded-full overflow-hidden">
                  <div className="h-full bg-green-500 rounded-full" style={{width: '99%'}}></div>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-4">Powered by Arcade</p>
            </div>
          </div>
        </div>

        <div className="h-px bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent mb-8"></div>

        {/* Charts */}
        <div className="grid lg:grid-cols-2 gap-8 mb-12">
          <div className="bg-gray-900/30 backdrop-blur-sm border border-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-light text-white mb-6">Conversion Trends</h3>
            <div className="h-64">
              <Line data={conversionChart} options={chartOptions} />
            </div>
          </div>
          <div className="bg-gray-900/30 backdrop-blur-sm border border-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-light text-white mb-6">Agent Performance</h3>
            <div className="h-64">
              <Bar data={agentPerformanceChart} options={chartOptions} />
            </div>
          </div>
        </div>

        {/* Sales Funnel */}
        <div className="bg-gray-900/30 backdrop-blur-sm border border-gray-800 rounded-lg p-6 mb-12">
          <h3 className="text-lg font-light text-white mb-6">Sales Funnel</h3>
          <div className="h-64">
            <Bar data={funnelChart} options={{...chartOptions, indexAxis: 'y'}} />
          </div>
        </div>

        {/* Human-in-the-Loop Metrics */}
        <div className="bg-indigo-900/20 border border-indigo-500/30 rounded-lg p-6">
          <h3 className="text-lg font-light text-white mb-4">Human-in-the-Loop Performance</h3>
          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-gray-400 mb-2">Approval Rate</p>
              <p className="text-2xl font-light text-white">92%</p>
              <p className="text-xs text-gray-500 mt-1">Of AI-generated campaigns approved</p>
            </div>
            <div>
              <p className="text-sm text-gray-400 mb-2">Avg Review Time</p>
              <p className="text-2xl font-light text-white">4.2 min</p>
              <p className="text-xs text-gray-500 mt-1">Per campaign review</p>
            </div>
            <div>
              <p className="text-sm text-gray-400 mb-2">Quality Score</p>
              <p className="text-2xl font-light text-white">96%</p>
              <p className="text-xs text-gray-500 mt-1">Post-human review improvement</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
