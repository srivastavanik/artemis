import { useState, useEffect } from 'react';
import axios from 'axios';

function Settings() {
  const [apiKeys, setApiKeys] = useState({
    brightdata: '',
    llamaindex: '',
    arcade: '',
    openai: ''
  });
  const [preferences, setPreferences] = useState({
    emailNotifications: true,
    autoEnrichment: false,
    defaultCampaignType: 'email'
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/settings`);
      if (response.data.apiKeys) {
        setApiKeys(response.data.apiKeys);
      }
      if (response.data.preferences) {
        setPreferences(response.data.preferences);
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveApiKeys = async () => {
    setSaving(true);
    try {
      await axios.put(`${import.meta.env.VITE_API_URL}/settings/api-keys`, apiKeys);
      alert('API keys updated successfully');
    } catch (error) {
      console.error('Failed to save API keys:', error);
      alert('Failed to save API keys');
    } finally {
      setSaving(false);
    }
  };

  const handleSavePreferences = async () => {
    setSaving(true);
    try {
      await axios.put(`${import.meta.env.VITE_API_URL}/settings/preferences`, preferences);
      alert('Preferences updated successfully');
    } catch (error) {
      console.error('Failed to save preferences:', error);
      alert('Failed to save preferences');
    } finally {
      setSaving(false);
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
      <h1 className="text-2xl font-semibold">Settings</h1>

      {/* API Configuration */}
      <div className="card">
        <h2 className="text-lg font-semibold mb-4">API Configuration</h2>
        <div className="space-y-4">
          <div className="form-group">
            <label className="form-label">BrightData API Key</label>
            <input
              type="password"
              className="input-field"
              value={apiKeys.brightdata}
              onChange={(e) => setApiKeys({...apiKeys, brightdata: e.target.value})}
              placeholder="Enter your BrightData API key"
            />
          </div>
          
          <div className="form-group">
            <label className="form-label">LlamaIndex API Key</label>
            <input
              type="password"
              className="input-field"
              value={apiKeys.llamaindex}
              onChange={(e) => setApiKeys({...apiKeys, llamaindex: e.target.value})}
              placeholder="Enter your LlamaIndex API key"
            />
          </div>
          
          <div className="form-group">
            <label className="form-label">Arcade API Key</label>
            <input
              type="password"
              className="input-field"
              value={apiKeys.arcade}
              onChange={(e) => setApiKeys({...apiKeys, arcade: e.target.value})}
              placeholder="Enter your Arcade API key"
            />
          </div>
          
          <div className="form-group">
            <label className="form-label">OpenAI API Key (for AI agents)</label>
            <input
              type="password"
              className="input-field"
              value={apiKeys.openai}
              onChange={(e) => setApiKeys({...apiKeys, openai: e.target.value})}
              placeholder="Enter your OpenAI API key"
            />
          </div>
          
          <button
            onClick={handleSaveApiKeys}
            disabled={saving}
            className="btn-primary"
          >
            {saving ? 'Saving...' : 'Save API Keys'}
          </button>
        </div>
      </div>

      {/* Preferences */}
      <div className="card">
        <h2 className="text-lg font-semibold mb-4">Preferences</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Email Notifications</div>
              <div className="text-sm text-neutral-600">Receive updates about campaign performance</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={preferences.emailNotifications}
                onChange={(e) => setPreferences({...preferences, emailNotifications: e.target.checked})}
              />
              <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-neutral-900"></div>
            </label>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Auto-Enrichment</div>
              <div className="text-sm text-neutral-600">Automatically enrich new prospects</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={preferences.autoEnrichment}
                onChange={(e) => setPreferences({...preferences, autoEnrichment: e.target.checked})}
              />
              <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-neutral-900"></div>
            </label>
          </div>
          
          <div className="form-group">
            <label className="form-label">Default Campaign Type</label>
            <select
              className="input-field"
              value={preferences.defaultCampaignType}
              onChange={(e) => setPreferences({...preferences, defaultCampaignType: e.target.value})}
            >
              <option value="email">Email</option>
              <option value="sms">SMS</option>
              <option value="multi">Multi-channel</option>
            </select>
          </div>
          
          <button
            onClick={handleSavePreferences}
            disabled={saving}
            className="btn-primary"
          >
            {saving ? 'Saving...' : 'Save Preferences'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default Settings;
