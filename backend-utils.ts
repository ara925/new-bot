// backend/src/utils/logger.ts
import winston from 'winston';

/**
 * Creates a logger instance with the given module name
 * @param module Module name for the logger
 * @returns Winston logger instance
 */
export const createLogger = (module: string) => {
  const logger = winston.createLogger({
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    format: winston.format.combine(
      winston.format.timestamp({
        format: 'YYYY-MM-DD HH:mm:ss'
      }),
      winston.format.errors({ stack: true }),
      winston.format.splat(),
      winston.format.json()
    ),
    defaultMeta: { service: 'textbuilder-api', module },
    transports: [
      // Console transport for all environments
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.printf(
            ({ timestamp, level, message, module }) =>
              `${timestamp} [${module}] ${level}: ${message}`
          )
        )
      })
    ]
  });

  // Add file transports in production
  if (process.env.NODE_ENV === 'production') {
    logger.add(
      new winston.transports.File({ filename: 'logs/error.log', level: 'error' })
    );
    logger.add(
      new winston.transports.File({ filename: 'logs/combined.log' })
    );
  }

  return logger;
};

// backend/src/middleware/error.ts
import { Request, Response, NextFunction } from 'express';
import { createLogger } from '../utils/logger';

const logger = createLogger('errorHandler');

/**
 * Custom error class for API errors with status code
 */
export class ApiError extends Error {
  statusCode: number;
  
  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Async handler to catch async errors
 */
export const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Global error handler middleware
 */
export const errorHandler = (err: Error | ApiError, req: Request, res: Response, next: NextFunction) => {
  logger.error(err);

  // Default error status and message
  let statusCode = 500;
  let message = 'Server Error';

  // Check if error is our ApiError class
  if (err instanceof ApiError) {
    statusCode = err.statusCode;
    message = err.message;
  } else if (err.name === 'ValidationError') {
    // Mongoose validation error
    statusCode = 400;
    message = err.message;
  } else if (err.name === 'CastError') {
    // Mongoose casting error (e.g., invalid ObjectId)
    statusCode = 400;
    message = 'Resource not found';
  } else if (err.name === 'JsonWebTokenError') {
    // JWT error
    statusCode = 401;
    message = 'Invalid token';
  } else if (err.name === 'TokenExpiredError') {
    // JWT expired
    statusCode = 401;
    message = 'Token expired';
  }

  // Return error response
  res.status(statusCode).json({
    success: false,
    error: message,
    stack: process.env.NODE_ENV === 'production' ? undefined : err.stack
  });
};

// Helper function to create API errors
export const createError = (message: string, statusCode: number) => {
  return new ApiError(message, statusCode);
};
