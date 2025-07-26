import { useState, useEffect } from 'react';
import { Play, Pause, RefreshCw, Zap, Target, Brain, Rocket } from 'lucide-react';
import MetricCard from '../components/MetricCard';
import ProspectCard from '../components/ProspectCard';

function LiveDemo() {
  const [isRunning, setIsRunning] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
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
      name: "Sarah Chen",
      title: "VP of Sales",
      company: "TechCorp Solutions",
      score: 92,
      intent: "High",
      enriched: true
    },
    {
      id: 2,
      name: "Michael Rodriguez",
      title: "Head of Revenue",
      company: "Growth Dynamics",
      score: 88,
      intent: "Medium",
      enriched: true
    },
    {
      id: 3,
      name: "Emily Watson",
      title: "Sales Director",
      company: "Innovation Labs",
      score: 95,
      intent: "High",
      enriched: true
    }
  ];

  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev >= demoSteps.length - 1) {
          setIsRunning(false);
          return 0;
        }
        return prev + 1;
      });

      // Update metrics progressively
      setDemoMetrics(prev => ({
        prospectsFound: Math.min(prev.prospectsFound + Math.floor(Math.random() * 5) + 3, 50),
        enrichmentRate: Math.min(prev.enrichmentRate + Math.floor(Math.random() * 10) + 15, 95),
        engagementScore: Math.min(prev.engagementScore + Math.floor(Math.random() * 8) + 12, 89),
        messagesScheduled: Math.min(prev.messagesScheduled + Math.floor(Math.random() * 7) + 5, 45)
      }));
    }, 2500);

    return () => clearInterval(interval);
  }, [isRunning, currentStep]);

  const startDemo = () => {
    setIsRunning(true);
    setCurrentStep(0);
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
      {(currentStep >= 2 || !isRunning) && demoMetrics.prospectsFound > 0 && (
        <div className="glass-morphism p-6">
          <h3 className="text-xl font-bold mb-4">Discovered Prospects</h3>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {mockProspects.slice(0, Math.min(3, Math.floor(demoMetrics.prospectsFound / 10))).map((prospect) => (
              <ProspectCard 
                key={prospect.id} 
                prospect={prospect}
                className="transform hover:scale-105 transition-transform"
              />
            ))}
          </div>
        </div>
      )}

      {/* Demo Console */}
      <div className="glass-morphism p-6">
        <h3 className="text-xl font-bold mb-4">Agent Activity Console</h3>
        <div className="bg-black/50 rounded-lg p-4 font-mono text-sm space-y-2 max-h-64 overflow-y-auto">
          {currentStep >= 0 && (
            <div className="text-blue-400">
              [Scout Agent] Initializing prospect discovery...
            </div>
          )}
          {currentStep >= 0 && demoMetrics.prospectsFound > 5 && (
            <div className="text-green-400">
              [Scout Agent] Found {demoMetrics.prospectsFound} high-value prospects
            </div>
          )}
          {currentStep >= 1 && (
            <div className="text-purple-400">
              [Enrichment] Gathering data from LinkedIn, Twitter, company websites...
            </div>
          )}
          {currentStep >= 2 && (
            <div className="text-yellow-400">
              [Analyst Agent] Calculating intent signals and engagement scores...
            </div>
          )}
          {currentStep >= 2 && demoMetrics.engagementScore > 20 && (
            <div className="text-yellow-400">
              [Analyst Agent] Average engagement score: {demoMetrics.engagementScore}/100
            </div>
          )}
          {currentStep >= 3 && (
            <div className="text-primary">
              [Strategist Agent] Designing personalized campaign sequences...
            </div>
          )}
          {currentStep >= 3 && demoMetrics.messagesScheduled > 10 && (
            <div className="text-green-400">
              [Executor Agent] {demoMetrics.messagesScheduled} messages scheduled for delivery
            </div>
          )}
          {!isRunning && demoMetrics.messagesScheduled > 0 && (
            <div className="text-white">
              [System] Demo completed. Ready to launch real campaigns!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default LiveDemo;
