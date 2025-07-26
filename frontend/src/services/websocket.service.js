import { io } from 'socket.io-client';

class WebSocketService {
  constructor() {
    this.socket = null;
    this.listeners = new Map();
    this.reconnectInterval = null;
    this.isConnecting = false;
  }

  connect() {
    if (this.socket && this.socket.connected) {
      console.log('WebSocket already connected');
      return;
    }

    if (this.isConnecting) {
      console.log('WebSocket connection already in progress');
      return;
    }

    this.isConnecting = true;
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
    // Remove /api from the URL for Socket.IO
    const wsUrl = apiUrl.replace('/api', '');
    
    console.log('Attempting to connect WebSocket to:', wsUrl);
    
    try {
      this.socket = io(wsUrl, {
        auth: {
          token: null // No auth token in development
        },
        transports: ['polling', 'websocket'], // Try polling first
        reconnection: true,
        reconnectionDelay: 5000,
        reconnectionAttempts: 5,
        timeout: 10000
      });

      this.socket.on('connect', () => {
        console.log('✅ WebSocket connected successfully!');
        console.log('Socket ID:', this.socket.id);
        this.isConnecting = false;
      });

      this.socket.on('connected', (data) => {
        console.log('✅ WebSocket server confirmed connection:', data);
      });

      this.socket.on('disconnect', (reason) => {
        console.log('❌ WebSocket disconnected:', reason);
        this.isConnecting = false;
      });

      this.socket.on('connect_error', (error) => {
        console.error('❌ WebSocket connection error:', error.message);
        console.error('Error type:', error.type);
        this.isConnecting = false;
      });

      this.socket.on('error', (error) => {
        console.error('❌ WebSocket error:', error);
        this.isConnecting = false;
      });

      // Listen for all events and route to handlers
      this.socket.onAny((eventName, ...args) => {
        console.log('📨 WebSocket event received:', eventName, args);
        this.handleMessage({ type: eventName, payload: args[0] });
      });

      // Log the socket status
      console.log('Socket.IO client created, waiting for connection...');

    } catch (error) {
      console.error('❌ Failed to create WebSocket:', error);
      this.isConnecting = false;
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  handleMessage(data) {
    const { type, payload } = data;
    
    // Notify all listeners for this event type
    const listeners = this.listeners.get(type) || [];
    listeners.forEach(callback => {
      try {
        callback(payload);
      } catch (error) {
        console.error(`Error in WebSocket listener for ${type}:`, error);
      }
    });
  }

  subscribe(eventType, callback) {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, []);
    }
    this.listeners.get(eventType).push(callback);
    
    // Also subscribe to Socket.IO events
    if (this.socket) {
      this.socket.on(eventType, (data) => {
        this.handleMessage({ type: eventType, payload: data });
      });
    }
    
    // Return unsubscribe function
    return () => {
      const listeners = this.listeners.get(eventType) || [];
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
      
      // Unsubscribe from Socket.IO if no more listeners
      if (listeners.length === 0 && this.socket) {
        this.socket.off(eventType);
      }
    };
  }

  emit(eventType, payload) {
    if (this.socket && this.socket.connected) {
      this.socket.emit(eventType, payload);
    } else {
      console.warn('WebSocket is not connected. Unable to send message.');
    }
  }

  // Convenience methods for common events
  subscribeToProspectUpdates(prospectId, callback) {
    this.emit('subscribe', { type: 'prospect', id: prospectId });
    return this.subscribe(`prospect:${prospectId}`, callback);
  }

  subscribeToCampaignUpdates(campaignId, callback) {
    this.emit('subscribe', { type: 'campaign', id: campaignId });
    return this.subscribe(`campaign:${campaignId}`, callback);
  }

  subscribeToAgentActivity(callback) {
    return this.subscribe('agent:activity', callback);
  }

  subscribeToAnalyticsUpdates(callback) {
    return this.subscribe('analytics:update', callback);
  }
}

// Create singleton instance
const websocketService = new WebSocketService();

// Auto-connect when imported
if (typeof window !== 'undefined') {
  websocketService.connect();
}

export default websocketService;
