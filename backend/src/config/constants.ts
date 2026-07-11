export const API_PREFIX = '/api/v1' as const;

export const ALLOWED_FILE_TYPES = [
  'text/csv',
  'application/vnd.ms-excel',
  'text/x-csv',
  'application/csv',
  'text/comma-separated-values',
] as const;

export const DEFAULT_PORT = 8000;
