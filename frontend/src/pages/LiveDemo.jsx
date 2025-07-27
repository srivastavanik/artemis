import { useState, useEffect } from 'react';
import { Play, Pause, RefreshCw, Zap, Target, Brain, Rocket, Mail, User, Building, Link } from 'lucide-react';
import MetricCard from '../components/MetricCard';
import ProspectCard from '../components/ProspectCard';

function LiveDemo() {
  const [isRunning, setIsRunning] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [activeAgent, setActiveAgent] = useState(null);
  const [consoleMessages, setConsoleMessages] = useState([]);
  const [visibleProspects, setVisibleProspects] = useState(0);
  const [demoMetrics, setDemoMetrics] = useState({
    prospectsFound: 0,
    enrichmentRate: 0,
    engagementScore: 0,
    messagesScheduled: 0
  });

  const demoSteps = [
    {
      title: "Discovering Prospects",
      description: "Scout agent searches for high-value prospects using BrightData",
      icon: Target,
      duration: 3000
    },
    {
      title: "Enriching Data",
      description: "Gathering comprehensive intelligence from multiple sources",
      icon: Brain,
      duration: 2500
    },
    {
      title: "Analyzing & Scoring",
      description: "Analyst agent evaluates intent and readiness signals",
      icon: Zap,
      duration: 2000
    },
    {
      title: "Launching Campaign",
      description: "Executor agent orchestrates personalized outreach",
      icon: Rocket,
      duration: 3000
    }
  ];

  const mockProspects = [
    {
      id: 1,
      name: "Shreyash Goli",
      title: "Product Manager",
      company: "UC Berkeley",
      email: "shreyash_goli@berkeley.edu",
      linkedin: "https://www.linkedin.com/in/shreyash-goli/",
      score: 92,
      intent: "High",
      enriched: true
    },
    {
      id: 2,
      name: "Kedaar Ramanathan",
      title: "Engineering Lead",
      company: "UC Berkeley",
      email: "kedaarnr@berkeley.edu",
      linkedin: "https://www.linkedin.com/in/kedaarr/",
      score: 88,
      intent: "High",
      enriched: true
    },
    {
      id: 3,
      name: "Diya Girishkumar",
      title: "Data Scientist",
      company: "UC Berkeley",
      email: "diya_girishkumar@berkeley.edu",
      linkedin: "https://www.linkedin.com/in/diyagirishkumar/",
      score: 95,
      intent: "High",
      enriched: true
    },
    {
      id: 4,
      name: "Gatik Trivedi",
      title: "Software Engineer",
      company: "UC Berkeley",
      email: "gatiktrivedi@berkeley.edu",
      linkedin: "https://www.linkedin.com/in/gatik-trivedi/",
      score: 90,
      intent: "Medium",
      enriched: true
    },
    {
      id: 5,
      name: "Rohil Agarwal",
      title: "ML Engineer",
      company: "UC Berkeley",
      email: "rohil@berkeley.edu",
      linkedin: "https://www.linkedin.com/in/rohil-ag/",
      score: 87,
      intent: "High",
      enriched: true
    },
    {
      id: 6,
      name: "Krish Desai",
      title: "Business Analyst",
      company: "UC Berkeley",
      email: "krishdesai@berkeley.edu",
      linkedin: "https://www.linkedin.com/in/krish-desai-ucb/",
      score: 93,
      intent: "High",
      enriched: true
    }
  ];

  // Agent names and colors
  const agents = {
    scout: { name: 'Scout Agent', color: 'text-blue-400' },
    analyst: { name: 'Analyst Agent', color: 'text-yellow-400' },
    strategist: { name: 'Strategist Agent', color: 'text-purple-400' },
    executor: { name: 'Executor Agent', color: 'text-green-400' }
  };

  useEffect(() => {
    if (!isRunning) return;

    // Set active agent based on step
    const agentMap = ['scout', 'scout', 'analyst', 'executor'];
    setActiveAgent(agentMap[currentStep]);

    // Add console messages based on step
    const stepMessages = {
      0: [
        { agent: 'scout', message: 'Initializing BrightData web scraping engine...' },
        { agent: 'scout', message: 'Searching LinkedIn for decision makers...' },
        { agent: 'scout', message: 'Analyzing UC Berkeley talent pool...' }
      ],
      1: [
        { agent: 'scout', message: 'Enriching prospect data from multiple sources...' },
        { agent: 'scout', message: 'Found LinkedIn profiles for all targets...' },
        { agent: 'scout', message: 'Extracting professional background and interests...' }
      ],
      2: [
        { agent: 'analyst', message: 'Analyzing prospect engagement signals...' },
        { agent: 'analyst', message: 'Scoring based on LlamaIndex AI insights...' },
        { agent: 'analyst', message: 'High intent detected for 5 of 6 prospects!' }
      ],
      3: [
        { agent: 'strategist', message: 'Creating personalized message sequences...' },
        { agent: 'executor', message: 'Preparing Arcade.ai campaign execution...' },
        { agent: 'executor', message: `Scheduling emails to: ${mockProspects.slice(0, 3).map(p => p.email).join(', ')}` }
      ]
    };

    // Add messages for current step
    if (stepMessages[currentStep]) {
      stepMessages[currentStep].forEach((msg, index) => {
        setTimeout(() => {
          setConsoleMessages(prev => [...prev, msg]);
        }, index * 500);
      });
    }

    const interval = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev >= demoSteps.length - 1) {
          setIsRunning(false);
          setActiveAgent(null);
          return 0;
        }
        return prev + 1;
      });

      // Update metrics progressively
      setDemoMetrics(prev => ({
        prospectsFound: Math.min(prev.prospectsFound + Math.floor(Math.random() * 2) + 1, 6),
        enrichmentRate: Math.min(prev.enrichmentRate + Math.floor(Math.random() * 10) + 15, 100),
        engagementScore: Math.min(prev.engagementScore + Math.floor(Math.random() * 8) + 12, 91),
        messagesScheduled: Math.min(prev.messagesScheduled + Math.floor(Math.random() * 2) + 1, 6)
      }));

      // Show prospects progressively
      if (currentStep >= 1) {
        setVisibleProspects(prev => Math.min(prev + 1, mockProspects.length));
      }
    }, 3500);

    return () => clearInterval(interval);
  }, [isRunning, currentStep]);

  const startDemo = () => {
    setIsRunning(true);
    setCurrentStep(0);
    setConsoleMessages([]);
    setVisibleProspects(0);
    setActiveAgent(null);
    setDemoMetrics({
      prospectsFound: 0,
      enrichmentRate: 0,
      engagementScore: 0,
      messagesScheduled: 0
    });
  };

  const resetDemo = () => {
    setIsRunning(false);
    setCurrentStep(0);
    setConsoleMessages([]);
    setVisibleProspects(0);
    setActiveAgent(null);
    setDemoMetrics({
      prospectsFound: 0,
      enrichmentRate: 0,
      engagementScore: 0,
      messagesScheduled: 0
    });
  };

  return (
    <div className="space-y-6">
      {/* Demo Header */}
      <div className="glass-morphism p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold mb-2">Live Demo</h2>
            <p className="text-white/60">
              Experience ARTEMIS in action - watch our AI agents discover, analyze, and engage prospects
            </p>
          </div>
          <div className="flex gap-3">
            {!isRunning ? (
              <button
                onClick={startDemo}
                className="btn-primary flex items-center gap-2"
              >
                <Play className="w-4 h-4" />
                Start Demo
              </button>
            ) : (
              <button
                onClick={() => setIsRunning(false)}
                className="btn-secondary flex items-center gap-2"
              >
                <Pause className="w-4 h-4" />
                Pause
              </button>
            )}
            <button
              onClick={resetDemo}
              className="btn-secondary flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Reset
            </button>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="grid grid-cols-4 gap-4">
          {demoSteps.map((step, index) => {
            const Icon = step.icon;
            const isActive = currentStep === index;
            const isCompleted = currentStep > index;
            
            return (
              <div
                key={index}
                className={`relative p-4 rounded-lg transition-all duration-500 ${
                  isActive ? 'bg-primary/20 border border-primary' : 
                  isCompleted ? 'bg-white/10' : 'bg-white/5'
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className={`p-2 rounded-lg ${
                    isActive ? 'bg-primary text-black' : 
                    isCompleted ? 'bg-primary/30' : 'bg-white/10'
                  }`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className={`text-sm font-medium ${
                    isActive ? 'text-primary' : 
                    isCompleted ? 'text-white' : 'text-white/40'
                  }`}>
                    Step {index + 1}
                  </span>
                </div>
                <h3 className={`font-medium mb-1 ${
                  isActive || isCompleted ? 'text-white' : 'text-white/40'
                }`}>
                  {step.title}
                </h3>
                <p className={`text-sm ${
                  isActive || isCompleted ? 'text-white/60' : 'text-white/30'
                }`}>
                  {step.description}
                </p>
                
                {isActive && (
                  <div className="absolute inset-0 rounded-lg animate-pulse-border" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Live Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Prospects Found"
          value={demoMetrics.prospectsFound}
          change={isRunning ? '+' + Math.floor(Math.random() * 5 + 3) : 0}
          trend={isRunning ? 'up' : 'neutral'}
          icon={Target}
          color="blue"
        />
        <MetricCard
          title="Enrichment Rate"
          value={`${demoMetrics.enrichmentRate}%`}
          change={isRunning ? '+' + Math.floor(Math.random() * 10 + 5) + '%' : '0%'}
          trend={isRunning ? 'up' : 'neutral'}
          icon={Brain}
          color="purple"
        />
        <MetricCard
          title="Avg. Score"
          value={demoMetrics.engagementScore}
          change={isRunning ? '+' + Math.floor(Math.random() * 5 + 2) : 0}
          trend={isRunning ? 'up' : 'neutral'}
          icon={Zap}
          color="yellow"
        />
        <MetricCard
          title="Messages Ready"
          value={demoMetrics.messagesScheduled}
          change={isRunning ? '+' + Math.floor(Math.random() * 7 + 3) : 0}
          trend={isRunning ? 'up' : 'neutral'}
          icon={Rocket}
          color="green"
        />
      </div>

      {/* Demo Results */}
      {visibleProspects > 0 && (
        <div className="glass-morphism p-6">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <User className="w-5 h-5" />
            Discovered Prospects
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {mockProspects.slice(0, visibleProspects).map((prospect, index) => (
              <div 
                key={prospect.id}
                className="animate-fadeIn"
                style={{ animationDelay: `${index * 200}ms` }}
              >
                <div className="bg-white/5 rounded-lg p-4 border border-white/10 hover:border-primary/30 transition-all">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-medium text-lg">{prospect.name}</h4>
                      <p className="text-sm text-white/60">{prospect.title}</p>
                      <p className="text-sm text-white/40 flex items-center gap-1">
                        <Building className="w-3 h-3" />
                        {prospect.company}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <a 
                        href={prospect.linkedin} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300"
                      >
                        <Link className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-2xl font-bold text-primary">{prospect.score}</div>
                    <div className="flex-1">
                      <div className="text-xs text-white/60 mb-1">Engagement Score</div>
                      <div className="w-full bg-white/10 rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full transition-all duration-1000"
                          style={{ width: `${prospect.score}%` }}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <span className={`text-xs px-2 py-1 rounded ${
                      prospect.intent === 'High' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
                    }`}>
                      {prospect.intent} Intent
                    </span>
                    {prospect.enriched && (
                      <span className="text-xs text-white/40 flex items-center gap-1">
                        <Zap className="w-3 h-3" />
                        Enriched
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active Agent Indicator */}
      {activeAgent && (
        <div className="glass-morphism p-4 border-l-4 border-primary">
          <div className="flex items-center gap-3">
            <div className="animate-pulse">
              <div className="w-3 h-3 bg-primary rounded-full"></div>
            </div>
            <span className={`font-bold ${agents[activeAgent].color}`}>
              {agents[activeAgent].name} Active
            </span>
          </div>
        </div>
      )}

      {/* Demo Console */}
      <div className="glass-morphism p-6">
        <h3 className="text-xl font-bold mb-4">Agent Activity Console</h3>
        <div className="bg-black/50 rounded-lg p-4 font-mono text-sm space-y-2 max-h-96 overflow-y-auto">
          {consoleMessages.map((msg, index) => (
            <div key={index} className={`${agents[msg.agent].color} animate-fadeIn`}>
              [{agents[msg.agent].name}] {msg.message}
            </div>
          ))}
          {!isRunning && consoleMessages.length > 0 && (
            <div className="text-white mt-4 border-t border-white/20 pt-2">
              [System] Demo completed. {demoMetrics.messagesScheduled} personalized emails ready for delivery!
            </div>
          )}
        </div>
      </div>

      {/* Email Preview */}
      {currentStep >= 3 && demoMetrics.messagesScheduled > 0 && (
        <div className="glass-morphism p-6">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Campaign Messages Preview
          </h3>
          <div className="space-y-3">
            {mockProspects.slice(0, Math.min(3, demoMetrics.messagesScheduled)).map((prospect, index) => (
              <div key={prospect.id} className="bg-white/5 rounded-lg p-4 animate-slideIn" style={{ animationDelay: `${index * 200}ms` }}>
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="text-sm text-white/60">To:</p>
                    <p className="font-medium">{prospect.email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <a 
                      href={prospect.linkedin} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300"
                    >
                      <Link className="w-4 h-4" />
                    </a>
                  </div>
                </div>
                <p className="text-sm text-white/60 mb-1">Subject:</p>
                <p className="text-sm mb-2">Personalized outreach for {prospect.name} - {prospect.title}</p>
                <div className="flex items-center gap-2 text-xs text-white/40">
                  <span className="px-2 py-1 bg-primary/20 rounded">Score: {prospect.score}</span>
                  <span className="px-2 py-1 bg-green-500/20 rounded">{prospect.intent} Intent</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default LiveDemo;
