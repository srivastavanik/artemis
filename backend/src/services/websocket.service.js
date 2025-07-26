import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import config from '../../config/index.js';
import { logger } from '../utils/logger.js';

class WebSocketService {
  constructor() {
    this.io = null
    this.connections = new Map()
  }

  /**
   * Initialize WebSocket server
   * @param {Object} server - HTTP server instance
   */
  initialize(server) {
    this.io = new Server(server, {
      cors: {
        origin: function(origin, callback) {
          // Allow requests with no origin
          if (!origin) return callback(null, true);
          
          // Allow any localhost port in development
          if (process.env.NODE_ENV !== 'production' && origin.includes('localhost')) {
            return callback(null, true);
          }
          
          // List of allowed origins
          const allowedOrigins = [
            'https://artemis-murex.vercel.app',
            process.env.FRONTEND_URL,
            'http://localhost:5173',
            'http://localhost:3000'
          ].filter(Boolean);
          
          // Check if origin is allowed
          if (allowedOrigins.includes(origin)) {
            return callback(null, true);
          }
          
          logger.warn('WebSocket CORS rejected origin:', { origin, allowedOrigins });
          return callback(new Error('Not allowed by CORS'));
        },
        credentials: true,
        methods: ['GET', 'POST']
      }
    })

    // Authentication middleware (optional in development)
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token
        
        if (token) {
          try {
            const decoded = jwt.verify(token, config.jwt.secret)
            socket.userId = decoded.userId
            socket.userEmail = decoded.email
            socket.userRole = decoded.role

            logger.info('WebSocket authenticated', { 
              userId: decoded.userId,
              socketId: socket.id 
            })
          } catch (error) {
            logger.warn('WebSocket authentication failed', { error: error.message })
            // Continue without auth in development
            if (process.env.NODE_ENV === 'production') {
              return next(new Error('Authentication failed'))
            }
          }
        }
        
        // Allow connection without auth in development
        if (!socket.userId) {
          socket.userId = `guest-${socket.id}`
          socket.userEmail = 'guest@artemis.ai'
          socket.userRole = 'guest'
        }

        next()
      } catch (error) {
        logger.error('WebSocket middleware error', { error: error.message })
        next(error)
      }
    })

    // Connection handling
    this.io.on('connection', (socket) => {
      this.handleConnection(socket)
    })

    logger.info('WebSocket service initialized')
  }

  /**
   * Handle new socket connection
   * @param {Object} socket - Socket instance
   */
  handleConnection(socket) {
    const { userId } = socket

    // Store connection
    this.connections.set(userId, socket.id)

    logger.info('WebSocket connected', { 
      userId, 
      socketId: socket.id,
      totalConnections: this.connections.size 
    })

    // Join user-specific room
    socket.join(`user:${userId}`)

    // Handle events
    socket.on('subscribe', (data) => this.handleSubscribe(socket, data))
    socket.on('unsubscribe', (data) => this.handleUnsubscribe(socket, data))
    
    // Handle disconnection
    socket.on('disconnect', () => {
      this.connections.delete(userId)
      logger.info('WebSocket disconnected', { 
        userId, 
        socketId: socket.id,
        totalConnections: this.connections.size 
      })
    })

    // Send initial connection success
    socket.emit('connected', {
      message: 'Connected to ARTEMIS real-time service',
      userId,
      timestamp: new Date()
    })
  }

  /**
   * Handle subscription to specific events
   * @param {Object} socket - Socket instance
   * @param {Object} data - Subscription data
   */
  handleSubscribe(socket, data) {
    const { type, id } = data
    const room = `${type}:${id}`
    
    socket.join(room)
    logger.info('Socket subscribed', { 
      userId: socket.userId, 
      room,
      socketId: socket.id
    })

    socket.emit('subscribed', { room, timestamp: new Date() })
  }

  /**
   * Handle unsubscription from events
   * @param {Object} socket - Socket instance
   * @param {Object} data - Unsubscription data
   */
  handleUnsubscribe(socket, data) {
    const { type, id } = data
    const room = `${type}:${id}`
    
    socket.leave(room)
    logger.info('Socket unsubscribed', { 
      userId: socket.userId, 
      room,
      socketId: socket.id
    })

    socket.emit('unsubscribed', { room, timestamp: new Date() })
  }

  /**
   * Emit event to specific user
   * @param {string} userId - User ID
   * @param {string} event - Event name
   * @param {Object} data - Event data
   */
  emitToUser(userId, event, data) {
    this.io.to(`user:${userId}`).emit(event, {
      ...data,
      timestamp: new Date()
    })
  }

  /**
   * Emit event to specific room
   * @param {string} room - Room name
   * @param {string} event - Event name
   * @param {Object} data - Event data
   */
  emitToRoom(room, event, data) {
    this.io.to(room).emit(event, {
      ...data,
      timestamp: new Date()
    })
  }

  /**
   * Broadcast event to all connected clients
   * @param {string} event - Event name
   * @param {Object} data - Event data
   */
  broadcast(event, data) {
    this.io.emit(event, {
      ...data,
      timestamp: new Date()
    })
  }

  /**
   * Send real-time notifications
   */
  // Prospect-related events
  notifyProspectUpdate(prospectId, data) {
    this.emitToRoom(`prospect:${prospectId}`, 'prospect:updated', data)
  }

  notifyProspectEnriched(prospectId, userId, data) {
    this.emitToUser(userId, 'prospect:enriched', { prospectId, ...data })
    this.emitToRoom(`prospect:${prospectId}`, 'prospect:enriched', data)
  }

  notifyProspectScored(prospectId, userId, score) {
    this.emitToUser(userId, 'prospect:scored', { prospectId, score })
    this.emitToRoom(`prospect:${prospectId}`, 'prospect:scored', { score })
  }

  // Campaign-related events
  notifyCampaignStarted(campaignId, data) {
    this.emitToRoom(`campaign:${campaignId}`, 'campaign:started', data)
  }

  notifyCampaignProgress(campaignId, progress) {
    this.emitToRoom(`campaign:${campaignId}`, 'campaign:progress', { progress })
  }

  notifyCampaignCompleted(campaignId, results) {
    this.emitToRoom(`campaign:${campaignId}`, 'campaign:completed', { results })
  }

  // Message-related events
  notifyMessageSent(userId, messageData) {
    this.emitToUser(userId, 'message:sent', messageData)
  }

  notifyMessageOpened(userId, messageId, prospectId) {
    this.emitToUser(userId, 'message:opened', { messageId, prospectId })
  }

  notifyMessageClicked(userId, messageId, prospectId, link) {
    this.emitToUser(userId, 'message:clicked', { messageId, prospectId, link })
  }

  // Agent activity events
  notifyAgentActivity(userId, agentType, activity) {
    this.emitToUser(userId, 'agent:activity', { 
      agent: agentType, 
      activity,
      timestamp: new Date()
    })
  }

  // Analytics events
  notifyAnalyticsUpdate(userId, metrics) {
    this.emitToUser(userId, 'analytics:update', { metrics })
  }

  // System events
  notifySystemAlert(level, message, data = {}) {
    this.broadcast('system:alert', { level, message, ...data })
  }

  /**
   * Get connection status
   * @returns {Object} Connection statistics
   */
  getConnectionStats() {
    return {
      totalConnections: this.connections.size,
      connections: Array.from(this.connections.entries()).map(([userId, socketId]) => ({
        userId,
        socketId,
        connected: true
      }))
    }
  }
}

// Create singleton instance
const websocketService = new WebSocketService();

export default websocketService;
