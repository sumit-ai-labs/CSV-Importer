/**
 * import.route.test.ts
 *
 * Integration / API tests for POST /api/v1/import
 * Uses Supertest to test the full Express middleware chain.
 *
 * Mocked:
 *   - importService.importCSV   (prevents real AI/CSV processing)
 *   - logger
 *   - env
 */

import request from 'supertest';
import { jest } from '@jest/globals';

// ---------------------------------------------------------------------------
// 1. Mock dependencies before importing the app
// ---------------------------------------------------------------------------

jest.mock('../services/import/import.service.js');
jest.mock('../config/logger.js', () => ({
  __esModule: true,
  default: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));
jest.mock('../config/env.js', () => ({
  env: {
    NODE_ENV: 'test',
    DEFAULT_BATCH_SIZE: 15,
    AI_PROVIDER: 'openai',
    OPENAI_MODEL: 'gpt-4o',
    GEMINI_MODEL: 'gemini-pro',
    OPENAI_API_KEY: 'test-key',
  },
}));
// Prevent OpenAI SDK from throwing during module load (requires a real API key)
jest.mock('../config/openai.js', () => ({
  openai: { chat: { completions: { create: jest.fn() } } },
}));

// ---------------------------------------------------------------------------
// 2. Import after mocks
// ---------------------------------------------------------------------------

import app from '../app.js';
import { importService } from '../services/import/import.service.js';
import AppError from '../errors/app-error.js';

const mockImportCSV = importService.importCSV as jest.MockedFunction<
  typeof importService.importCSV
>;

// ---------------------------------------------------------------------------
// 3. Fixtures
// ---------------------------------------------------------------------------

const VALID_CSV_CONTENT = Buffer.from('name,email,mobile\nAlice,alice@test.com,9999999999\n');

const SUCCESS_RESULT = {
  summary: { totalRecords: 1, importedRecords: 1, skippedRecords: 0 },
  records: [
    {
      created_at: '2024-01-01',
      name: 'Alice',
      email: 'alice@test.com',
      country_code: '+91',
      mobile_without_country_code: '9999999999',
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
    },
  ],
  skipped: [],
};

// ---------------------------------------------------------------------------
// 4. Helpers
// ---------------------------------------------------------------------------

function uploadCSV(content: Buffer, mimeType = 'text/csv', filename = 'test.csv') {
  return request(app)
    .post('/api/v1/import')
    .attach('file', content, { filename, contentType: mimeType });
}

// ---------------------------------------------------------------------------
// 5. Tests
// ---------------------------------------------------------------------------

beforeEach(() => {
  jest.clearAllMocks();
});

describe('POST /api/v1/import', () => {
  // ── Missing file ──────────────────────────────────────────────────────

  describe('missing file', () => {
    it('returns 400 when no file is attached', async () => {
      const res = await request(app).post('/api/v1/import');

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('INVALID_FILE');
    });
  });

  // ── Invalid MIME type ─────────────────────────────────────────────────

  describe('invalid mime type', () => {
    it('returns 400 for application/json file', async () => {
      const res = await uploadCSV(Buffer.from('{"key":"value"}'), 'application/json', 'data.json');

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('INVALID_FILE');
    });

    it('returns 400 for image/png file', async () => {
      const res = await uploadCSV(Buffer.from('PNG'), 'image/png', 'img.png');

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('INVALID_FILE');
    });

    it('returns 400 for text/plain file', async () => {
      const res = await uploadCSV(Buffer.from('just plain text'), 'text/plain', 'notes.txt');

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('INVALID_FILE');
    });
  });

  // ── Oversized file ────────────────────────────────────────────────────

  describe('oversized file', () => {
    it('returns 400 when file exceeds 10 MB limit', async () => {
      // 11 MB buffer
      const oversized = Buffer.alloc(11 * 1024 * 1024, 'a');
      const res = await uploadCSV(oversized, 'text/csv', 'big.csv');

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('INVALID_FILE');
    });
  });

  // ── Valid upload ──────────────────────────────────────────────────────

  describe('valid upload', () => {
    it('returns 200 with correct response schema on success', async () => {
      mockImportCSV.mockResolvedValue(SUCCESS_RESULT as any);

      const res = await uploadCSV(VALID_CSV_CONTENT);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('CSV import completed successfully');
      expect(res.body.data).toBeDefined();
      expect(res.body.data.summary.totalRecords).toBe(1);
      expect(res.body.data.records).toHaveLength(1);
      expect(res.body.data.skipped).toHaveLength(0);
    });

    it('calls importService.importCSV once per request', async () => {
      mockImportCSV.mockResolvedValue(SUCCESS_RESULT as any);

      await uploadCSV(VALID_CSV_CONTENT);

      expect(mockImportCSV).toHaveBeenCalledTimes(1);
    });

    it('sets x-request-id header on every response', async () => {
      mockImportCSV.mockResolvedValue(SUCCESS_RESULT as any);

      const res = await uploadCSV(VALID_CSV_CONTENT);

      expect(res.headers['x-request-id']).toBeDefined();
      expect(typeof res.headers['x-request-id']).toBe('string');
    });

    it('echoes back the x-request-id from the request if provided', async () => {
      mockImportCSV.mockResolvedValue(SUCCESS_RESULT as any);
      const customId = 'my-custom-request-id-001';

      const res = await request(app)
        .post('/api/v1/import')
        .set('x-request-id', customId)
        .attach('file', VALID_CSV_CONTENT, {
          filename: 'test.csv',
          contentType: 'text/csv',
        });

      expect(res.headers['x-request-id']).toBe(customId);
    });
  });

  // ── Response schema ───────────────────────────────────────────────────

  describe('response schema', () => {
    it('error responses include success, message, data, and error fields', async () => {
      const res = await request(app).post('/api/v1/import');

      expect(res.body).toHaveProperty('success');
      expect(res.body).toHaveProperty('message');
      expect(res.body).toHaveProperty('data');
      expect(res.body).toHaveProperty('error');
      expect(res.body.error).toHaveProperty('code');
      expect(res.body.error).toHaveProperty('message');
    });

    it('success responses include success, message, and data', async () => {
      mockImportCSV.mockResolvedValue(SUCCESS_RESULT as any);
      const res = await uploadCSV(VALID_CSV_CONTENT);

      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('message');
      expect(res.body).toHaveProperty('data');
    });
  });

  // ── OpenAI failure ────────────────────────────────────────────────────

  describe('OpenAI / AI failure', () => {
    it('returns 400 when importService throws an operational AppError', async () => {
      // Must use a real AppError instance — error middleware uses instanceof check
      const aiError = new AppError(
        'AI service unavailable',
        400,
        'AI_REQUEST_FAILED',
        true, // isOperational
      );
      mockImportCSV.mockRejectedValue(aiError);

      const res = await uploadCSV(VALID_CSV_CONTENT);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('returns 500 for non-operational errors (programming bugs)', async () => {
      mockImportCSV.mockRejectedValue(new TypeError('Cannot read property'));

      const res = await uploadCSV(VALID_CSV_CONTENT);

      expect(res.status).toBe(500);
      expect(res.body.success).toBe(false);
    });
  });

  // ── Unexpected exception ──────────────────────────────────────────────

  describe('unexpected exception', () => {
    it('handles completely unknown thrown values gracefully', async () => {
      mockImportCSV.mockImplementation(() => {
        throw 'string error';
      });

      const res = await uploadCSV(VALID_CSV_CONTENT);

      expect(res.status).toBe(500);
      expect(res.body.success).toBe(false);
    });
  });

  // ── Status codes ──────────────────────────────────────────────────────

  describe('status codes', () => {
    it('returns 200 on success', async () => {
      mockImportCSV.mockResolvedValue(SUCCESS_RESULT as any);
      const res = await uploadCSV(VALID_CSV_CONTENT);
      expect(res.status).toBe(200);
    });

    it('returns 400 on client errors (bad file type)', async () => {
      const res = await uploadCSV(VALID_CSV_CONTENT, 'application/json');
      expect(res.status).toBe(400);
    });

    it('returns 404 for unknown routes', async () => {
      const res = await request(app).post('/api/v1/nonexistent');
      expect(res.status).toBe(404);
    });
  });

  // ── Headers ───────────────────────────────────────────────────────────

  describe('response headers', () => {
    it('sets Content-Type to application/json', async () => {
      const res = await request(app).post('/api/v1/import');
      expect(res.headers['content-type']).toMatch(/application\/json/);
    });

    it('sets security headers via Helmet (X-Content-Type-Options)', async () => {
      const res = await request(app).get('/api/v1/health');
      expect(res.headers['x-content-type-options']).toBe('nosniff');
    });
  });
});
