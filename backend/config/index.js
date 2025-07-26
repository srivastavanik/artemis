import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '../../.env') });

export const config = {
  // Server
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // API Keys
  arcade: {
    apiKey: process.env.ARCADE_API_KEY,
    baseUrl: 'https://api.arcade.software/v1'
  },
  
  llamaIndex: {
    apiKey: process.env.LLAMAINDEX_API_KEY,
    baseUrl: 'https://api.llamaindex.ai/v1'
  },
  
  brightData: {
    apiKey: process.env.BRIGHTDATA_API_KEY,
    baseUrl: 'https://api.brightdata.com/v2'
  },
  
  supabase: {
    url: process.env.SUPABASE_URL,
    anonKey: process.env.SUPABASE_ANON_KEY,
    serviceKey: process.env.SUPABASE_SERVICE_KEY
  },
  
  mastra: {
    apiKey: process.env.MASTRA_API_KEY,
    webhookSecret: process.env.MASTRA_WEBHOOK_SECRET
  },
  
  // Redis
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379'
  },
  
  // JWT
  jwt: {
    secret: process.env.JWT_SECRET || 'your-super-secret-key',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  },
  
  // Rate Limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000'),
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100')
  },
  
  // Logging
  log: {
    level: process.env.LOG_LEVEL || 'debug',
    format: process.env.LOG_FORMAT || 'json'
  }
};
