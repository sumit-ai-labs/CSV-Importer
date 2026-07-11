import { Request, Response, NextFunction } from 'express';
import AppError from '../errors/app-error.js';
import { ERROR_CODES } from '../constants/error-codes.js';

/**
 * Middleware to handle unregistered routes by passing a 404 AppError to the next handler.
 */
export const notFoundHandler = (req: Request, _res: Response, next: NextFunction): void => {
  next(
    new AppError(`Route ${req.method} ${req.originalUrl} not found`, 404, ERROR_CODES.NOT_FOUND),
  );
};
