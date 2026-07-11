export type ImportStatus = 'IDLE' | 'UPLOADING' | 'IMPORTING' | 'SUCCESS' | 'FAILED';

export interface ImportSummary {
  readonly total: number;
  readonly imported: number;
  readonly skipped: number;
  readonly validationSkipped?: number;
  readonly processingFailed?: number;
}

export interface CRMRecord {
  readonly created_at: string;
  readonly name: string;
  readonly email: string;
  readonly country_code: string;
  readonly mobile_without_country_code: string;
  readonly company: string;
  readonly city: string;
  readonly state: string;
  readonly country: string;
  readonly lead_owner: string;
  readonly crm_status: string;
  readonly crm_note: string;
  readonly data_source: string;
  readonly possession_time: string;
  readonly description: string;
}

export type SkipReasonType = 'VALIDATION' | 'AI_FAILURE' | 'PARSER' | 'UNKNOWN';

export interface SkippedImport {
  readonly rowNumber: number;
  readonly reason: string;
  readonly originalRow: Readonly<Record<string, string>>;
  readonly type?: SkipReasonType;
}

export interface ImportResult {
  readonly summary: ImportSummary;
  readonly records: readonly CRMRecord[];
  readonly skipped: readonly SkippedImport[];
}

export interface ImportError {
  readonly message: string;
  readonly code?: string;
  readonly details?: unknown;
}

export interface ImportResponse {
  readonly success: boolean;
  readonly message: string;
  readonly data: ImportResult | null;
  readonly error?: ImportError;
}
