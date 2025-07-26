const jwt = require('jsonwebtoken')
const config = require('../../config')
const logger = require('../utils/logger')

/**
 * Authentication middleware to verify JWT tokens
 */
const authenticate = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'No token provided'
      })
    }

    const token = authHeader.substring(7)

    try {
      // Verify token
      const decoded = jwt.verify(token, config.jwtSecret)
      
      // Add user info to request
      req.user = {
        id: decoded.userId,
        email: decoded.email,
        role: decoded.role
      }

      logger.info('User authenticated', { userId: decoded.userId })
      next()
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          error: 'Token expired'
        })
      }

      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({
          success: false,
          error: 'Invalid token'
        })
      }

      throw error
    }
  } catch (error) {
    logger.error('Authentication error:', error)
    res.status(500).json({
      success: false,
      error: 'Authentication failed'
    })
  }
}

/**
 * Authorization middleware to check user roles
 * @param {string[]} allowedRoles - Array of allowed roles
 */
const authorize = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated'
      })
    }

    if (!allowedRoles.includes(req.user.role)) {
      logger.warn('Authorization failed', { 
        userId: req.user.id, 
        role: req.user.role,
        required: allowedRoles 
      })
      
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions'
      })
    }

    next()
  }
}

/**
 * Generate JWT token
 * @param {Object} user - User object
 * @returns {string} JWT token
 */
const generateToken = (user) => {
  const payload = {
    userId: user.id,
    email: user.email,
    role: user.role || 'user'
  }

  return jwt.sign(payload, config.jwtSecret, {
    expiresIn: '7d'
  })
}

/**
 * Optional authentication - doesn't fail if no token provided
 */
const optionalAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next()
  }

  const token = authHeader.substring(7)

  try {
    const decoded = jwt.verify(token, config.jwtSecret)
    req.user = {
      id: decoded.userId,
      email: decoded.email,
      role: decoded.role
    }
  } catch (error) {
    // Invalid token, but continue without user
    logger.debug('Optional auth failed', { error: error.message })
  }

  next()
}

module.exports = {
  authenticate,
  authorize,
  generateToken,
  optionalAuth
}
