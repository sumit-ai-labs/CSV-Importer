import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

/**
 * Middleware that assigns a unique request ID to each incoming request.
 * Exposes the ID on the request object and in response headers.
 */
export const requestIdMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const requestId = (req.headers['x-request-id'] as string) || crypto.randomUUID();
  req.requestId = requestId;
  res.setHeader('x-request-id', requestId);
  next();
};
