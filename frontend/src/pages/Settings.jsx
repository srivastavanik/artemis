import React from 'react'
import { motion } from 'framer-motion'
import { 
  Settings as SettingsIcon, 
  User, 
  Bell, 
  Shield, 
  Palette, 
  Database,
  Key,
  Mail,
  Globe,
  Save,
  RefreshCw
} from 'lucide-react'

const Settings = () => {
  const [activeTab, setActiveTab] = React.useState('profile')
  const [settings, setSettings] = React.useState({
    profile: {
      name: 'John Doe',
      email: 'john.doe@artemis.ai',
      company: 'Artemis AI',
      role: 'Sales Manager'
    },
    notifications: {
      emailAlerts: true,
      prospectUpdates: true,
      campaignReports: true,
      systemNotifications: false
    },
    integrations: {
      brightdata: { connected: true, apiKey: '•••••••••••••' },
      llamaindex: { connected: true, apiKey: '•••••••••••••' },
      arcade: { connected: true, apiKey: '•••••••••••••' },
      mastra: { connected: false, apiKey: '' }
    }
  })

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'integrations', label: 'Integrations', icon: Database },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'appearance', label: 'Appearance', icon: Palette }
  ]

  const handleSave = () => {
    console.log('Saving settings:', settings)
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-text-secondary mt-2">
          Manage your account settings and preferences.
        </p>
      </div>

      <div className="flex gap-6">
        {/* Sidebar */}
        <div className="w-64">
          <nav className="space-y-1">
            {tabs.map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all
                    ${isActive 
                      ? 'bg-primary text-white' 
                      : 'hover:bg-bg-glass text-text-secondary hover:text-text-primary'
                    }
                  `}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{tab.label}</span>
                </button>
              )
            })}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1">
          <div className="glass-card">
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold">Profile Settings</h2>
                
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="label">Full Name</label>
                    <input
                      type="text"
                      value={settings.profile.name}
                      onChange={(e) => setSettings({
                        ...settings,
                        profile: { ...settings.profile, name: e.target.value }
                      })}
                      className="input w-full"
                    />
                  </div>
                  
                  <div>
                    <label className="label">Email Address</label>
                    <input
                      type="email"
                      value={settings.profile.email}
                      onChange={(e) => setSettings({
                        ...settings,
                        profile: { ...settings.profile, email: e.target.value }
                      })}
                      className="input w-full"
                    />
                  </div>
                  
                  <div>
                    <label className="label">Company</label>
                    <input
                      type="text"
                      value={settings.profile.company}
                      onChange={(e) => setSettings({
                        ...settings,
                        profile: { ...settings.profile, company: e.target.value }
                      })}
                      className="input w-full"
                    />
                  </div>
                  
                  <div>
                    <label className="label">Role</label>
                    <input
                      type="text"
                      value={settings.profile.role}
                      onChange={(e) => setSettings({
                        ...settings,
                        profile: { ...settings.profile, role: e.target.value }
                      })}
                      className="input w-full"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold">Notification Preferences</h2>
                
                <div className="space-y-4">
                  <label className="flex items-center justify-between p-4 rounded-lg bg-bg-glass cursor-pointer">
                    <div className="flex items-center gap-3">
                      <Mail className="w-5 h-5 text-primary" />
                      <div>
                        <p className="font-medium">Email Alerts</p>
                        <p className="text-sm text-text-tertiary">Receive important updates via email</p>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.notifications.emailAlerts}
                      onChange={(e) => setSettings({
                        ...settings,
                        notifications: { ...settings.notifications, emailAlerts: e.target.checked }
                      })}
                      className="toggle"
                    />
                  </label>
                  
                  <label className="flex items-center justify-between p-4 rounded-lg bg-bg-glass cursor-pointer">
                    <div className="flex items-center gap-3">
                      <User className="w-5 h-5 text-accent" />
                      <div>
                        <p className="font-medium">Prospect Updates</p>
                        <p className="text-sm text-text-tertiary">Get notified when prospects engage</p>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.notifications.prospectUpdates}
                      onChange={(e) => setSettings({
                        ...settings,
                        notifications: { ...settings.notifications, prospectUpdates: e.target.checked }
                      })}
                      className="toggle"
                    />
                  </label>
                  
                  <label className="flex items-center justify-between p-4 rounded-lg bg-bg-glass cursor-pointer">
                    <div className="flex items-center gap-3">
                      <SettingsIcon className="w-5 h-5 text-warning" />
                      <div>
                        <p className="font-medium">Campaign Reports</p>
                        <p className="text-sm text-text-tertiary">Weekly campaign performance summaries</p>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.notifications.campaignReports}
                      onChange={(e) => setSettings({
                        ...settings,
                        notifications: { ...settings.notifications, campaignReports: e.target.checked }
                      })}
                      className="toggle"
                    />
                  </label>
                </div>
              </div>
            )}

            {activeTab === 'integrations' && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold">API Integrations</h2>
                
                <div className="space-y-4">
                  {Object.entries(settings.integrations).map(([key, integration]) => (
                    <div key={key} className="p-4 rounded-lg bg-bg-glass">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-lg ${integration.connected ? 'bg-success/10' : 'bg-bg-tertiary'} flex items-center justify-center`}>
                            <Globe className={`w-5 h-5 ${integration.connected ? 'text-success' : 'text-text-tertiary'}`} />
                          </div>
                          <div>
                            <p className="font-medium capitalize">{key}</p>
                            <p className="text-sm text-text-tertiary">
                              {integration.connected ? 'Connected' : 'Not connected'}
                            </p>
                          </div>
                        </div>
                        
                        <button className={`btn ${integration.connected ? 'btn-ghost' : 'btn-primary'}`}>
                          {integration.connected ? 'Disconnect' : 'Connect'}
                        </button>
                      </div>
                      
                      {integration.connected && (
                        <div className="mt-3">
                          <label className="label">API Key</label>
                          <div className="flex items-center gap-2">
                            <input
                              type="password"
                              value={integration.apiKey}
                              readOnly
                              className="input flex-1"
                            />
                            <button className="btn btn-secondary">
                              <RefreshCw className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold">Security Settings</h2>
                
                <div className="p-4 rounded-lg bg-warning/10 border border-warning/20">
                  <p className="text-warning font-medium">Two-Factor Authentication</p>
                  <p className="text-sm text-text-secondary mt-1">
                    Add an extra layer of security to your account
                  </p>
                  <button className="btn btn-warning mt-3">
                    Enable 2FA
                  </button>
                </div>
                
                <div>
                  <h3 className="font-medium mb-3">Change Password</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="label">Current Password</label>
                      <input type="password" className="input w-full" />
                    </div>
                    <div>
                      <label className="label">New Password</label>
                      <input type="password" className="input w-full" />
                    </div>
                    <div>
                      <label className="label">Confirm New Password</label>
                      <input type="password" className="input w-full" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'appearance' && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold">Appearance Settings</h2>
                
                <div>
                  <h3 className="font-medium mb-3">Theme</h3>
                  <div className="grid grid-cols-3 gap-3">
                    {['Dark', 'Light', 'System'].map((theme) => (
                      <button
                        key={theme}
                        className={`p-4 rounded-lg border-2 transition-all ${
                          theme === 'Dark' 
                            ? 'border-primary bg-primary/10' 
                            : 'border-border-secondary hover:border-border-primary'
                        }`}
                      >
                        <p className="font-medium">{theme}</p>
                      </button>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h3 className="font-medium mb-3">Accent Color</h3>
                  <div className="flex items-center gap-3">
                    {['#6366f1', '#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444'].map((color) => (
                      <button
                        key={color}
                        className="w-10 h-10 rounded-lg"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Save Button */}
          <div className="mt-6 flex justify-end">
            <button onClick={handleSave} className="btn btn-primary">
              <Save className="w-4 h-4" />
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export default Settings
