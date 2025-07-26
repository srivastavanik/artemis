import rateLimit from 'express-rate-limit';
import { logger } from '../utils/logger.js';

/**
 * Create rate limiter for API endpoints
 */
const createRateLimiter = (options = {}) => {
  const defaults = {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    handler: (req, res) => {
      logger.warn('Rate limit exceeded', {
        ip: req.ip,
        path: req.path,
        method: req.method
      })
      
      res.status(429).json({
        success: false,
        error: options.message || defaults.message
      })
    }
  }

  return rateLimit({ ...defaults, ...options })
}

// Different rate limiters for different endpoints
const rateLimiters = {
  // General API rate limiter
  general: createRateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 100
  }),

  // Stricter rate limit for auth endpoints
  auth: createRateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: 'Too many authentication attempts, please try again later.',
    skipSuccessfulRequests: true
  }),

  // Rate limiter for prospect search/enrichment
  enrichment: createRateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 50,
    message: 'Enrichment rate limit exceeded. Please try again later.'
  }),

  // Rate limiter for campaign creation
  campaigns: createRateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 20,
    message: 'Campaign creation rate limit exceeded. Please try again later.'
  }),

  // Rate limiter for analytics/reporting
  analytics: createRateLimiter({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 30,
    message: 'Analytics rate limit exceeded. Please try again later.'
  }),

  // Rate limiter for AI agent interactions
  agents: createRateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 100,
    message: 'AI agent interaction rate limit exceeded. Please try again later.'
  })
}

// Skip rate limiting for certain conditions
const skipRateLimit = (req) => {
  // Skip for health checks
  if (req.path === '/health') return true
  
  // Skip for authenticated admin users
  if (req.user && req.user.role === 'admin') return true
  
  // Skip for local development (optional)
  if (process.env.NODE_ENV === 'development' && req.ip === '::1') return true
  
  return false
}

// Wrapper to add skip functionality
const withSkip = (limiter) => {
  return (req, res, next) => {
    if (skipRateLimit(req)) {
      return next()
    }
    return limiter(req, res, next)
  }
}

export default {
  general: withSkip(rateLimiters.general),
  auth: withSkip(rateLimiters.auth),
  enrichment: withSkip(rateLimiters.enrichment),
  campaigns: withSkip(rateLimiters.campaigns),
  analytics: withSkip(rateLimiters.analytics),
  agents: withSkip(rateLimiters.agents),
  createCustomLimiter: createRateLimiter
};
