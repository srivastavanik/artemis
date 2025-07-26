import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { SparklesIcon } from '@heroicons/react/24/outline';
import authService from '../../services/auth.service';

export default function AuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Check if this is a success callback with token
        const token = searchParams.get('token');
        const isNewUser = searchParams.get('isNewUser');

        if (token) {
          // Handle success callback
          const result = await authService.handleOAuthCallback({
            token,
            isNewUser
          });

          if (result.isNewUser && !result.user.onboarding_completed) {
            navigate('/onboarding');
          } else if (!result.user.workspace_id) {
            navigate('/onboarding');
          } else {
            navigate('/');
          }
        } else {
          // Check for error callback
          const errorMessage = searchParams.get('message');
          if (errorMessage) {
            setError(errorMessage);
            setLoading(false);
            return;
          }

          // Handle Supabase OAuth callback
          const code = searchParams.get('code');
          if (code) {
            // The backend will exchange the code for a session
            window.location.href = `${import.meta.env.VITE_API_URL}/api/auth/callback?code=${code}`;
            return;
          }

          throw new Error('Invalid callback parameters');
        }
      } catch (err) {
        console.error('Auth callback error:', err);
        setError(err.toString());
        setLoading(false);
      }
    };

    handleCallback();
  }, [navigate, searchParams]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg mb-4 animate-pulse">
            <SparklesIcon className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">Authenticating...</h2>
          <p className="text-gray-400">Please wait while we complete your sign in</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-8 shadow-2xl text-center">
            <div className="mx-auto w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Authentication Failed</h2>
            <p className="text-gray-400 mb-6">{error}</p>
            <button
              onClick={() => navigate('/auth/login')}
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-medium hover:from-blue-600 hover:to-purple-700 transition-all"
            >
              Back to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
