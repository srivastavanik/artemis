import React from 'react';
import { Link } from 'react-router-dom';

const Home = () => {
  return (
    <div className="min-h-screen bg-black text-white font-light">
      {/* Navigation */}
      <nav className="container mx-auto px-6 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <span className="text-xl tracking-tight font-medium">ARTEMIS</span>
          </div>
          <div className="hidden md:flex space-x-10 text-sm">
            <Link to="/features" className="hover:text-indigo-300 transition-colors">Features</Link>
            <Link to="/demo" className="hover:text-indigo-300 transition-colors">Demo</Link>
            <Link to="/pricing" className="hover:text-indigo-300 transition-colors">Pricing</Link>
            <Link to="/about" className="hover:text-indigo-300 transition-colors">About</Link>
          </div>
          <div className="flex gap-4">
            <Link
              to="/login"
              className="text-sm px-4 py-2 hover:text-indigo-300 transition-all"
            >
              Sign In
            </Link>
            <Link
              to="/signup"
              className="text-sm border border-indigo-500/30 rounded-md px-4 py-2 hover:bg-indigo-500/10 transition-all"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      <div className="h-px bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent"></div>

      <div className="relative overflow-hidden">
        {/* Hero content */}
        <div className="container mx-auto px-6 py-16 md:py-32">
          <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
            {/* Text content */}
            <div className="mb-12">
              <h1 className="text-5xl md:text-7xl lg:text-8xl font-light tracking-tighter mb-6 leading-tight">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">
                  AI Sales Intelligence
                </span>
                <br />
                that delivers results
              </h1>
              <p className="text-gray-300 text-xl md:text-2xl mb-8 max-w-2xl mx-auto font-extralight tracking-wide">
                Transform your sales process with autonomous AI agents that discover, 
                analyze, and engage prospects while you focus on closing deals.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  to="/signup"
                  className="bg-white text-black font-light rounded-md px-6 py-3 hover:bg-opacity-90 transition-all"
                >
                  Start Free Trial
                </Link>
                <Link
                  to="/demo"
                  className="bg-transparent border border-indigo-500/30 rounded-md px-6 py-3 hover:bg-indigo-500/10 transition-all"
                >
                  Watch Demo
                </Link>
              </div>
            </div>
          </div>
          
          <div className="h-px bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent my-16"></div>
          
          {/* Features */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-20">
            <div>
              <p className="text-2xl font-light mb-1 tracking-tight">Prospect Discovery</p>
              <p className="text-gray-400 font-extralight">AI-powered lead generation</p>
            </div>
            <div>
              <p className="text-2xl font-light mb-1 tracking-tight">Data Enrichment</p>
              <p className="text-gray-400 font-extralight">Complete prospect profiles</p>
            </div>
            <div>
              <p className="text-2xl font-light mb-1 tracking-tight">Intelligent Scoring</p>
              <p className="text-gray-400 font-extralight">Predictive analytics</p>
            </div>
            <div>
              <p className="text-2xl font-light mb-1 tracking-tight">Multi-Channel</p>
              <p className="text-gray-400 font-extralight">Automated outreach</p>
            </div>
          </div>
        </div>
      </div>

      {/* AI Agents Section */}
      <section className="container mx-auto px-6 py-20">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-light tracking-tight mb-12 text-center">
            Autonomous AI Agents Working 24/7
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-gray-900/30 backdrop-blur-sm border border-gray-800 rounded-lg p-6">
              <div className="text-indigo-400 text-sm font-medium mb-2">SCOUT</div>
              <h3 className="text-xl font-light mb-3">Discovery Agent</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Continuously scans the web to find ideal prospects matching your criteria
              </p>
            </div>
            <div className="bg-gray-900/30 backdrop-blur-sm border border-gray-800 rounded-lg p-6">
              <div className="text-purple-400 text-sm font-medium mb-2">ANALYST</div>
              <h3 className="text-xl font-light mb-3">Intelligence Agent</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Enriches prospects with deep insights and predictive scoring
              </p>
            </div>
            <div className="bg-gray-900/30 backdrop-blur-sm border border-gray-800 rounded-lg p-6">
              <div className="text-blue-400 text-sm font-medium mb-2">STRATEGIST</div>
              <h3 className="text-xl font-light mb-3">Campaign Agent</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Designs personalized outreach strategies for each prospect
              </p>
            </div>
            <div className="bg-gray-900/30 backdrop-blur-sm border border-gray-800 rounded-lg p-6">
              <div className="text-green-400 text-sm font-medium mb-2">EXECUTOR</div>
              <h3 className="text-xl font-light mb-3">Engagement Agent</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Orchestrates multi-channel campaigns with human-in-the-loop control
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="h-px bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent"></div>

      {/* Integrations Section */}
      <section className="container mx-auto px-6 py-20">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-light tracking-tight mb-12 text-center">
            Powered by Industry Leaders
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-3xl font-light mb-2">BrightData</div>
              <p className="text-gray-400 text-sm">Web intelligence & data discovery</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-light mb-2">LlamaIndex</div>
              <p className="text-gray-400 text-sm">AI analysis & insights</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-light mb-2">Arcade</div>
              <p className="text-gray-400 text-sm">Multi-channel execution</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-light mb-2">Mastra</div>
              <p className="text-gray-400 text-sm">Workflow orchestration</p>
            </div>
          </div>
        </div>
      </section>

      <div className="h-px bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent"></div>

      {/* CTA Section */}
      <section className="container mx-auto px-6 py-20">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-light tracking-tight mb-6">
            Ready to transform your sales?
          </h2>
          <p className="text-xl text-gray-400 mb-8 font-extralight">
            Join forward-thinking teams using AI to accelerate growth
          </p>
          <Link
            to="/signup"
            className="inline-block bg-white text-black font-light rounded-md px-8 py-4 hover:bg-opacity-90 transition-all"
          >
            Get Started Free
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800 py-12">
        <div className="container mx-auto px-6">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-400">
              © 2024 ARTEMIS. All rights reserved.
            </div>
            <div className="flex space-x-6 text-sm text-gray-400">
              <Link to="/privacy" className="hover:text-white transition-colors">Privacy</Link>
              <Link to="/terms" className="hover:text-white transition-colors">Terms</Link>
              <Link to="/contact" className="hover:text-white transition-colors">Contact</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
