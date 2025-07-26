import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Navigation */}
      <nav className="relative z-10 border-b border-gray-800 bg-gray-900/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-white">ARTEMIS</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                to="/login"
                className="text-gray-300 hover:text-white px-3 py-2 text-sm font-medium transition-colors"
              >
                Log In
              </Link>
              <Link
                to="/signup"
                className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-20 pb-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-5xl md:text-6xl font-bold mb-6"
            >
              ARTEMIS
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-xl md:text-2xl text-gray-400 mb-8"
            >
              AI-Powered Sales Intelligence Platform
            </motion.p>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-lg text-gray-300 max-w-3xl mx-auto mb-12"
            >
              Transform your sales process with intelligent prospect discovery,
              AI-driven insights, and automated multi-channel outreach.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <Link
                to="/signup"
                className="bg-purple-600 hover:bg-purple-700 px-8 py-3 rounded-lg text-lg font-medium transition-colors"
              >
                Start Free Trial
              </Link>
              <Link
                to="/demo"
                className="border border-gray-700 hover:border-gray-600 px-8 py-3 rounded-lg text-lg font-medium transition-colors"
              >
                View Demo
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Intelligent Sales at Scale
            </h2>
            <p className="text-xl text-gray-400">
              Powered by advanced AI and comprehensive data sources
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="bg-gray-900/50 p-8 rounded-xl border border-gray-800"
            >
              <h3 className="text-xl font-semibold mb-4">
                Prospect Discovery
              </h3>
              <p className="text-gray-400">
                Automatically discover and qualify prospects using AI-powered
                analysis of company data, technographics, and buying signals.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="bg-gray-900/50 p-8 rounded-xl border border-gray-800"
            >
              <h3 className="text-xl font-semibold mb-4">
                AI-Driven Insights
              </h3>
              <p className="text-gray-400">
                Generate personalized outreach strategies with deep learning
                models that understand prospect behavior and preferences.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="bg-gray-900/50 p-8 rounded-xl border border-gray-800"
            >
              <h3 className="text-xl font-semibold mb-4">
                Multi-Channel Outreach
              </h3>
              <p className="text-gray-400">
                Orchestrate campaigns across email and LinkedIn with automated
                sequences and real-time engagement tracking.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              How ARTEMIS Works
            </h2>
            <p className="text-xl text-gray-400">
              A seamless workflow from discovery to engagement
            </p>
          </div>

          <div className="space-y-12">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="flex flex-col md:flex-row items-center gap-8"
            >
              <div className="flex-shrink-0 w-16 h-16 bg-purple-600/20 rounded-full flex items-center justify-center">
                <span className="text-2xl font-bold">1</span>
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold mb-2">
                  Define Your Ideal Customer
                </h3>
                <p className="text-gray-400">
                  Set your target criteria including industry, company size,
                  technology stack, and other key attributes.
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="flex flex-col md:flex-row items-center gap-8"
            >
              <div className="flex-shrink-0 w-16 h-16 bg-purple-600/20 rounded-full flex items-center justify-center">
                <span className="text-2xl font-bold">2</span>
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold mb-2">
                  AI Discovers & Enriches
                </h3>
                <p className="text-gray-400">
                  Our AI agents scan thousands of data sources to find and
                  enrich prospects with comprehensive business intelligence.
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="flex flex-col md:flex-row items-center gap-8"
            >
              <div className="flex-shrink-0 w-16 h-16 bg-purple-600/20 rounded-full flex items-center justify-center">
                <span className="text-2xl font-bold">3</span>
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold mb-2">
                  Personalize at Scale
                </h3>
                <p className="text-gray-400">
                  Generate tailored messaging for each prospect based on their
                  unique profile, challenges, and opportunities.
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="flex flex-col md:flex-row items-center gap-8"
            >
              <div className="flex-shrink-0 w-16 h-16 bg-purple-600/20 rounded-full flex items-center justify-center">
                <span className="text-2xl font-bold">4</span>
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold mb-2">
                  Launch & Optimize
                </h3>
                <p className="text-gray-400">
                  Execute multi-channel campaigns with real-time tracking and
                  AI-powered optimization for maximum engagement.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-purple-900/20 to-pink-900/20">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Transform Your Sales Process?
          </h2>
          <p className="text-xl text-gray-400 mb-8">
            Join forward-thinking sales teams using AI to accelerate growth.
          </p>
          <Link
            to="/signup"
            className="inline-block bg-purple-600 hover:bg-purple-700 px-8 py-3 rounded-lg text-lg font-medium transition-colors"
          >
            Get Started Free
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center text-gray-400">
            <p>&copy; 2024 ARTEMIS. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
