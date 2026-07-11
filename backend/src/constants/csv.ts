/**
 * Maximum allowed upload file size in bytes (10 MB).
 */
export const MAX_UPLOAD_SIZE = 10 * 1024 * 1024;

/**
 * List of supported MIME types for uploading files.
 */
export const SUPPORTED_MIME_TYPES = Object.freeze(['text/csv'] as const);

/**
 * List of supported file extensions.
 */
export const SUPPORTED_EXTENSIONS = Object.freeze(['.csv'] as const);

/**
 * Default number of rows to parse in a single batch for processing.
 */
export const DEFAULT_BATCH_SIZE = 15;

/**
 * Maximum allowed batch size for API request stability.
 */
export const MAX_BATCH_SIZE = 100;

/**
 * Default number of rows to retrieve for previewing CSV content.
 */
export const DEFAULT_PREVIEW_ROWS = 10;
