import winston from 'winston';
import { config } from '../../config/index.js';

const { combine, timestamp, json, printf, colorize, errors } = winston.format;

// Custom format for development
const devFormat = printf(({ level, message, timestamp, ...metadata }) => {
  let msg = `${timestamp} [${level}] ${message}`;
  if (Object.keys(metadata).length > 0) {
    msg += ` ${JSON.stringify(metadata)}`;
  }
  return msg;
});

// Create logger instance
export const logger = winston.createLogger({
  level: config.log.level,
  format: combine(
    errors({ stack: true }),
    timestamp(),
    config.nodeEnv === 'development' ? devFormat : json()
  ),
  transports: [
    new winston.transports.Console({
      format: config.nodeEnv === 'development' 
        ? combine(colorize(), devFormat)
        : json()
    })
  ]
});

// Log unhandled errors
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', { promise, reason });
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

export default logger;
