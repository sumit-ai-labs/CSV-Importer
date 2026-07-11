/**
 * Application-wide error codes frozen at runtime and typed with literal types.
 */
export const ERROR_CODES = Object.freeze({
  INVALID_FILE: 'INVALID_FILE',
  CSV_PARSE_ERROR: 'CSV_PARSE_ERROR',
  AI_REQUEST_FAILED: 'AI_REQUEST_FAILED',
  AI_RESPONSE_INVALID: 'AI_RESPONSE_INVALID',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  RATE_LIMITED: 'RATE_LIMITED',
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
  NOT_FOUND: 'NOT_FOUND',
} as const);

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];
