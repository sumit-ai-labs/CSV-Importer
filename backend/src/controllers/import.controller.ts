import { Request, Response, NextFunction } from 'express';
import { Readable } from 'stream';
import { importService } from '../services/import/import.service.js';
import { ApiResponse } from '../types/api.js';
import { ImportResult } from '../types/crm.js';
import AppError from '../errors/app-error.js';
import { ERROR_CODES } from '../constants/error-codes.js';

/**
 * Controller handling CSV import operations.
 * Processes CSV data completely in-memory using Readable streams.
 */
export const importController = {
  importCSV: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (!req.file) {
      return next(new AppError('No file uploaded', 400, ERROR_CODES.INVALID_FILE));
    }

    try {
      // Convert in-memory buffer to Readable stream
      const csvStream = Readable.from(req.file.buffer);

      // Delegate processing to the import service orchestrator
      const result: ImportResult = await importService.importCSV(csvStream, req.requestId);

      const response: ApiResponse<ImportResult> = {
        success: true,
        message: 'CSV import completed successfully',
        data: result,
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  },
};
