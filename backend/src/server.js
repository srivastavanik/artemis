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
import executorAgent from './agents/executor.agent.js';
import websocketService from './services/websocket.service.js';
import { authenticate, optionalAuth } from './middleware/auth.middleware.js';
import rateLimit from './middleware/rateLimit.middleware.js';

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
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
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

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    websocket: websocketService.getConnectionStats()
  });
});

// API Routes with rate limiting
app.use('/api/prospects', optionalAuth, rateLimit.enrichment, prospectRoutes);
app.use('/api/campaigns', optionalAuth, rateLimit.campaigns, campaignRoutes);
app.use('/api/analytics', optionalAuth, rateLimit.analytics, analyticsRoutes);

// Webhook endpoint for Arcade
app.post('/webhooks/arcade', async (req, res) => {
  try {
    // Verify webhook signature if needed
    const signature = req.headers['x-arcade-signature'];
    
    // Process webhook
    await executorAgent.handleWebhook(req.body);
    
    res.status(200).json({ received: true });
  } catch (error) {
    logger.error('Webhook processing failed', { error: error.message });
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// Static files for frontend (in production)
if (process.env.NODE_ENV === 'production') {
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

// Start server
const PORT = process.env.PORT || config.port;

app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`, {
    environment: process.env.NODE_ENV,
    nodeVersion: process.version
  });
  
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
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  app.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});

export default app;
