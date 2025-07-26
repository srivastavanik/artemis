import { useState, useEffect } from 'react';
import axios from 'axios';

function Analytics() {
  const [timeRange, setTimeRange] = useState('7d');
  const [metrics, setMetrics] = useState({
    conversionRate: 12.5,
    avgResponseTime: '2.3h',
    topPerformingMessage: 'Q1 Enterprise Solution',
    bestTimeToSend: '10:00 AM PST'
  });

  const performanceData = [
    { channel: 'Email', sent: 3450, opened: 2100, replied: 420, conversion: 12.2 },
    { channel: 'LinkedIn', sent: 1200, opened: 950, replied: 180, conversion: 15.0 },
    { channel: 'Twitter', sent: 800, opened: 450, replied: 65, conversion: 8.1 },
    { channel: 'Phone', sent: 350, opened: 350, replied: 105, conversion: 30.0 },
  ];

  const engagementTrends = [
    { day: 'Mon', opens: 320, replies: 45 },
    { day: 'Tue', opens: 380, replies: 52 },
    { day: 'Wed', opens: 420, replies: 68 },
    { day: 'Thu', opens: 450, replies: 72 },
    { day: 'Fri', opens: 390, replies: 58 },
    { day: 'Sat', opens: 220, replies: 28 },
    { day: 'Sun', opens: 180, replies: 22 },
  ];

  return (
    <div className="container mx-auto px-6 py-16">
      <div className="animate-fade-in">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-extralight tracking-tighter mb-4">
            <span className="gradient-text">Performance</span> Analytics
          </h1>
          <p className="text-gray-400 text-lg font-extralight">
            Data-driven insights to optimize your outreach
          </p>
        </div>

        {/* Time Range Selector */}
        <div className="flex gap-2 mb-12">
          {['24h', '7d', '30d', '90d'].map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-2 rounded-md text-sm font-light transition-all ${
                timeRange === range
                  ? 'bg-indigo-500/20 text-white border border-indigo-500/30'
                  : 'text-gray-400 hover:text-white hover:bg-indigo-500/10'
              }`}
            >
              {range === '24h' ? 'Last 24 Hours' : `Last ${range}`}
            </button>
          ))}
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <div className="card">
            <div className="text-3xl font-light gradient-text mb-2">{metrics.conversionRate}%</div>
            <div className="text-gray-400 font-extralight">Conversion Rate</div>
            <div className="text-sm text-green-400 mt-2">↑ 2.3% from last period</div>
          </div>
          <div className="card">
            <div className="text-3xl font-light text-white mb-2">{metrics.avgResponseTime}</div>
            <div className="text-gray-400 font-extralight">Avg Response Time</div>
            <div className="text-sm text-gray-500 mt-2">15 min faster</div>
          </div>
          <div className="card">
            <div className="text-xl font-light text-white mb-2">{metrics.topPerformingMessage}</div>
            <div className="text-gray-400 font-extralight">Top Message</div>
            <div className="text-sm text-indigo-400 mt-2">28% reply rate</div>
          </div>
          <div className="card">
            <div className="text-xl font-light text-white mb-2">{metrics.bestTimeToSend}</div>
            <div className="text-gray-400 font-extralight">Best Send Time</div>
            <div className="text-sm text-gray-500 mt-2">Based on opens</div>
          </div>
        </div>

        <div className="divider-horizontal"></div>

        {/* Channel Performance */}
        <div className="mb-12">
          <h2 className="section-title">Channel Performance</h2>
          <p className="section-subtitle mb-8">Compare effectiveness across channels</p>

          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Channel</th>
                  <th>Sent</th>
                  <th>Opened</th>
                  <th>Replied</th>
                  <th>Conversion</th>
                </tr>
              </thead>
              <tbody>
                {performanceData.map((channel) => (
                  <tr key={channel.channel}>
                    <td className="font-normal">{channel.channel}</td>
                    <td>{channel.sent.toLocaleString()}</td>
                    <td>{channel.opened.toLocaleString()}</td>
                    <td>{channel.replied}</td>
                    <td>
                      <span className={channel.conversion > 12 ? 'text-green-400' : ''}>
                        {channel.conversion}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="divider-horizontal"></div>

        {/* Engagement Trends */}
        <div className="mb-12">
          <h2 className="section-title">Weekly Engagement</h2>
          <p className="section-subtitle mb-8">Opens and replies by day</p>

          <div className="card p-8">
            <div className="flex items-end justify-between h-64 gap-4">
              {engagementTrends.map((day) => (
                <div key={day.day} className="flex-1 flex flex-col items-center justify-end gap-2">
                  <div className="w-full flex flex-col gap-1">
                    <div 
                      className="w-full bg-indigo-500/30 rounded-t"
                      style={{ height: `${(day.opens / 450) * 200}px` }}
                    ></div>
                    <div 
                      className="w-full bg-purple-500/30 rounded-b"
                      style={{ height: `${(day.replies / 72) * 50}px` }}
                    ></div>
                  </div>
                  <span className="text-sm text-gray-400 font-extralight">{day.day}</span>
                </div>
              ))}
            </div>
            <div className="flex gap-6 mt-6 justify-center">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-indigo-500/30 rounded"></div>
                <span className="text-sm text-gray-400 font-light">Opens</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-purple-500/30 rounded"></div>
                <span className="text-sm text-gray-400 font-light">Replies</span>
              </div>
            </div>
          </div>
        </div>

        {/* AI Insights */}
        <div>
          <h2 className="section-title">AI Insights</h2>
          <p className="section-subtitle mb-8">Recommendations to improve performance</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="card">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-2 h-2 rounded-full bg-green-400 mt-2 glow-sm"></div>
                <div>
                  <h3 className="font-normal mb-2">Optimal Send Times</h3>
                  <p className="text-gray-400 font-extralight text-sm">
                    Your prospects are most active between 10-11 AM PST. Consider scheduling more messages during this window.
                  </p>
                </div>
              </div>
            </div>
            <div className="card">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-2 h-2 rounded-full bg-indigo-400 mt-2 glow-sm"></div>
                <div>
                  <h3 className="font-normal mb-2">Message Personalization</h3>
                  <p className="text-gray-400 font-extralight text-sm">
                    Messages mentioning specific company achievements have 3x higher reply rates.
                  </p>
                </div>
              </div>
            </div>
            <div className="card">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-2 h-2 rounded-full bg-purple-400 mt-2 glow-sm"></div>
                <div>
                  <h3 className="font-normal mb-2">Follow-up Strategy</h3>
                  <p className="text-gray-400 font-extralight text-sm">
                    Adding a second follow-up after 3 days increases conversion by 45%.
                  </p>
                </div>
              </div>
            </div>
            <div className="card">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-2 h-2 rounded-full bg-yellow-400 mt-2 glow-sm"></div>
                <div>
                  <h3 className="font-normal mb-2">Channel Mix</h3>
                  <p className="text-gray-400 font-extralight text-sm">
                    LinkedIn + Email combination shows highest engagement for enterprise prospects.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Analytics;
