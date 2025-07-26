import React from 'react';
import { Link } from 'react-router-dom';

const Home = () => {
  return (
    <div className="bg-black text-white font-light min-h-screen">
      {/* Navigation */}
      <nav className="container mx-auto px-6 py-6">
        <div className="flex items-center justify-between">
          <div className="text-xl tracking-tight font-medium">ARTEMIS</div>
          <div className="hidden md:flex space-x-10 text-sm">
            <a href="#features" className="hover:text-indigo-300 transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-indigo-300 transition-colors">How it Works</a>
            <a href="#pricing" className="hover:text-indigo-300 transition-colors">Pricing</a>
          </div>
          <div className="flex items-center space-x-4">
            <Link to="/login" className="text-sm hover:text-indigo-300 transition-colors">
              Log In
            </Link>
            <Link to="/signup" className="text-sm border border-indigo-500/30 rounded-md px-4 py-2 hover:bg-indigo-500/10 transition-all">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      <div className="h-px bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent"></div>

      {/* Hero Section */}
      <div className="container mx-auto px-6 py-16 md:py-32">
        <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-light tracking-tighter mb-6 leading-tight">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">AI-powered</span>{' '}
            sales intelligence
          </h1>
          <p className="text-gray-300 text-xl md:text-2xl mb-8 max-w-2xl mx-auto font-extralight tracking-wide">
            Transform your sales process with intelligent prospect discovery, AI-driven insights, and automated multi-channel outreach.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/signup" className="bg-white text-black font-light rounded-md px-6 py-3 hover:bg-opacity-90 transition-all">
              Get Started
            </Link>
            <Link to="/demo" className="bg-transparent border border-indigo-500/30 rounded-md px-6 py-3 hover:bg-indigo-500/10 transition-all">
              View Demo
            </Link>
          </div>
        </div>

        <div className="h-px bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent my-16"></div>

        {/* Core Features */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-20">
          <div>
            <p className="text-2xl font-light mb-1 tracking-tight">Prospect Discovery</p>
            <p className="text-gray-400 font-extralight">AI-powered lead identification</p>
          </div>
          <div>
            <p className="text-2xl font-light mb-1 tracking-tight">Deep Insights</p>
            <p className="text-gray-400 font-extralight">Comprehensive data analysis</p>
          </div>
          <div>
            <p className="text-2xl font-light mb-1 tracking-tight">Multi-Channel</p>
            <p className="text-gray-400 font-extralight">Email & LinkedIn outreach</p>
          </div>
          <div>
            <p className="text-2xl font-light mb-1 tracking-tight">Human Control</p>
            <p className="text-gray-400 font-extralight">Review before execution</p>
          </div>
        </div>
      </div>

      {/* How It Works */}
      <section id="how-it-works" className="py-20">
        <div className="container mx-auto px-6">
          <h2 className="text-4xl md:text-5xl font-light tracking-tight text-center mb-16">
            Intelligent sales at scale
          </h2>
          <p className="text-center text-gray-400 font-extralight text-lg mb-16 max-w-2xl mx-auto">
            Powered by advanced AI and comprehensive data sources
          </p>
          
          <div className="grid md:grid-cols-3 gap-12 max-w-5xl mx-auto">
            <div className="text-center">
              <div className="text-5xl font-extralight text-indigo-400 mb-6">01</div>
              <h3 className="text-2xl font-light mb-4 tracking-tight">Discover</h3>
              <p className="text-gray-400 font-extralight">
                Automatically identify and qualify prospects using AI-powered analysis of company data and buying signals
              </p>
            </div>
            <div className="text-center">
              <div className="text-5xl font-extralight text-purple-400 mb-6">02</div>
              <h3 className="text-2xl font-light mb-4 tracking-tight">Analyze</h3>
              <p className="text-gray-400 font-extralight">
                Generate personalized strategies with deep learning models that understand prospect behavior
              </p>
            </div>
            <div className="text-center">
              <div className="text-5xl font-extralight text-blue-400 mb-6">03</div>
              <h3 className="text-2xl font-light mb-4 tracking-tight">Engage</h3>
              <p className="text-gray-400 font-extralight">
                Orchestrate campaigns across channels with automated sequences and real-time tracking
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="h-px bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent"></div>

      {/* Stats */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8 max-w-4xl mx-auto text-center">
            <div>
              <p className="text-4xl font-light text-white mb-2">24/7</p>
              <p className="text-gray-400 font-extralight">AI Agents Working</p>
            </div>
            <div>
              <p className="text-4xl font-light text-white mb-2">312%</p>
              <p className="text-gray-400 font-extralight">Average ROI</p>
            </div>
            <div>
              <p className="text-4xl font-light text-white mb-2">2.4h</p>
              <p className="text-gray-400 font-extralight">Response Time</p>
            </div>
            <div>
              <p className="text-4xl font-light text-white mb-2">98%</p>
              <p className="text-gray-400 font-extralight">Data Accuracy</p>
            </div>
          </div>
        </div>
      </section>

      <div className="h-px bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent"></div>

      {/* CTA */}
      <section className="py-20">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-4xl md:text-5xl font-light tracking-tight mb-6">
            Ready to transform your sales?
          </h2>
          <p className="text-gray-400 font-extralight text-lg mb-8 max-w-2xl mx-auto">
            Join leading companies using ARTEMIS to scale their revenue
          </p>
          <Link to="/signup" className="bg-white text-black font-light rounded-md px-8 py-4 hover:bg-opacity-90 transition-all inline-block">
            Get Started Free
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800 py-12">
        <div className="container mx-auto px-6">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-400 font-extralight">
              © 2025 ARTEMIS. All rights reserved.
            </div>
            <div className="flex space-x-6 text-sm text-gray-400 font-extralight">
              <a href="/privacy" className="hover:text-white transition-colors">Privacy</a>
              <a href="/terms" className="hover:text-white transition-colors">Terms</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
