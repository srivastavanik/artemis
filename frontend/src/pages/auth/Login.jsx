import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { EnvelopeIcon, KeyIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { FcGoogle } from 'react-icons/fc';
import authService from '../../services/auth.service';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [loginMethod, setLoginMethod] = useState('magic'); // 'magic' or 'password'

  const handleMagicLink = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await authService.sendMagicLink(email);
      setMagicLinkSent(true);
    } catch (err) {
      setError(err.toString());
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await authService.signIn({ email, password });
      navigate('/');
    } catch (err) {
      setError(err.toString());
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    authService.signInWithGoogle();
  };

  if (magicLinkSent) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-8 shadow-2xl">
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mb-4">
                <EnvelopeIcon className="w-8 h-8 text-blue-400" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Check Your Email</h2>
              <p className="text-gray-400 mb-6">
                We've sent a magic link to <span className="text-white font-medium">{email}</span>
              </p>
              <p className="text-sm text-gray-500 mb-6">
                Click the link in the email to sign in. The link will expire in 1 hour.
              </p>
              <button
                onClick={() => {
                  setMagicLinkSent(false);
                  setEmail('');
                }}
                className="text-blue-400 hover:text-blue-300 transition-colors text-sm"
              >
                Use a different email
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full space-y-8">
        {/* Logo and Title */}
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
              <SparklesIcon className="w-10 h-10 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">Welcome to ARTEMIS</h1>
          <p className="text-gray-400">AI-Powered Sales Intelligence Platform</p>
        </div>

        {/* Login Form */}
        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-8 shadow-2xl">
          {/* Google Login */}
          <button
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white text-gray-900 rounded-lg font-medium hover:bg-gray-100 transition-colors mb-6"
          >
            <FcGoogle className="w-5 h-5" />
            Continue with Google
          </button>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-700"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-gray-800/50 text-gray-400">Or continue with</span>
            </div>
          </div>

          {/* Login Method Tabs */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setLoginMethod('magic')}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                loginMethod === 'magic'
                  ? 'bg-blue-500/20 text-blue-400 border border-blue-500/50'
                  : 'bg-gray-700/50 text-gray-400 hover:bg-gray-700'
              }`}
            >
              Magic Link
            </button>
            <button
              onClick={() => setLoginMethod('password')}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                loginMethod === 'password'
                  ? 'bg-blue-500/20 text-blue-400 border border-blue-500/50'
                  : 'bg-gray-700/50 text-gray-400 hover:bg-gray-700'
              }`}
            >
              Password
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          {loginMethod === 'magic' ? (
            <form onSubmit={handleMagicLink} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">
                  Email address
                </label>
                <div className="relative">
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full px-4 py-3 pl-11 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                    placeholder="you@company.com"
                  />
                  <EnvelopeIcon className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-medium hover:from-blue-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {loading ? 'Sending...' : 'Send Magic Link'}
              </button>
            </form>
          ) : (
            <form onSubmit={handlePasswordLogin} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">
                  Email address
                </label>
                <div className="relative">
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full px-4 py-3 pl-11 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                    placeholder="you@company.com"
                  />
                  <EnvelopeIcon className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full px-4 py-3 pl-11 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                    placeholder="••••••••"
                  />
                  <KeyIcon className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-medium hover:from-blue-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>
          )}

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-400">
              Don't have an account?{' '}
              <Link to="/auth/signup" className="text-blue-400 hover:text-blue-300 font-medium">
                Sign up for free
              </Link>
            </p>
          </div>
        </div>

        {/* Demo Credentials */}
        {loginMethod === 'password' && (
          <div className="text-center text-sm text-gray-500">
            <p>Demo credentials:</p>
            <p className="font-mono">demo@artemis.ai / demo123</p>
          </div>
        )}
      </div>
    </div>
  );
}
