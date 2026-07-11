import { Request, Response } from 'express';
import { ApiResponse } from '../types/api.js';
import { env } from '../config/env.js';

/**
 * Controller containing the endpoint for service health status check.
 */
export const healthController = {
  getHealth: (_req: Request, res: Response): void => {
    const response: ApiResponse<{
      status: string;
      version: string;
      environment: string;
      timestamp: string;
    }> = {
      success: true,
      message: 'Health check successful',
      data: {
        status: 'UP',
        version: '1.0.0',
        environment: env.NODE_ENV,
        timestamp: new Date().toISOString(),
      },
    };

    res.status(200).json(response);
  },
};
