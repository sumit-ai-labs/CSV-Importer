import AppError from '../../errors/app-error.js';
import { ERROR_CODES } from '../../constants/error-codes.js';

/**
 * Maps raw provider-specific failures into a clean AppError.
 */
export const handleAIError = (error: any): AppError => {
  if (error instanceof AppError) {
    return error;
  }

  const message = error instanceof Error ? error.message : String(error);
  const lowerMsg = message.toLowerCase();

  // 1. Rate Limit / Quota (429)
  if (
    lowerMsg.includes('429') ||
    lowerMsg.includes('quota') ||
    lowerMsg.includes('resource_exhausted') ||
    lowerMsg.includes('rate limit')
  ) {
    return new AppError(
      'AI service is temporarily busy. Please try again shortly.',
      429,
      ERROR_CODES.AI_REQUEST_FAILED,
    );
  }

  // 2. Timeout
  if (
    lowerMsg.includes('timeout') ||
    lowerMsg.includes('timed out') ||
    lowerMsg.includes('etimedout')
  ) {
    return new AppError('AI request timed out.', 408, ERROR_CODES.AI_REQUEST_FAILED);
  }

  // 3. Network / Connection
  if (
    lowerMsg.includes('network') ||
    lowerMsg.includes('fetch failed') ||
    lowerMsg.includes('enotfound') ||
    lowerMsg.includes('econnrefused') ||
    lowerMsg.includes('socket') ||
    lowerMsg.includes('connect') ||
    lowerMsg.includes('dns')
  ) {
    return new AppError('Unable to reach the AI service.', 503, ERROR_CODES.AI_REQUEST_FAILED);
  }

  // 4. Provider Internal Error (500)
  if (
    lowerMsg.includes('500') ||
    lowerMsg.includes('internal error') ||
    lowerMsg.includes('internal server error')
  ) {
    return new AppError(
      'AI service encountered an internal error.',
      502,
      ERROR_CODES.AI_REQUEST_FAILED,
    );
  }

  // Default fallback
  return new AppError('AI service error occurred.', 502, ERROR_CODES.AI_REQUEST_FAILED);
};
