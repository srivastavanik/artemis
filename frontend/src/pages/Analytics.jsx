import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { analyticsService } from '../services/analytics.service';

const Analytics = () => {
  const [timeRange, setTimeRange] = useState('7d');
  const [metrics, setMetrics] = useState({
    conversionRate: 12.5,
    conversionGrowth: 2.3,
    responseTime: 2.3,
    responseTimeDiff: -15,
    topMessage: 'Q1 Enterprise Solution',
    replyRate: 28,
    bestSendTime: '10:00 AM PST',
    openRate: 45
  });

  const [channelPerformance, setChannelPerformance] = useState([
    { channel: 'Email', sent: 3450, opened: 2100, replied: 420, conversion: 12.2 },
    { channel: 'LinkedIn', sent: 1200, opened: 950, replied: 180, conversion: 15.0 },
    { channel: 'Twitter', sent: 800, opened: 450, replied: 65, conversion: 8.1 }
  ]);

  useEffect(() => {
    loadAnalytics();
  }, [timeRange]);

  const loadAnalytics = async () => {
    try {
      const data = await analyticsService.getPerformanceMetrics(timeRange);
      if (data) {
        setMetrics(data);
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-light tracking-tight mb-4">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">
              Performance
            </span>{' '}
            Analytics
          </h1>
          <p className="text-gray-400 font-extralight text-lg">
            Data-driven insights to optimize your outreach
          </p>
        </div>

        {/* Time Range Selector */}
        <div className="flex space-x-4 mb-8">
          {[
            { value: '24h', label: 'Last 24 Hours' },
            { value: '7d', label: 'Last 7d' },
            { value: '30d', label: 'Last 30d' },
            { value: '90d', label: 'Last 90d' }
          ].map((range) => (
            <button
              key={range.value}
              onClick={() => setTimeRange(range.value)}
              className={`px-4 py-2 rounded-md transition-all font-light ${
                timeRange === range.value
                  ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/50'
                  : 'text-gray-400 hover:text-white border border-gray-800 hover:border-gray-700'
              }`}
            >
              {range.label}
            </button>
          ))}
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <div className="border border-gray-800 rounded-lg p-6">
            <h3 className="text-gray-400 font-extralight mb-3">Conversion Rate</h3>
            <p className="text-3xl font-light mb-1">{metrics.conversionRate}%</p>
            <p className={`text-sm font-extralight ${metrics.conversionGrowth > 0 ? 'text-green-400' : 'text-red-400'}`}>
              {metrics.conversionGrowth > 0 ? '+' : ''}{metrics.conversionGrowth}% from last period
            </p>
          </div>

          <div className="border border-gray-800 rounded-lg p-6">
            <h3 className="text-gray-400 font-extralight mb-3">Avg Response Time</h3>
            <p className="text-3xl font-light mb-1">{metrics.responseTime}h</p>
            <p className={`text-sm font-extralight ${metrics.responseTimeDiff < 0 ? 'text-green-400' : 'text-red-400'}`}>
              {metrics.responseTimeDiff} min faster
            </p>
          </div>

          <div className="border border-gray-800 rounded-lg p-6">
            <h3 className="text-gray-400 font-extralight mb-3">Top Message</h3>
            <p className="text-lg font-light mb-1">{metrics.topMessage}</p>
            <p className="text-sm font-extralight text-gray-400">
              {metrics.replyRate}% reply rate
            </p>
          </div>

          <div className="border border-gray-800 rounded-lg p-6">
            <h3 className="text-gray-400 font-extralight mb-3">Best Send Time</h3>
            <p className="text-lg font-light mb-1">{metrics.bestSendTime}</p>
            <p className="text-sm font-extralight text-gray-400">
              Based on opens
            </p>
          </div>
        </div>

        <div className="h-px bg-gradient-to-r from-transparent via-gray-800 to-transparent my-12"></div>

        {/* Channel Performance */}
        <div>
          <h2 className="text-2xl font-light tracking-tight mb-6">Channel Performance</h2>
          <p className="text-gray-400 font-extralight mb-8">Compare effectiveness across channels</p>

          <div className="border border-gray-800 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-800">
                    <th className="text-left py-4 px-6 font-light text-gray-400">Channel</th>
                    <th className="text-left py-4 px-6 font-light text-gray-400">Sent</th>
                    <th className="text-left py-4 px-6 font-light text-gray-400">Opened</th>
                    <th className="text-left py-4 px-6 font-light text-gray-400">Replied</th>
                    <th className="text-left py-4 px-6 font-light text-gray-400">Conversion</th>
                  </tr>
                </thead>
                <tbody>
                  {channelPerformance.map((channel) => (
                    <tr key={channel.channel} className="border-b border-gray-800">
                      <td className="py-4 px-6 font-light">{channel.channel}</td>
                      <td className="py-4 px-6 font-light">{channel.sent.toLocaleString()}</td>
                      <td className="py-4 px-6 font-light">{channel.opened.toLocaleString()}</td>
                      <td className="py-4 px-6 font-light">{channel.replied}</td>
                      <td className="py-4 px-6">
                        <div className="flex items-center">
                          <div className={`w-2 h-2 rounded-full mr-2 ${
                            channel.conversion >= 15 ? 'bg-green-400' :
                            channel.conversion >= 10 ? 'bg-yellow-400' : 'bg-red-400'
                          }`}></div>
                          <span className="font-light">{channel.conversion}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Agent Performance */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12">
            <div className="border border-gray-800 rounded-lg p-6">
              <h3 className="text-xl font-light mb-4">AI Agent Efficiency</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 font-extralight">Scout Agent</span>
                  <span className="font-light">2,847 prospects found</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 font-extralight">Analyst Agent</span>
                  <span className="font-light">98% accuracy</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 font-extralight">Strategist Agent</span>
                  <span className="font-light">15 campaigns designed</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 font-extralight">Executor Agent</span>
                  <span className="font-light">5,450 messages sent</span>
                </div>
              </div>
            </div>

            <div className="border border-gray-800 rounded-lg p-6">
              <h3 className="text-xl font-light mb-4">Conversion Funnel</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-gray-400 font-extralight">Prospects</span>
                    <span className="font-light">2,847</span>
                  </div>
                  <div className="w-full bg-gray-800 rounded-full h-2">
                    <div className="bg-indigo-500 h-2 rounded-full" style={{ width: '100%' }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-gray-400 font-extralight">Engaged</span>
                    <span className="font-light">1,423</span>
                  </div>
                  <div className="w-full bg-gray-800 rounded-full h-2">
                    <div className="bg-purple-500 h-2 rounded-full" style={{ width: '50%' }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-gray-400 font-extralight">Qualified</span>
                    <span className="font-light">854</span>
                  </div>
                  <div className="w-full bg-gray-800 rounded-full h-2">
                    <div className="bg-blue-500 h-2 rounded-full" style={{ width: '30%' }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-gray-400 font-extralight">Converted</span>
                    <span className="font-light">342</span>
                  </div>
                  <div className="w-full bg-gray-800 rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full" style={{ width: '12%' }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Analytics;
