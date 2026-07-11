import multer from 'multer';
import { Request, Response, NextFunction } from 'express';
import AppError from '../errors/app-error.js';
import { ERROR_CODES } from '../constants/error-codes.js';
import { MAX_UPLOAD_SIZE, SUPPORTED_MIME_TYPES } from '../constants/csv.js';

const storage = multer.memoryStorage();

const fileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback,
): void => {
  if (!SUPPORTED_MIME_TYPES.includes(file.mimetype as any)) {
    return cb(new AppError('Only CSV files are supported', 400, ERROR_CODES.INVALID_FILE));
  }
  cb(null, true);
};

const upload = multer({
  storage,
  limits: {
    fileSize: MAX_UPLOAD_SIZE,
  },
  fileFilter,
}).single('file');

/**
 * Middleware wrapper for handling single CSV file uploads via Multer.
 * Translates standard upload and file-size errors into AppErrors.
 */
export const handleCSVUpload = (req: Request, res: Response, next: NextFunction): void => {
  upload(req, res, (err: unknown) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return next(
            new AppError(
              `File size exceeds the limit of ${MAX_UPLOAD_SIZE / (1024 * 1024)}MB`,
              400,
              ERROR_CODES.INVALID_FILE,
            ),
          );
        }
        return next(
          new AppError(`File upload error: ${err.message}`, 400, ERROR_CODES.INVALID_FILE),
        );
      }
      return next(err);
    }

    if (!req.file) {
      return next(new AppError('No file uploaded', 400, ERROR_CODES.INVALID_FILE));
    }

    next();
  });
};
