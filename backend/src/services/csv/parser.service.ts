import { Readable } from 'stream';
import { parse } from 'csv-parse';
import { CSVParseResult, CSVRow } from '../../types/csv.js';
import AppError from '../../errors/app-error.js';
import { ERROR_CODES } from '../../constants/error-codes.js';

/**
 * Parses a CSV input stream using Node.js stream pipeline and csv-parse.
 */
export const parseCSV = async (stream: Readable): Promise<CSVParseResult> => {
  return new Promise((resolve, reject) => {
    const rows: CSVRow[] = [];

    const parser = parse({
      columns: true, // Auto-discover columns from first line
      skip_empty_lines: true,
      trim: true,
      relax_column_count: true,
    });

    stream.on('error', (error) => {
      reject(
        new AppError(`CSV input stream error: ${error.message}`, 400, ERROR_CODES.CSV_PARSE_ERROR),
      );
    });

    parser.on('readable', () => {
      let record: CSVRow;
      while ((record = parser.read()) !== null) {
        rows.push(record);
      }
    });

    parser.on('error', (err) => {
      reject(new AppError(`CSV parsing failed: ${err.message}`, 400, ERROR_CODES.CSV_PARSE_ERROR));
    });

    parser.on('end', () => {
      const columnOptions = parser.options.columns;

      if (!columnOptions || !Array.isArray(columnOptions) || columnOptions.length === 0) {
        return reject(
          new AppError('CSV data has missing or invalid headers', 400, ERROR_CODES.CSV_PARSE_ERROR),
        );
      }

      const headers = columnOptions.map((col) => {
        if (typeof col === 'string') return col;
        if (col && typeof col === 'object' && 'name' in col) return col.name;
        return '';
      });

      if (headers.every((h) => !h || !h.trim())) {
        return reject(
          new AppError('CSV data has missing or invalid headers', 400, ERROR_CODES.CSV_PARSE_ERROR),
        );
      }

      if (rows.length === 0) {
        return reject(
          new AppError('CSV data contains no records', 400, ERROR_CODES.CSV_PARSE_ERROR),
        );
      }

      resolve({
        headers: Object.freeze(headers),
        rows: Object.freeze(rows),
        totalRows: rows.length,
      });
    });

    stream.pipe(parser);
  });
};
