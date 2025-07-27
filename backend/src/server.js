import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import config from '../config/index.js';
import { logger } from './utils/logger.js';
import prospectRoutes from './routes/prospects.routes.js';
import campaignRoutes from './routes/campaigns.routes.js';
import analyticsRoutes from './routes/analytics.routes.js';
import webhookRoutes from './routes/webhooks.routes.js';
import testRoutes from './routes/test.routes.js';
import authRoutes from './routes/auth.routes.js';
import executorAgent from './agents/executor.agent.js';
import websocketService from './services/websocket.service.js';
import { authenticate, optionalAuth } from './middleware/auth.middleware.js';
import rateLimit from './middleware/rateLimit.middleware.js';
import llamaIndexService from './services/llamaindex.service.js';

// Load environment variables
dotenv.config();

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize Express app
const app = express();

// Create HTTP server
const server = createServer(app);

// Initialize WebSocket service
websocketService.initialize(server);

// Apply general rate limiting
app.use(rateLimit.general);

// Middleware
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://artemis-murex.vercel.app',
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Allow any localhost port in development
    if (process.env.NODE_ENV !== 'production' && origin.includes('localhost')) {
      return callback(null, true);
    }
    
    // Check if origin is in allowed list
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    // Log the rejected origin for debugging
    logger.warn('CORS rejected origin:', { origin, allowedOrigins });
    
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Handle preflight requests
app.options('*', cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    query: req.query,
    body: req.body,
    ip: req.ip
  });
  next();
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'ARTEMIS AI-Powered Sales Intelligence Platform API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      prospects: '/api/prospects',
      campaigns: '/api/campaigns',
      analytics: '/api/analytics'
    }
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    websocket: websocketService.getConnectionStats()
  });
});

// Auth routes (no auth middleware on auth routes themselves)
app.use('/api/auth', authRoutes);

// API Routes with rate limiting
app.use('/api/prospects', optionalAuth, rateLimit.enrichment, prospectRoutes);
app.use('/api/campaigns', optionalAuth, rateLimit.campaigns, campaignRoutes);
app.use('/api/analytics', optionalAuth, rateLimit.analytics, analyticsRoutes);

// Webhook routes (no auth required for external webhooks)
app.use('/api/webhooks', webhookRoutes);

// Test routes (only in development)
if (process.env.NODE_ENV !== 'production') {
  app.use('/api/test', testRoutes);
}

// Static files for frontend (only if not deployed separately)
if (process.env.NODE_ENV === 'production' && process.env.SERVE_FRONTEND === 'true') {
  app.use(express.static(join(__dirname, '../../frontend/dist')));
  
  // Catch all route for SPA
  app.get('*', (req, res) => {
    res.sendFile(join(__dirname, '../../frontend/dist/index.html'));
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('Unhandled error', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method
  });
  
  res.status(err.status || 500).json({
    success: false,
    error: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found'
  });
});

// Initialize Pinecone on startup (if configured)
const initializePinecone = async () => {
  if (config.pinecone.apiKey && config.pinecone.environment) {
    try {
      logger.info('Initializing Pinecone index...');
      await llamaIndexService.initializeIndex();
      logger.info('✅ Pinecone index initialized successfully');
    } catch (error) {
      logger.error('❌ Failed to initialize Pinecone:', error);
      // Don't fail startup, just log the error
    }
  } else {
    logger.warn('Pinecone not configured - skipping initialization');
  }
};

// Start server
const PORT = process.env.PORT || config.port;

server.listen(PORT, async () => {
  logger.info(`Server running on port ${PORT}`, {
    environment: process.env.NODE_ENV,
    nodeVersion: process.version,
    websocket: 'enabled'
  });
  
  // Initialize Pinecone after server starts
  await initializePinecone();
  
  // Log available routes
  logger.info('Available routes:', {
    routes: [
      'GET /health',
      'GET /api/prospects',
      'POST /api/prospects',
      'POST /api/prospects/discover',
      'POST /api/prospects/:id/enrich',
      'POST /api/prospects/:id/analyze',
      'GET /api/campaigns',
      'POST /api/campaigns',
      'POST /api/campaigns/execute',
      'GET /api/analytics',
      'GET /api/analytics/agents',
      'GET /api/analytics/funnel',
      'GET /api/analytics/content',
      'GET /api/analytics/scores',
      'GET /api/analytics/roi'
    ]
  });
  
  // Log WebSocket status
  logger.info('WebSocket server ready', {
    transport: 'ws://',
    port: PORT
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});

export default app;
