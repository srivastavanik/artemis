import { useState, useEffect } from 'react';
import api from '../services/api';
import websocketService from '../services/websocket.service';

function ConnectionTest() {
  const [apiStatus, setApiStatus] = useState('checking');
  const [wsStatus, setWsStatus] = useState('checking');
  const [testResults, setTestResults] = useState([]);

  useEffect(() => {
    testConnections();
  }, []);

  const testConnections = async () => {
    const results = [];

    // Test API connection
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3001'}/health`);
      const data = await response.json();
      
      if (data.status === 'healthy') {
        setApiStatus('connected');
        results.push({ test: 'API Health Check', status: 'success', message: 'Backend is healthy' });
      } else {
        setApiStatus('error');
        results.push({ test: 'API Health Check', status: 'error', message: 'Backend unhealthy' });
      }
    } catch (error) {
      setApiStatus('error');
      results.push({ test: 'API Health Check', status: 'error', message: error.message });
    }

    // Test WebSocket (Socket.IO)
    const socket = websocketService.socket;
    if (socket && socket.connected) {
      setWsStatus('connected');
      results.push({ test: 'WebSocket Connection', status: 'success', message: 'WebSocket connected' });
    } else {
      setWsStatus('error');
      results.push({ test: 'WebSocket Connection', status: 'error', message: 'WebSocket not connected' });
    }

    // Test API endpoints
    const endpoints = [
      { name: 'Prospects', fn: () => api.get('/prospects') },
      { name: 'Campaigns', fn: () => api.get('/campaigns') },
      { name: 'Analytics', fn: () => api.get('/analytics') }
    ];

    for (const endpoint of endpoints) {
      try {
        await endpoint.fn();
        results.push({ test: `${endpoint.name} API`, status: 'success', message: 'Endpoint accessible' });
      } catch (error) {
        results.push({ test: `${endpoint.name} API`, status: 'error', message: error.message });
      }
    }

    setTestResults(results);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'connected':
      case 'success':
        return 'text-green-400';
      case 'error':
        return 'text-red-400';
      default:
        return 'text-yellow-400';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'connected':
      case 'success':
        return '✓';
      case 'error':
        return '✗';
      default:
        return '...';
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="card bg-gray-900 p-4 shadow-xl max-w-sm">
        <h3 className="text-sm font-semibold mb-3 text-gray-300">Connection Status</h3>
        
        <div className="space-y-2 mb-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-400">API</span>
            <span className={`text-sm font-medium ${getStatusColor(apiStatus)}`}>
              {getStatusIcon(apiStatus)} {apiStatus}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-400">WebSocket</span>
            <span className={`text-sm font-medium ${getStatusColor(wsStatus)}`}>
              {getStatusIcon(wsStatus)} {wsStatus}
            </span>
          </div>
        </div>

        {testResults.length > 0 && (
          <>
            <div className="border-t border-gray-800 pt-3">
              <h4 className="text-xs font-semibold mb-2 text-gray-400">Test Results</h4>
              <div className="space-y-1">
                {testResults.map((result, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <span className={`text-xs ${getStatusColor(result.status)}`}>
                      {getStatusIcon(result.status)}
                    </span>
                    <div className="flex-1">
                      <p className="text-xs text-gray-300">{result.test}</p>
                      {result.status === 'error' && (
                        <p className="text-xs text-gray-500 mt-0.5">{result.message}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <button
              onClick={testConnections}
              className="mt-3 text-xs text-indigo-400 hover:text-indigo-300"
            >
              Retry Tests
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default ConnectionTest;
