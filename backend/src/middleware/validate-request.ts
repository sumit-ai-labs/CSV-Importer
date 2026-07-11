import { NextFunction, Request, Response } from 'express';
import { AnyZodObject } from 'zod';
import AppError from '../errors/app-error.js';

export const validateRequest = (schema: AnyZodObject) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const parsed = schema.safeParse({
      body: req.body,
      query: req.query,
      params: req.params,
    });

    if (!parsed.success) {
      const errorMessage = parsed.error.errors
        .map((e) => `${e.path.join('.')}: ${e.message}`)
        .join(', ');
      next(new AppError(errorMessage, 400, 'VALIDATION_ERROR'));
      return;
    }

    next();
  };
};
