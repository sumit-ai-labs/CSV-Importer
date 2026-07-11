/**
 * batch.service.test.ts
 *
 * Unit tests for backend/src/services/csv/batch.service.ts
 * Covers: batch size 1, batch size max, invalid batch size, empty rows,
 * single row, exact division, remainder handling, very large input,
 * immutability, and 100% branch coverage.
 */

import { createBatches } from './batch.service.js';
import type { CSVRow } from '../../types/csv.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Creates n identical CSV row objects. */
function makeRows(n: number): CSVRow[] {
  return Array.from({ length: n }, (_, i) => ({ id: String(i), value: `val${i}` }));
}

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

describe('createBatches', () => {
  // ── Invalid batch sizes ─────────────────────────────────────────────────

  describe('invalid batch size', () => {
    it('throws AppError when batchSize is 0', () => {
      expect(() => createBatches(makeRows(5), 0)).toThrow(
        expect.objectContaining({
          message: 'Batch size must be a positive integer',
          statusCode: 400,
          code: 'VALIDATION_ERROR',
        }),
      );
    });

    it('throws AppError when batchSize is negative', () => {
      expect(() => createBatches(makeRows(5), -1)).toThrow(
        expect.objectContaining({ statusCode: 400, code: 'VALIDATION_ERROR' }),
      );
    });

    it('throws AppError when batchSize is a float', () => {
      expect(() => createBatches(makeRows(5), 2.5)).toThrow(
        expect.objectContaining({ statusCode: 400, code: 'VALIDATION_ERROR' }),
      );
    });

    it('throws AppError when batchSize is NaN', () => {
      expect(() => createBatches(makeRows(5), NaN)).toThrow(
        expect.objectContaining({ statusCode: 400 }),
      );
    });

    it('throws AppError when batchSize is Infinity', () => {
      // Infinity passes Number.isInteger? No — isInteger(Infinity) is false.
      expect(() => createBatches(makeRows(5), Infinity)).toThrow(
        expect.objectContaining({ statusCode: 400 }),
      );
    });
  });

  // ── Empty rows ──────────────────────────────────────────────────────────

  describe('empty rows', () => {
    it('returns an empty frozen array when rows is empty', () => {
      const result = createBatches([], 5);
      expect(result).toEqual([]);
      expect(Object.isFrozen(result)).toBe(true);
    });
  });

  // ── Single row ──────────────────────────────────────────────────────────

  describe('single row', () => {
    it('returns one batch containing the single row', () => {
      const rows = makeRows(1);
      const result = createBatches(rows, 5);
      expect(result.length).toBe(1);
      expect(result[0].length).toBe(1);
      expect(result[0][0]).toEqual(rows[0]);
    });
  });

  // ── Batch size 1 ────────────────────────────────────────────────────────

  describe('batch size 1', () => {
    it('creates one batch per row', () => {
      const rows = makeRows(5);
      const result = createBatches(rows, 1);
      expect(result.length).toBe(5);
      result.forEach((batch, i) => {
        expect(batch.length).toBe(1);
        expect(batch[0]).toEqual(rows[i]);
      });
    });
  });

  // ── Exact division ──────────────────────────────────────────────────────

  describe('exact division (no remainder)', () => {
    it('creates the correct number of full batches', () => {
      const rows = makeRows(9);
      const result = createBatches(rows, 3);
      expect(result.length).toBe(3);
      expect(result[0].length).toBe(3);
      expect(result[1].length).toBe(3);
      expect(result[2].length).toBe(3);
    });

    it('preserves row order across batches', () => {
      const rows = makeRows(6);
      const result = createBatches(rows, 2);
      const allRows = result.flatMap((b) => [...b]);
      expect(allRows).toEqual(rows);
    });
  });

  // ── Remainder ───────────────────────────────────────────────────────────

  describe('remainder (non-exact division)', () => {
    it('places leftover rows in the last batch', () => {
      const rows = makeRows(10);
      const result = createBatches(rows, 3);
      // 3 full batches of 3 = 9, + 1 remainder
      expect(result.length).toBe(4);
      expect(result[0].length).toBe(3);
      expect(result[1].length).toBe(3);
      expect(result[2].length).toBe(3);
      expect(result[3].length).toBe(1);
    });

    it('preserves row order when there is a remainder', () => {
      const rows = makeRows(7);
      const result = createBatches(rows, 4);
      const allRows = result.flatMap((b) => [...b]);
      expect(allRows).toEqual(rows);
    });
  });

  // ── Batch size max ───────────────────────────────────────────────────────

  describe('batch size >= total rows (batch size max)', () => {
    it('returns a single batch when batchSize >= number of rows', () => {
      const rows = makeRows(5);
      const result = createBatches(rows, 100);
      expect(result.length).toBe(1);
      expect(result[0].length).toBe(5);
    });

    it('returns a single batch when batchSize equals row count exactly', () => {
      const rows = makeRows(5);
      const result = createBatches(rows, 5);
      expect(result.length).toBe(1);
      expect(result[0].length).toBe(5);
    });
  });

  // ── Very large input ─────────────────────────────────────────────────────

  describe('very large input', () => {
    it('handles 100 000 rows with batchSize 15 correctly', () => {
      const rows = makeRows(100_000);
      const result = createBatches(rows, 15);

      const expectedBatches = Math.ceil(100_000 / 15);
      expect(result.length).toBe(expectedBatches);

      // First and last batch contents
      expect(result[0].length).toBe(15);
      const lastBatch = result[result.length - 1];
      const remainder = 100_000 % 15;
      expect(lastBatch.length).toBe(remainder === 0 ? 15 : remainder);
    });
  });

  // ── Immutability ─────────────────────────────────────────────────────────

  describe('immutability', () => {
    it('freezes the returned top-level batches array', () => {
      const result = createBatches(makeRows(5), 2);
      expect(Object.isFrozen(result)).toBe(true);
    });

    it('freezes each individual batch', () => {
      const result = createBatches(makeRows(5), 2);
      result.forEach((batch) => {
        expect(Object.isFrozen(batch)).toBe(true);
      });
    });

    it('does not mutate the original rows array', () => {
      const rows = makeRows(4);
      const original = JSON.stringify(rows);
      createBatches(rows, 2);
      expect(JSON.stringify(rows)).toBe(original);
    });
  });
});
