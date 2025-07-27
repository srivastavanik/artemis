import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BuildingOfficeIcon, 
  UsersIcon, 
  BriefcaseIcon,
  SparklesIcon,
  CheckIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';
import authService from '../../services/auth.service';

export default function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [workspaceData, setWorkspaceData] = useState({
    name: '',
    slug: ''
  });
  
  const [profileData, setProfileData] = useState({
    role: '',
    teamSize: '',
    industry: ''
  });

  const generateSlug = (name) => {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  };

  const handleWorkspaceChange = (e) => {
    const { name, value } = e.target;
    setWorkspaceData(prev => ({
      ...prev,
      [name]: value,
      ...(name === 'name' ? { slug: generateSlug(value) } : {})
    }));
  };

  const handleProfileChange = (field, value) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleWorkspaceSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await authService.createWorkspace(workspaceData);
      setStep(2);
    } catch (err) {
      setError(err.toString());
    } finally {
      setLoading(false);
    }
  };

  const handleProfileSubmit = async () => {
    setLoading(true);

    try {
      // Update user profile with additional data
      // This would call a profile update endpoint
      
      // Mark onboarding as complete
      const user = authService.getUser();
      user.onboarding_completed = true;
      authService.setUser(user);

      // Redirect to main app
      navigate('/');
    } catch (err) {
      setError(err.toString());
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4 py-12">
      <div className="max-w-2xl w-full">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-gray-400">Step {step} of 2</div>
            <button
              onClick={handleSkip}
              className="text-sm text-gray-500 hover:text-gray-400 transition-colors"
            >
              Skip for now
            </button>
          </div>
          <div className="w-full bg-gray-800 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${step * 50}%` }}
            />
          </div>
        </div>

        {/* Step 1: Create Workspace */}
        {step === 1 && (
          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-8 shadow-2xl">
            <div className="text-center mb-8">
              <div className="mx-auto w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mb-4">
                <BuildingOfficeIcon className="w-8 h-8 text-blue-400" />
              </div>
              <h2 className="text-3xl font-bold text-white mb-2">Create Your Workspace</h2>
              <p className="text-gray-400">This is where your team will collaborate on sales campaigns</p>
            </div>

            {error && (
              <div className="mb-6 p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleWorkspaceSubmit} className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1">
                  Workspace Name
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  value={workspaceData.name}
                  onChange={handleWorkspaceChange}
                  required
                  className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                  placeholder="Acme Sales Team"
                />
                <p className="mt-1 text-xs text-gray-500">This is your company or team name</p>
              </div>

              <div>
                <label htmlFor="slug" className="block text-sm font-medium text-gray-300 mb-1">
                  Workspace URL
                </label>
                <div className="flex items-center">
                  <span className="text-gray-500 mr-2">artemis.ai/</span>
                  <input
                    id="slug"
                    name="slug"
                    type="text"
                    value={workspaceData.slug}
                    onChange={handleWorkspaceChange}
                    required
                    pattern="[a-z0-9-]*"
                    className="flex-1 px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                    placeholder="acme-sales"
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">Letters, numbers, and dashes only</p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-medium hover:from-blue-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
              >
                {loading ? 'Creating...' : (
                  <>
                    Create Workspace
                    <ArrowRightIcon className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* Step 2: Profile Setup */}
        {step === 2 && (
          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-8 shadow-2xl">
            <div className="text-center mb-8">
              <div className="mx-auto w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mb-4">
                <SparklesIcon className="w-8 h-8 text-purple-400" />
              </div>
              <h2 className="text-3xl font-bold text-white mb-2">Tell Us About Your Team</h2>
              <p className="text-gray-400">Help us customize ARTEMIS for your needs</p>
            </div>

            <div className="space-y-6">
              {/* Role Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">
                  What's your role?
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { value: 'sales_leader', label: 'Sales Leader', icon: BriefcaseIcon },
                    { value: 'sales_rep', label: 'Sales Rep', icon: UsersIcon },
                    { value: 'marketing', label: 'Marketing', icon: SparklesIcon },
                    { value: 'founder', label: 'Founder/CEO', icon: BuildingOfficeIcon }
                  ].map((role) => (
                    <button
                      key={role.value}
                      onClick={() => handleProfileChange('role', role.value)}
                      className={`p-4 rounded-lg border transition-all ${
                        profileData.role === role.value
                          ? 'bg-blue-500/20 border-blue-500 text-blue-400'
                          : 'bg-gray-700/30 border-gray-600 text-gray-300 hover:bg-gray-700/50'
                      }`}
                    >
                      <role.icon className="w-6 h-6 mx-auto mb-2" />
                      <div className="text-sm font-medium">{role.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Team Size */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">
                  How big is your sales team?
                </label>
                <div className="grid grid-cols-4 gap-3">
                  {['1-5', '6-20', '21-50', '50+'].map((size) => (
                    <button
                      key={size}
                      onClick={() => handleProfileChange('teamSize', size)}
                      className={`py-3 px-4 rounded-lg border transition-all ${
                        profileData.teamSize === size
                          ? 'bg-blue-500/20 border-blue-500 text-blue-400'
                          : 'bg-gray-700/30 border-gray-600 text-gray-300 hover:bg-gray-700/50'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              {/* Industry */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">
                  What industry are you in?
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    'SaaS/Software',
                    'E-commerce',
                    'Finance',
                    'Healthcare',
                    'Real Estate',
                    'Other'
                  ].map((industry) => (
                    <button
                      key={industry}
                      onClick={() => handleProfileChange('industry', industry)}
                      className={`py-3 px-4 rounded-lg border transition-all ${
                        profileData.industry === industry
                          ? 'bg-blue-500/20 border-blue-500 text-blue-400'
                          : 'bg-gray-700/30 border-gray-600 text-gray-300 hover:bg-gray-700/50'
                      }`}
                    >
                      {industry}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleProfileSubmit}
                disabled={loading || !profileData.role || !profileData.teamSize || !profileData.industry}
                className="w-full py-3 px-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-medium hover:from-blue-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
              >
                {loading ? 'Setting up...' : (
                  <>
                    <CheckIcon className="w-5 h-5" />
                    Complete Setup
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Feature highlights */}
        <div className="mt-8 grid grid-cols-3 gap-4 text-center text-sm">
          <div className="bg-gray-800/30 rounded-lg p-4">
            <div className="text-blue-400 font-semibold mb-1">AI Agents</div>
            <div className="text-gray-500">Working 24/7 for you</div>
          </div>
          <div className="bg-gray-800/30 rounded-lg p-4">
            <div className="text-purple-400 font-semibold mb-1">Smart Outreach</div>
            <div className="text-gray-500">Personalized at scale</div>
          </div>
          <div className="bg-gray-800/30 rounded-lg p-4">
            <div className="text-green-400 font-semibold mb-1">Real Results</div>
            <div className="text-gray-500">10x more meetings</div>
          </div>
        </div>
      </div>
    </div>
  );
}
