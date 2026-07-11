/**
 * error.test.ts
 *
 * Unit tests for backend/src/middleware/error.ts (errorHandler middleware).
 * Tests AppError handling, unknown Error handling, status codes, stack hiding
 * in production, stack visibility in development, and response schema.
 */

import { Request, Response, NextFunction } from 'express';
import { jest } from '@jest/globals';

// ---------------------------------------------------------------------------
// 1. Mocks
// ---------------------------------------------------------------------------

const mockLoggerError = jest.fn();
jest.mock('../config/logger.js', () => ({
  __esModule: true,
  logger: { error: mockLoggerError, info: jest.fn(), warn: jest.fn() },
  default: { error: mockLoggerError, info: jest.fn(), warn: jest.fn() },
}));

// ---------------------------------------------------------------------------
// 2. Import after mocks
// ---------------------------------------------------------------------------

import { errorHandler } from './error.js';
import AppError from '../errors/app-error.js';
import { ERROR_CODES } from '../constants/error-codes.js';

// ---------------------------------------------------------------------------
// 3. Helpers — typed so TS is satisfied
// ---------------------------------------------------------------------------

/** Builds a minimal mock Express Request. */
function mockReq(overrides: Partial<Request> = {}): Request {
  return {
    requestId: 'test-request-id',
    ...overrides,
  } as unknown as Request;
}

/** Builds a mock Express Response that captures status/json calls. */
function mockRes() {
  const json = jest.fn<(body: Record<string, unknown>) => void>();
  const status = jest.fn().mockReturnValue({ json } as any);
  return { res: { status, json } as unknown as Response, status, json };
}

const mockNext: NextFunction = jest.fn();

// ---------------------------------------------------------------------------
// 4. Test suite
// ---------------------------------------------------------------------------

describe('errorHandler middleware', () => {
  const originalNodeEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
    jest.clearAllMocks();
  });

  // ── AppError handling ─────────────────────────────────────────────────

  describe('AppError', () => {
    it('uses AppError statusCode in the response', () => {
      const { res, status } = mockRes();
      const err = new AppError('File not found', 404, ERROR_CODES.NOT_FOUND);

      errorHandler(err, mockReq(), res, mockNext);

      expect(status).toHaveBeenCalledWith(404);
    });

    it('uses AppError message as the response message in non-production', () => {
      process.env.NODE_ENV = 'development';
      const { res, json } = mockRes();
      const err = new AppError('Bad file format', 400, ERROR_CODES.INVALID_FILE);

      errorHandler(err, mockReq(), res, mockNext);

      const body = json.mock.calls[0][0] as Record<string, any>;
      expect(body['message']).toBe('Bad file format');
      expect(body['success']).toBe(false);
    });

    it('uses AppError code in the error object', () => {
      process.env.NODE_ENV = 'development';
      const { res, json } = mockRes();
      const err = new AppError('CSV error', 400, ERROR_CODES.CSV_PARSE_ERROR);

      errorHandler(err, mockReq(), res, mockNext);

      const body = json.mock.calls[0][0] as Record<string, any>;
      expect(body['error']['code']).toBe(ERROR_CODES.CSV_PARSE_ERROR);
    });

    it('exposes stack trace in development mode', () => {
      process.env.NODE_ENV = 'development';
      const { res, json } = mockRes();
      const err = new AppError('Operational error', 400, ERROR_CODES.VALIDATION_ERROR);

      errorHandler(err, mockReq(), res, mockNext);

      const body = json.mock.calls[0][0] as Record<string, any>;
      expect(body['error']['details']).toBeDefined();
      expect(body['error']['details']['stack']).toBeDefined();
    });
  });

  // ── Unknown Error (non-AppError) ──────────────────────────────────────

  describe('unknown Error (non-AppError)', () => {
    it('returns 500 for a generic Error', () => {
      const { res, status } = mockRes();
      const err = new Error('Something broke internally');

      errorHandler(err, mockReq(), res, mockNext);

      expect(status).toHaveBeenCalledWith(500);
    });

    it('uses INTERNAL_SERVER_ERROR code for generic errors', () => {
      process.env.NODE_ENV = 'development';
      const { res, json } = mockRes();
      const err = new Error('Random error');

      errorHandler(err, mockReq(), res, mockNext);

      const body = json.mock.calls[0][0] as Record<string, any>;
      expect(body['error']['code']).toBe(ERROR_CODES.INTERNAL_SERVER_ERROR);
    });

    it('returns 500 for a TypeError', () => {
      const { res, status } = mockRes();
      errorHandler(new TypeError('type bug'), mockReq(), res, mockNext);
      expect(status).toHaveBeenCalledWith(500);
    });

    it('returns 500 for a RangeError', () => {
      const { res, status } = mockRes();
      errorHandler(new RangeError('out of range'), mockReq(), res, mockNext);
      expect(status).toHaveBeenCalledWith(500);
    });
  });

  // ── 500 Internal Server Error ─────────────────────────────────────────

  describe('500 responses', () => {
    it('sets success: false in 500 response body', () => {
      const { res, json } = mockRes();
      errorHandler(new Error('kaboom'), mockReq(), res, mockNext);
      const body = json.mock.calls[0][0] as Record<string, any>;
      expect(body['success']).toBe(false);
    });

    it('sets data: null in the 500 response body', () => {
      const { res, json } = mockRes();
      errorHandler(new Error('kaboom'), mockReq(), res, mockNext);
      const body = json.mock.calls[0][0] as Record<string, any>;
      expect(body['data']).toBeNull();
    });
  });

  // ── 404 not-found ─────────────────────────────────────────────────────

  describe('404 responses via AppError', () => {
    it('returns 404 status for NOT_FOUND AppError', () => {
      const { res, status } = mockRes();
      const err = new AppError('Route not found', 404, ERROR_CODES.NOT_FOUND);

      errorHandler(err, mockReq(), res, mockNext);

      expect(status).toHaveBeenCalledWith(404);
    });
  });

  // ── Validation errors ─────────────────────────────────────────────────

  describe('validation errors', () => {
    it('returns 400 for VALIDATION_ERROR AppErrors', () => {
      const { res, status } = mockRes();
      const err = new AppError('Validation failed', 400, ERROR_CODES.VALIDATION_ERROR);

      errorHandler(err, mockReq(), res, mockNext);

      expect(status).toHaveBeenCalledWith(400);
    });
  });

  // ── Stack hiding in production ────────────────────────────────────────

  describe('production mode — stack hiding', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'production';
    });

    it('hides stack trace details for non-operational errors', () => {
      const { res, json } = mockRes();
      const err = new Error('Programming bug — should be hidden');

      errorHandler(err, mockReq(), res, mockNext);

      const body = json.mock.calls[0][0] as Record<string, any>;
      expect(body['message']).toBe('An unexpected error occurred.');
      expect(body['error']['message']).toBe('An unexpected error occurred.');
      expect(body['error']['details']).toBeUndefined();
    });

    it('shows operational AppError message in production', () => {
      const { res, json } = mockRes();
      const err = new AppError(
        'CSV file too large',
        400,
        ERROR_CODES.INVALID_FILE,
        true, // isOperational
      );

      errorHandler(err, mockReq(), res, mockNext);

      const body = json.mock.calls[0][0] as Record<string, any>;
      expect(body['message']).toBe('CSV file too large');
    });

    it('hides non-operational AppError message in production', () => {
      const { res, json } = mockRes();
      const err = new AppError(
        'SQL Injection attempt logged',
        500,
        ERROR_CODES.INTERNAL_SERVER_ERROR,
        false, // non-operational
      );

      errorHandler(err, mockReq(), res, mockNext);

      const body = json.mock.calls[0][0] as Record<string, any>;
      expect(body['message']).toBe('An unexpected error occurred.');
    });
  });

  // ── Development mode ──────────────────────────────────────────────────

  describe('development mode', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'development';
    });

    it('shows real message for AppError in dev (operational)', () => {
      const { res, json } = mockRes();
      errorHandler(
        new AppError('Dev AppError details', 400, ERROR_CODES.INVALID_FILE, true),
        mockReq(),
        res,
        mockNext,
      );

      // For operational AppErrors, message comes from the AppError itself
      const body = json.mock.calls[0][0] as Record<string, any>;
      expect(body['message']).toBe('Dev AppError details');
    });

    it('includes stack details in the response for any error', () => {
      const { res, json } = mockRes();
      errorHandler(new Error('Stack visible'), mockReq(), res, mockNext);

      const body = json.mock.calls[0][0] as Record<string, any>;
      // In dev mode, the error details object with stack should be present
      expect(body['error']['details']).toHaveProperty('stack');
    });

    it('non-operational errors still use generic message in dev', () => {
      const { res, json } = mockRes();
      // For plain Errors, the middleware uses the generic message variable
      errorHandler(new Error('Internal bug details'), mockReq(), res, mockNext);

      const body = json.mock.calls[0][0] as Record<string, any>;
      // Generic errors display the default message (the real message is in details.stack)
      expect(body['message']).toBe('An unexpected error occurred.');
    });
  });

  // ── Logger is called ─────────────────────────────────────────────────

  describe('logger invocation', () => {
    it('calls logger.error once per handled error', () => {
      const { res } = mockRes();
      errorHandler(new Error('test'), mockReq(), res, mockNext);
      expect(mockLoggerError).toHaveBeenCalledTimes(1);
    });

    it('includes requestId in log context', () => {
      const { res } = mockRes();
      errorHandler(new Error('test'), mockReq({ requestId: 'req-xyz' } as any), res, mockNext);
      const logArg = mockLoggerError.mock.calls[0][0] as Record<string, any>;
      expect(logArg['requestId']).toBe('req-xyz');
    });
  });
});
