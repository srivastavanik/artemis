import { useState } from 'react';

function Settings() {
  const [activeTab, setActiveTab] = useState('api');
  const [apiKeys, setApiKeys] = useState({
    brightdata: '••••••••••••••••',
    llamaindex: '••••••••••••••••',
    arcade: '••••••••••••••••',
    supabase: '••••••••••••••••'
  });

  const tabs = [
    { id: 'api', name: 'API Configuration' },
    { id: 'agents', name: 'AI Agents' },
    { id: 'channels', name: 'Channels' },
    { id: 'team', name: 'Team' },
  ];

  const agentSettings = [
    { name: 'Scout Agent', status: 'active', tasks: 3456, accuracy: 94.2 },
    { name: 'Analyst Agent', status: 'active', tasks: 2890, accuracy: 91.8 },
    { name: 'Strategist Agent', status: 'active', tasks: 1203, accuracy: 96.5 },
    { name: 'Executor Agent', status: 'active', tasks: 4567, accuracy: 89.3 },
  ];

  return (
    <div className="container mx-auto px-6 py-16">
      <div className="animate-fade-in">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-extralight tracking-tighter mb-4">
            <span className="gradient-text">Platform</span> Settings
          </h1>
          <p className="text-gray-400 text-lg font-extralight">
            Configure your AI-powered sales intelligence system
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-6 mb-12 border-b border-indigo-500/10">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-4 px-2 text-sm font-light transition-all relative ${
                activeTab === tab.id
                  ? 'text-white'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              {tab.name}
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-indigo-400 to-purple-400"></div>
              )}
            </button>
          ))}
        </div>

        {/* API Configuration Tab */}
        {activeTab === 'api' && (
          <div className="space-y-8">
            <div className="card">
              <h3 className="text-xl font-light mb-6">Sponsor API Keys</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2 font-light">BrightData API Key</label>
                  <div className="flex gap-4">
                    <input
                      type="password"
                      className="input-field flex-1"
                      value={apiKeys.brightdata}
                      readOnly
                    />
                    <button className="btn-secondary btn-sm">Reveal</button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2 font-light">LlamaIndex API Key</label>
                  <div className="flex gap-4">
                    <input
                      type="password"
                      className="input-field flex-1"
                      value={apiKeys.llamaindex}
                      readOnly
                    />
                    <button className="btn-secondary btn-sm">Reveal</button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2 font-light">Arcade API Key</label>
                  <div className="flex gap-4">
                    <input
                      type="password"
                      className="input-field flex-1"
                      value={apiKeys.arcade}
                      readOnly
                    />
                    <button className="btn-secondary btn-sm">Reveal</button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2 font-light">Supabase URL & Key</label>
                  <div className="flex gap-4">
                    <input
                      type="password"
                      className="input-field flex-1"
                      value={apiKeys.supabase}
                      readOnly
                    />
                    <button className="btn-secondary btn-sm">Reveal</button>
                  </div>
                </div>
              </div>
            </div>

            <div className="card">
              <h3 className="text-xl font-light mb-6">Webhook Configuration</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2 font-light">Webhook URL</label>
                  <input
                    type="url"
                    className="input-field"
                    placeholder="https://your-webhook-endpoint.com/artemis"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2 font-light">Events</label>
                  <div className="space-y-2">
                    <label className="flex items-center gap-3 text-sm font-light">
                      <input type="checkbox" className="rounded border-indigo-500/30" defaultChecked />
                      <span>New prospect discovered</span>
                    </label>
                    <label className="flex items-center gap-3 text-sm font-light">
                      <input type="checkbox" className="rounded border-indigo-500/30" defaultChecked />
                      <span>Campaign completed</span>
                    </label>
                    <label className="flex items-center gap-3 text-sm font-light">
                      <input type="checkbox" className="rounded border-indigo-500/30" />
                      <span>High-value reply received</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* AI Agents Tab */}
        {activeTab === 'agents' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {agentSettings.map((agent) => (
                <div key={agent.name} className="card">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-normal mb-1">{agent.name}</h3>
                      <p className="text-sm text-green-400 font-light">Active</p>
                    </div>
                    <button className="text-sm text-indigo-400 hover:text-indigo-300 font-light">
                      Configure
                    </button>
                  </div>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400 font-extralight">Tasks Completed</span>
                      <span className="font-light">{agent.tasks.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400 font-extralight">Accuracy</span>
                      <span className="font-light">{agent.accuracy}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="card">
              <h3 className="text-xl font-light mb-6">Agent Collaboration Rules</h3>
              <div className="space-y-4">
                <div className="p-4 rounded-lg border border-indigo-500/10 bg-indigo-500/5">
                  <p className="text-sm font-light mb-2">Scout → Analyst Pipeline</p>
                  <p className="text-xs text-gray-400 font-extralight">
                    Automatically trigger analysis when Scout discovers high-potential prospects
                  </p>
                </div>
                <div className="p-4 rounded-lg border border-indigo-500/10 bg-indigo-500/5">
                  <p className="text-sm font-light mb-2">Strategist → Executor Workflow</p>
                  <p className="text-xs text-gray-400 font-extralight">
                    Execute campaigns immediately after Strategist approval
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Channels Tab */}
        {activeTab === 'channels' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="card">
                <h3 className="text-lg font-normal mb-4">Email Configuration</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400 font-extralight">Provider</span>
                    <span className="font-light">SendGrid</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400 font-extralight">Daily Limit</span>
                    <span className="font-light">5,000</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400 font-extralight">Sent Today</span>
                    <span className="font-light">847</span>
                  </div>
                </div>
              </div>
              <div className="card">
                <h3 className="text-lg font-normal mb-4">LinkedIn Configuration</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400 font-extralight">Connection</span>
                    <span className="font-light text-green-400">Active</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400 font-extralight">Daily Limit</span>
                    <span className="font-light">100</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400 font-extralight">Sent Today</span>
                    <span className="font-light">32</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Team Tab */}
        {activeTab === 'team' && (
          <div className="space-y-8">
            <div className="card">
              <h3 className="text-xl font-light mb-6">Team Members</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg border border-indigo-500/10">
                  <div>
                    <p className="font-normal">Admin User</p>
                    <p className="text-sm text-gray-400 font-extralight">admin@artemis.ai</p>
                  </div>
                  <span className="text-sm text-gray-400 font-light">Owner</span>
                </div>
              </div>
              <button className="btn-secondary mt-6">
                Invite Team Member
              </button>
            </div>
          </div>
        )}

        {/* Save Button */}
        <div className="flex justify-end mt-12">
          <button className="btn-primary">
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}

export default Settings;
