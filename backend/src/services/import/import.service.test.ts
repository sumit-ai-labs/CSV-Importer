/**
 * import.service.test.ts
 *
 * Unit tests for backend/src/services/import/import.service.ts
 *
 * All external dependencies are mocked:
 *   - parseCSV         (../csv/parser.service)
 *   - createBatches    (../csv/batch.service)
 *   - extractLeadsWithAI (../ai/ai.service)
 *   - normalizeRecord  (./normalize.service)
 *   - generateSummary  (./summary.service)
 *   - env              (../../config/env)
 *   - logger           (../../config/logger)
 *   - crmRecordSchema  (../../schemas/crm.schema)
 *   - PROMPT_VERSION   (../../prompts/crm-extraction.prompt)
 */

import { Readable } from 'stream';
import { jest } from '@jest/globals';

// ---------------------------------------------------------------------------
// 1.  Mock all dependencies BEFORE importing the module under test
// ---------------------------------------------------------------------------

jest.mock('../csv/parser.service.js');
jest.mock('../csv/batch.service.js');
jest.mock('../ai/ai.service.js');
jest.mock('./normalize.service.js');
jest.mock('./summary.service.js');
jest.mock('../../config/env.js', () => ({
  env: {
    DEFAULT_BATCH_SIZE: 15,
    AI_PROVIDER: 'openai',
    OPENAI_MODEL: 'gpt-4o',
    GEMINI_MODEL: 'gemini-pro',
  },
}));
jest.mock('../../config/logger.js', () => ({
  __esModule: true,
  default: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));
jest.mock('../../prompts/crm-extraction.prompt.js', () => ({
  PROMPT_VERSION: 'v1',
}));
// Prevent OpenAI / Google GenAI SDKs from throwing during module resolution
jest.mock('../../config/openai.js', () => ({
  openai: { chat: { completions: { create: jest.fn() } } },
}));
jest.mock('../../config/gemini.js', () => ({
  genAI: { getGenerativeModel: jest.fn().mockReturnValue({ generateContent: jest.fn() }) },
}));
// Also mock the raw npm packages to prevent SDK init during transitive resolution
jest.mock('openai', () => ({
  OpenAI: jest.fn().mockImplementation(() => ({
    chat: { completions: { create: jest.fn() } },
  })),
  default: jest.fn().mockImplementation(() => ({
    chat: { completions: { create: jest.fn() } },
  })),
}));
jest.mock('@google/genai', () => ({
  GoogleGenAI: jest.fn().mockImplementation(() => ({
    getGenerativeModel: jest.fn().mockReturnValue({ generateContent: jest.fn() }),
  })),
}));

// ---------------------------------------------------------------------------
// 2.  Import after mocks are in place
// ---------------------------------------------------------------------------

import { importService } from './import.service.js';
import { parseCSV } from '../csv/parser.service.js';
import { createBatches } from '../csv/batch.service.js';
import { extractLeadsWithAI } from '../ai/ai.service.js';
import { normalizeRecord } from './normalize.service.js';
import { generateSummary } from './summary.service.js';
import { crmRecordSchema } from '../../schemas/crm.schema.js';

// ---------------------------------------------------------------------------
// 3.  Typed mock helpers
// ---------------------------------------------------------------------------

const mockParseCSV = parseCSV as jest.MockedFunction<typeof parseCSV>;
const mockCreateBatches = createBatches as jest.MockedFunction<typeof createBatches>;
const mockExtractLeadsWithAI = extractLeadsWithAI as jest.MockedFunction<typeof extractLeadsWithAI>;
const mockNormalizeRecord = normalizeRecord as jest.MockedFunction<typeof normalizeRecord>;
const mockGenerateSummary = generateSummary as jest.MockedFunction<typeof generateSummary>;

// ---------------------------------------------------------------------------
// 4.  Shared fixtures
// ---------------------------------------------------------------------------

const HEADERS = Object.freeze(['name', 'email', 'mobile']);

const makeRow = (i: number) =>
  ({ name: `Person${i}`, email: `p${i}@test.com`, mobile: `9000000${i}` }) as const;

const makeCRMRecord = (i: number) => ({
  created_at: '2024-01-01T00:00:00.000Z',
  name: `Person${i}`,
  email: `p${i}@test.com`,
  country_code: '+91',
  mobile_without_country_code: `9000000${i}`,
  company: '',
  city: '',
  state: '',
  country: '',
  lead_owner: '',
  crm_status: 'GOOD_LEAD_FOLLOW_UP' as const,
  crm_note: '',
  data_source: '' as const,
  possession_time: '',
  description: '',
});

const makeAISuccess = (records: any[], skipped: any[] = []) => ({
  data: { records, skipped },
  usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
});

const makeParseResult = (count: number) => ({
  headers: HEADERS,
  rows: Object.freeze(Array.from({ length: count }, (_, i) => makeRow(i))),
  totalRows: count,
});

const makeSummary = (total: number, imported: number, skipped: any) => {
  const skippedCount = typeof skipped === 'number' ? skipped : skipped.length;
  return {
    totalRecords: total,
    importedRecords: imported,
    skippedRecords: skippedCount,
    validationSkipped: 0,
    processingFailed: 0,
  };
};

function makeStream(text = 'dummy'): Readable {
  return Readable.from(Buffer.from(text));
}

// ---------------------------------------------------------------------------
// 5.  Reset mocks before each test
// ---------------------------------------------------------------------------

beforeEach(() => {
  jest.clearAllMocks();

  mockParseCSV.mockResolvedValue({
    headers: HEADERS,
    rows: [makeRow(1), makeRow(2)],
    totalRows: 2,
  });

  mockCreateBatches.mockReturnValue([[makeRow(1), makeRow(2)]]);

  mockExtractLeadsWithAI.mockResolvedValue({
    data: {
      records: [makeCRMRecord(1) as any, makeCRMRecord(2) as any],
      skipped: [],
    },
  });

  mockNormalizeRecord.mockImplementation((rec: any) => ({
    created_at: '2024-01-01T00:00:00.000Z',
    name: rec.name || '',
    email: rec.email || '',
    country_code: '',
    mobile_without_country_code: rec.mobile_without_country_code || '',
    company: '',
    city: '',
    state: '',
    country: '',
    lead_owner: '',
    crm_status: 'GOOD_LEAD_FOLLOW_UP',
    crm_note: '',
    data_source: '',
    possession_time: '',
    description: '',
  }));

  // Default: schema validation always passes
  jest
    .spyOn(crmRecordSchema, 'safeParse')
    .mockImplementation((data: any) => ({ success: true, data }));

  // Default: generateSummary computes values
  mockGenerateSummary.mockImplementation((total, imported, skipped) =>
    makeSummary(total, imported, skipped),
  );
});

// ---------------------------------------------------------------------------
// 6.  Test suite
// ---------------------------------------------------------------------------

describe('importService.importCSV', () => {
  // ── Successful import ──────────────────────────────────────────────────

  describe('successful import', () => {
    it('returns correct summary with all rows imported', async () => {
      const rows = Object.freeze([makeRow(0), makeRow(1)]);
      mockParseCSV.mockResolvedValue({ headers: HEADERS, rows, totalRows: 2 });
      mockCreateBatches.mockReturnValue(Object.freeze([Object.freeze([...rows])]));
      mockExtractLeadsWithAI.mockResolvedValue(makeAISuccess([makeCRMRecord(0), makeCRMRecord(1)]));

      const result = await importService.importCSV(makeStream());

      expect(result.records.length).toBe(2);
      expect(result.skipped.length).toBe(0);
      expect(mockGenerateSummary).toHaveBeenCalledWith(2, 2, []);
    });

    it('propagates token usage correctly', async () => {
      mockParseCSV.mockResolvedValue(makeParseResult(1));
      mockCreateBatches.mockReturnValue(Object.freeze([Object.freeze([makeRow(0)])]));
      mockExtractLeadsWithAI.mockResolvedValue({
        data: { records: [makeCRMRecord(0)], skipped: [] },
        usage: { prompt_tokens: 100, completion_tokens: 50, total_tokens: 150 },
      });

      const result = await importService.importCSV(makeStream(), 'req-123');
      expect(result.records.length).toBe(1);
    });
  });

  // ── Partial failures ────────────────────────────────────────────────────

  describe('partial failures (AI skips some records)', () => {
    it('moves AI-skipped records to the skipped list', async () => {
      const rows = Object.freeze([makeRow(0), makeRow(1)]);
      mockParseCSV.mockResolvedValue({ headers: HEADERS, rows, totalRows: 2 });
      mockCreateBatches.mockReturnValue(Object.freeze([Object.freeze([...rows])]));
      mockExtractLeadsWithAI.mockResolvedValue({
        data: {
          records: [makeCRMRecord(0)],
          skipped: [
            { rowNumber: 1, reason: 'Missing email', originalRow: makeRow(1), type: 'VALIDATION' },
          ],
        },
        usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
      });

      const result = await importService.importCSV(makeStream());
      expect(result.records.length).toBe(1);
      expect(result.skipped.length).toBe(1);
      expect(result.skipped[0].reason).toBe('Missing email');
    });

    it('marks all rows in a failed batch as skipped', async () => {
      const rows = Object.freeze([makeRow(0), makeRow(1), makeRow(2)]);
      const batch = Object.freeze([...rows]);
      mockParseCSV.mockResolvedValue({ headers: HEADERS, rows, totalRows: 3 });
      mockCreateBatches.mockReturnValue(Object.freeze([batch]));
      mockExtractLeadsWithAI.mockRejectedValue(new Error('AI timeout'));

      const result = await importService.importCSV(makeStream());
      expect(result.records.length).toBe(0);
      expect(result.skipped.length).toBe(3);
      expect(result.skipped[0].reason).toContain('timed out');
    });
  });

  // ── AI timeout ──────────────────────────────────────────────────────────

  describe('AI timeout', () => {
    it('retries 3 times then marks batch as skipped on timeout', async () => {
      // Speed up retries by mocking delay
      jest.useFakeTimers();

      const rows = Object.freeze([makeRow(0)]);
      mockParseCSV.mockResolvedValue({ headers: HEADERS, rows, totalRows: 1 });
      mockCreateBatches.mockReturnValue(Object.freeze([Object.freeze([...rows])]));

      const timeoutErr = Object.assign(new Error('Request timed out'), { code: 'ETIMEDOUT' });
      mockExtractLeadsWithAI.mockRejectedValue(timeoutErr);

      const importPromise = importService.importCSV(makeStream());

      // Advance timers to skip retry delays (500ms + 1000ms = 1500ms total)
      await jest.runAllTimersAsync();

      const result = await importPromise;
      // 3 retry attempts (retries=3 means 3 total calls: 1 initial + 2 retries)
      expect(mockExtractLeadsWithAI).toHaveBeenCalledTimes(3);
      expect(result.skipped.length).toBe(1);

      jest.useRealTimers();
    });
  });

  // ── AI malformed response ────────────────────────────────────────────────

  describe('AI malformed response', () => {
    it('skips a record that fails schema validation after normalization', async () => {
      const rows = Object.freeze([makeRow(0)]);
      mockParseCSV.mockResolvedValue({ headers: HEADERS, rows, totalRows: 1 });
      mockCreateBatches.mockReturnValue(Object.freeze([Object.freeze([...rows])]));
      mockExtractLeadsWithAI.mockResolvedValue(makeAISuccess([{ crm_status: 'INVALID_STATUS' }]));

      // Mock normalization to return the bad record as-is
      mockNormalizeRecord.mockImplementation((r) => r);

      // Make schema validation fail for this record
      jest
        .spyOn(crmRecordSchema, 'safeParse')
        .mockReturnValueOnce({ success: false, error: { message: 'Invalid crm_status' } as any });

      const result = await importService.importCSV(makeStream());
      expect(result.records.length).toBe(0);
      expect(result.skipped.length).toBe(1);
      expect(result.skipped[0].reason).toContain('Normalization validation failed');
    });
  });

  // ── Retry success ────────────────────────────────────────────────────────

  describe('retry success (succeeds on 2nd attempt)', () => {
    it('returns records after a single retry', async () => {
      jest.useFakeTimers();

      const rows = Object.freeze([makeRow(0)]);
      mockParseCSV.mockResolvedValue({ headers: HEADERS, rows, totalRows: 1 });
      mockCreateBatches.mockReturnValue(Object.freeze([Object.freeze([...rows])]));

      // Fail first call, succeed on second
      mockExtractLeadsWithAI
        .mockRejectedValueOnce(new Error('Temporary failure'))
        .mockResolvedValueOnce(makeAISuccess([makeCRMRecord(0)]));

      const importPromise = importService.importCSV(makeStream());
      await jest.runAllTimersAsync();
      const result = await importPromise;

      expect(mockExtractLeadsWithAI).toHaveBeenCalledTimes(2);
      expect(result.records.length).toBe(1);

      jest.useRealTimers();
    });
  });

  // ── Retry failure (all 3 exhausted) ─────────────────────────────────────

  describe('retry failure (all attempts exhausted)', () => {
    it('marks all batch rows as skipped after all retries fail', async () => {
      jest.useFakeTimers();

      const rows = Object.freeze([makeRow(0), makeRow(1)]);
      mockParseCSV.mockResolvedValue({ headers: HEADERS, rows, totalRows: 2 });
      mockCreateBatches.mockReturnValue(Object.freeze([Object.freeze([...rows])]));
      mockExtractLeadsWithAI.mockRejectedValue(new Error('Persistent AI failure'));

      const importPromise = importService.importCSV(makeStream());
      await jest.runAllTimersAsync();
      const result = await importPromise;

      expect(result.records.length).toBe(0);
      expect(result.skipped.length).toBe(2);
      result.skipped.forEach((s) => expect(s.reason).toContain('Persistent AI failure'));

      jest.useRealTimers();
    });
  });

  // ── Empty CSV (parser throws) ────────────────────────────────────────────

  describe('empty CSV input', () => {
    it('propagates the AppError thrown by parseCSV', async () => {
      const parseError = Object.assign(new Error('CSV data contains no records'), {
        statusCode: 400,
        code: 'CSV_PARSE_ERROR',
        isOperational: true,
      });
      mockParseCSV.mockRejectedValue(parseError);

      await expect(importService.importCSV(makeStream())).rejects.toMatchObject({
        message: 'CSV data contains no records',
      });
    });

    it('throws AppError when parseCSV returns 0 totalRows', async () => {
      mockParseCSV.mockResolvedValue({ headers: HEADERS, rows: Object.freeze([]), totalRows: 0 });

      await expect(importService.importCSV(makeStream())).rejects.toMatchObject({
        statusCode: 400,
        code: 'CSV_PARSE_ERROR',
      });
    });
  });

  // ── Summary generation ───────────────────────────────────────────────────

  describe('summary generation', () => {
    it('calls generateSummary with correct totals', async () => {
      const rows = Object.freeze([makeRow(0), makeRow(1), makeRow(2)]);
      mockParseCSV.mockResolvedValue({ headers: HEADERS, rows, totalRows: 3 });
      mockCreateBatches.mockReturnValue(Object.freeze([Object.freeze([...rows])]));
      mockExtractLeadsWithAI.mockResolvedValue(
        makeAISuccess(
          [makeCRMRecord(0), makeCRMRecord(1)],
          [{ rowNumber: 2, reason: 'No email', originalRow: makeRow(2), type: 'VALIDATION' }],
        ),
      );

      await importService.importCSV(makeStream());

      expect(mockGenerateSummary).toHaveBeenCalledWith(3, 2, expect.any(Array));
    });
  });

  // ── Skipped rows ─────────────────────────────────────────────────────────

  describe('skipped rows absolute numbering', () => {
    it('maps batch-relative row numbers to absolute CSV line numbers', async () => {
      const rows = Object.freeze([makeRow(0), makeRow(1), makeRow(2), makeRow(3)]);
      const batch0 = Object.freeze([rows[0], rows[1]]);
      const batch1 = Object.freeze([rows[2], rows[3]]);

      mockParseCSV.mockResolvedValue({ headers: HEADERS, rows, totalRows: 4 });
      mockCreateBatches.mockReturnValue(Object.freeze([batch0, batch1]));

      // Batch 0: skip row 0 (relative) → absolute row = 0*batchSize + 0 + 1 + 1 = 2
      mockExtractLeadsWithAI
        .mockResolvedValueOnce({
          data: {
            records: [],
            skipped: [
              { rowNumber: 0, reason: 'No name', originalRow: rows[0], type: 'VALIDATION' },
            ],
          },
          usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
        })
        .mockResolvedValueOnce(makeAISuccess([makeCRMRecord(2), makeCRMRecord(3)]));

      const result = await importService.importCSV(makeStream());
      expect(result.skipped[0].rowNumber).toBe(1); // 0*2 + 0 + 1 = 1
    });
  });

  // ── Error propagation ─────────────────────────────────────────────────────

  describe('error propagation', () => {
    it('propagates non-AI errors (e.g. createBatches throwing) to the caller', async () => {
      mockParseCSV.mockResolvedValue(makeParseResult(5));
      mockCreateBatches.mockImplementation(() => {
        throw new Error('Unexpected batching failure');
      });

      await expect(importService.importCSV(makeStream())).rejects.toThrow(
        'Unexpected batching failure',
      );
    });
  });

  // ── AI response with no usage ─────────────────────────────────────────────

  describe('AI response without usage metadata', () => {
    it('handles missing usage gracefully and still resolves', async () => {
      const rows = Object.freeze([makeRow(0)]);
      mockParseCSV.mockResolvedValue({ headers: HEADERS, rows, totalRows: 1 });
      mockCreateBatches.mockReturnValue(Object.freeze([Object.freeze([...rows])]));
      // No `usage` field in response
      mockExtractLeadsWithAI.mockResolvedValue({
        data: { records: [makeCRMRecord(0)], skipped: [] },
      });

      const result = await importService.importCSV(makeStream());
      expect(result.records.length).toBe(1);
    });
  });
});
