/**
 * use-csv-preview.test.ts
 *
 * Unit tests for frontend/src/hooks/use-csv-preview.ts
 *
 * PapaParse is fully mocked; tests cover:
 *   valid CSV, empty CSV, large file, parse error, unicode,
 *   headers extraction, preview limit enforcement, loading state,
 *   error state, and cleanup on file change.
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { ParseResult, ParseConfig } from 'papaparse';

// ---------------------------------------------------------------------------
// 1. Mock PapaParse
// ---------------------------------------------------------------------------

vi.mock('papaparse', () => {
  const Papa = {
    parse: vi.fn(),
  };
  return { default: Papa };
});

// ---------------------------------------------------------------------------
// 2. Import after mocks
// ---------------------------------------------------------------------------

import { useCsvPreview } from './use-csv-preview';
import Papa from 'papaparse';

const mockPapaParse = Papa.parse as ReturnType<typeof vi.fn>;

// ---------------------------------------------------------------------------
// 3. Helpers
// ---------------------------------------------------------------------------

/** Creates a synthetic File object from a CSV string. */
function makeFile(content: string, name = 'test.csv', type = 'text/csv'): File {
  return new File([content], name, { type });
}

/** Triggers PapaParse's `complete` callback synchronously. */
function resolveParseWith(data: Record<string, string>[], fields: string[]) {
  mockPapaParse.mockImplementation((_file: File, config: ParseConfig<Record<string, string>>) => {
    config.complete?.({
      data,
      errors: [],
      meta: {
        fields,
        delimiter: ',',
        linebreak: '\n',
        aborted: false,
        truncated: false,
        cursor: 0,
      },
    } as ParseResult<Record<string, string>>);
  });
}

/** Triggers PapaParse's `error` callback synchronously. */
function resolveParseError(message: string) {
  mockPapaParse.mockImplementation((_file: File, config: ParseConfig<Record<string, string>>) => {
    config.error?.({ message, code: '', type: 'Quotes', row: 0 }, undefined as any);
  });
}

/** Triggers PapaParse's `complete` with a try/catch error inside it. */
function resolveParseWithThrow(message: string) {
  mockPapaParse.mockImplementation((_file: File, config: ParseConfig<Record<string, string>>) => {
    config.complete?.({
      get data(): any {
        throw new Error(message);
      },
      errors: [],
      meta: {
        fields: ['a'],
        delimiter: ',',
        linebreak: '\n',
        aborted: false,
        truncated: false,
        cursor: 0,
      },
    } as any);
  });
}

// ---------------------------------------------------------------------------
// 4. Tests
// ---------------------------------------------------------------------------

describe('useCsvPreview', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── Initial state (null file) ─────────────────────────────────────────

  describe('initial state', () => {
    it('returns empty state when file is null', () => {
      const { result } = renderHook(() => useCsvPreview(null));

      expect(result.current.headers).toEqual([]);
      expect(result.current.rows).toEqual([]);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });

  // ── Valid CSV ─────────────────────────────────────────────────────────

  describe('valid CSV', () => {
    it('extracts headers from meta.fields', async () => {
      resolveParseWith([{ name: 'Alice', email: 'alice@test.com' }], ['name', 'email']);

      const file = makeFile('name,email\nAlice,alice@test.com\n');
      const { result } = renderHook(() => useCsvPreview(file));

      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(result.current.headers).toEqual(['name', 'email']);
      expect(result.current.error).toBeNull();
    });

    it('populates rows with correct data', async () => {
      resolveParseWith([{ name: 'Alice', email: 'alice@test.com' }], ['name', 'email']);

      const file = makeFile('name,email\nAlice,alice@test.com\n');
      const { result } = renderHook(() => useCsvPreview(file));

      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(result.current.rows).toHaveLength(1);
      expect(result.current.rows[0]).toMatchObject({ name: 'Alice', email: 'alice@test.com' });
    });

    it('converts numeric string values to numbers', async () => {
      resolveParseWith([{ name: 'Alice', age: '30' }], ['name', 'age']);

      const file = makeFile('name,age\nAlice,30\n');
      const { result } = renderHook(() => useCsvPreview(file));

      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(result.current.rows[0]['age']).toBe(30);
    });

    it('keeps non-numeric values as strings', async () => {
      resolveParseWith([{ name: 'Alice', phone: 'not-a-number' }], ['name', 'phone']);

      const file = makeFile('name,phone\nAlice,not-a-number\n');
      const { result } = renderHook(() => useCsvPreview(file));

      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(typeof result.current.rows[0]['phone']).toBe('string');
    });

    it('keeps formatting like leading plus signs and leading zeros as strings', async () => {
      resolveParseWith(
        [{ name: 'Alice', phone: '+919999999999', zip: '01234' }],
        ['name', 'phone', 'zip'],
      );

      const file = makeFile('name,phone,zip\nAlice,+919999999999,01234\n');
      const { result } = renderHook(() => useCsvPreview(file));

      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(result.current.rows[0]['phone']).toBe('+919999999999');
      expect(result.current.rows[0]['zip']).toBe('01234');
    });
  });

  // ── Empty CSV ─────────────────────────────────────────────────────────

  describe('empty CSV', () => {
    it('returns empty rows when PapaParse returns no data', async () => {
      resolveParseWith([], ['name', 'email']);

      const file = makeFile('name,email\n');
      const { result } = renderHook(() => useCsvPreview(file));

      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(result.current.rows).toHaveLength(0);
      expect(result.current.headers).toEqual(['name', 'email']);
    });

    it('returns empty headers when meta.fields is undefined', async () => {
      mockPapaParse.mockImplementation(
        (_file: File, config: ParseConfig<Record<string, string>>) => {
          config.complete?.({
            data: [],
            errors: [],
            meta: { delimiter: ',', linebreak: '\n', aborted: false, truncated: false, cursor: 0 },
          } as any);
        },
      );

      const file = makeFile('');
      const { result } = renderHook(() => useCsvPreview(file));

      await waitFor(() => expect(result.current.loading).toBe(false));
      expect(result.current.headers).toEqual([]);
    });
  });

  // ── Preview limit ─────────────────────────────────────────────────────

  describe('preview limit', () => {
    it('limits displayed rows to DEFAULT_PREVIEW_ROWS (10)', async () => {
      const manyRows = Array.from({ length: 20 }, (_, i) => ({
        id: String(i),
        val: `v${i}`,
      }));
      resolveParseWith(manyRows, ['id', 'val']);

      const file = makeFile('id,val\n' + manyRows.map((r) => `${r.id},${r.val}`).join('\n'));
      const { result } = renderHook(() => useCsvPreview(file));

      await waitFor(() => expect(result.current.loading).toBe(false));

      // DEFAULT_PREVIEW_ROWS = 10
      expect(result.current.rows.length).toBeLessThanOrEqual(10);
    });
  });

  describe('large file', () => {
    it('parses the full file to set totalRows correctly while rows are limited', async () => {
      const manyRows = Array.from({ length: 50 }, (_, i) => ({
        id: String(i),
        val: `v${i}`,
      }));
      resolveParseWith(manyRows, ['id', 'val']);

      const file = makeFile('id,val\n' + manyRows.map((r) => `${r.id},${r.val}`).join('\n'));
      const { result } = renderHook(() => useCsvPreview(file));

      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(result.current.totalRows).toBe(50);
      expect(result.current.rows.length).toBe(10);
    });
  });

  // ── Parse error ───────────────────────────────────────────────────────

  describe('parse error', () => {
    it('sets error state on PapaParse error callback', async () => {
      resolveParseError('Invalid closing quote');

      const file = makeFile('name,email\n"Alice,broken');
      const { result } = renderHook(() => useCsvPreview(file));

      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(result.current.error).toContain('Invalid closing quote');
      expect(result.current.rows).toHaveLength(0);
    });

    it('sets error state when complete callback throws', async () => {
      resolveParseWithThrow('Unexpected data structure');

      const file = makeFile('a,b\n1,2\n');
      const { result } = renderHook(() => useCsvPreview(file));

      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(result.current.error).toContain('Unexpected data structure');
    });
  });

  // ── Loading state ─────────────────────────────────────────────────────

  describe('loading state', () => {
    it('is true while parse is in progress', () => {
      // Don't call complete/error — parse hangs
      mockPapaParse.mockImplementation(() => {});

      const file = makeFile('a,b\n1,2\n');
      const { result } = renderHook(() => useCsvPreview(file));

      expect(result.current.loading).toBe(true);
    });

    it('resets to false after successful parse', async () => {
      resolveParseWith([{ a: '1', b: '2' }], ['a', 'b']);

      const file = makeFile('a,b\n1,2\n');
      const { result } = renderHook(() => useCsvPreview(file));

      await waitFor(() => expect(result.current.loading).toBe(false));
    });

    it('resets to false after a parse error', async () => {
      resolveParseError('Parse failed');

      const file = makeFile('broken');
      const { result } = renderHook(() => useCsvPreview(file));

      await waitFor(() => expect(result.current.loading).toBe(false));
    });
  });

  // ── Unicode ───────────────────────────────────────────────────────────

  describe('unicode', () => {
    it('handles Cyrillic headers and values', async () => {
      resolveParseWith([{ имя: 'Алиса' }], ['имя']);

      const file = makeFile('имя\nАлиса\n');
      const { result } = renderHook(() => useCsvPreview(file));

      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(result.current.headers).toContain('имя');
      expect(result.current.rows[0]['имя']).toBe('Алиса');
    });

    it('handles emoji values', async () => {
      resolveParseWith([{ name: 'Alice 🌍' }], ['name']);

      const file = makeFile('name\nAlice 🌍\n');
      const { result } = renderHook(() => useCsvPreview(file));

      await waitFor(() => expect(result.current.loading).toBe(false));
      expect(result.current.rows[0]['name']).toBe('Alice 🌍');
    });
  });

  // ── Cleanup (file change) ─────────────────────────────────────────────

  describe('cleanup on file change', () => {
    it('resets state to defaults when file becomes null', async () => {
      resolveParseWith([{ name: 'Alice' }], ['name']);

      const { result, rerender } = renderHook(
        ({ file }: { file: File | null }) => useCsvPreview(file),
        { initialProps: { file: makeFile('name\nAlice\n') } },
      );

      await waitFor(() => expect(result.current.loading).toBe(false));
      expect(result.current.rows).toHaveLength(1);

      // Now remove the file
      rerender({ file: null });

      expect(result.current.headers).toEqual([]);
      expect(result.current.rows).toEqual([]);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('triggers a fresh parse when a new file is provided', () => {
      mockPapaParse.mockImplementation(() => {});

      const file1 = makeFile('a,b\n1,2\n', 'file1.csv');
      const file2 = makeFile('x,y\n3,4\n', 'file2.csv');

      const { rerender } = renderHook(({ file }: { file: File | null }) => useCsvPreview(file), {
        initialProps: { file: file1 },
      });

      rerender({ file: file2 });

      // Papa.parse should have been called twice (once per file)
      expect(mockPapaParse).toHaveBeenCalledTimes(2);
    });
  });
});
