import { Request, Response, NextFunction } from 'express';
import AppError from '../errors/app-error.js';
import { logger } from '../config/logger.js';
import { ApiResponse } from '../types/api.js';
import { ERROR_CODES } from '../constants/error-codes.js';

/**
 * Global error-handling middleware for Express.
 */
export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  let statusCode = 500;
  let code: string = ERROR_CODES.INTERNAL_SERVER_ERROR;
  let message = 'An unexpected error occurred.';
  let isOperational = false;

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    code = err.code;
    message = err.message;
    isOperational = err.isOperational;
  }

  // Log error using pino singleton logger
  logger.error(
    {
      requestId: req.requestId,
      err: {
        message: err.message,
        stack: err.stack,
        code,
      },
      isOperational,
    },
    'Request error occurred',
  );

  const isProd = process.env.NODE_ENV === 'production';

  const response: ApiResponse<null> = {
    success: false,
    message: isProd && !isOperational ? 'An unexpected error occurred.' : message,
    data: null,
    error: {
      code,
      message: isProd && !isOperational ? 'An unexpected error occurred.' : message,
      ...(!isProd ? { details: { stack: err.stack } } : {}),
    },
  };

  res.status(statusCode).json(response);
};
