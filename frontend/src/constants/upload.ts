export const MAX_UPLOAD_SIZE = 10 * 1024 * 1024; // 10 MB in bytes
export const DEFAULT_PREVIEW_ROWS = 10;
export const SUPPORTED_EXTENSIONS = Object.freeze(['csv'] as const);
export const SUPPORTED_MIME_TYPES = Object.freeze([
  'text/csv',
  'application/vnd.ms-excel',
] as const);
export const DROPZONE_MAX_FILES = 1;
export const PREVIEW_MAX_COLUMNS = 50;

export type SupportedExtension = (typeof SUPPORTED_EXTENSIONS)[number];
export type SupportedMimeType = (typeof SUPPORTED_MIME_TYPES)[number];
