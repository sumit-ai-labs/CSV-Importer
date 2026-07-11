import { CSVRow, CSVBatch } from '../../types/csv.js';
import AppError from '../../errors/app-error.js';
import { ERROR_CODES } from '../../constants/error-codes.js';

/**
 * Splits a list of CSV rows into batches of the specified size.
 * Pure, synchronous function throwing AppError for invalid sizes.
 */
export const createBatches = (rows: readonly CSVRow[], batchSize: number): readonly CSVBatch[] => {
  if (batchSize <= 0 || !Number.isInteger(batchSize)) {
    throw new AppError('Batch size must be a positive integer', 400, ERROR_CODES.VALIDATION_ERROR);
  }

  const batches: CSVBatch[] = [];
  for (let i = 0; i < rows.length; i += batchSize) {
    batches.push(Object.freeze(rows.slice(i, i + batchSize)));
  }

  return Object.freeze(batches);
};
