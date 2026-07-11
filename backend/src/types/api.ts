/**
 * Generic API response structure.
 */
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  error?: ApiError;
}

/**
 * Standardized API error payload.
 */
export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
}

/**
 * Summary details for import operations.
 */
export interface ImportSummary {
  totalRecords: number;
  importedRecords: number;
  skippedRecords: number;
}
