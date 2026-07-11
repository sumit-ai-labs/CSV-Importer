export type CrmStatus = 'GOOD_LEAD_FOLLOW_UP' | 'DID_NOT_CONNECT' | 'BAD_LEAD' | 'SALE_DONE';

export type DataSource =
  'leads_on_demand' | 'meridian_tower' | 'eden_park' | 'varah_swamy' | 'sarjapur_plots' | '';

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
  readonly crm_status: CrmStatus;
  readonly crm_note: string;
  readonly data_source: DataSource;
  readonly possession_time: string;
  readonly description: string;
}

export type SkipReasonType = 'VALIDATION' | 'AI_FAILURE' | 'PARSER' | 'UNKNOWN';

export interface SkippedRecord {
  readonly rowNumber: number;
  readonly reason: string;
  readonly originalRow: Record<string, string>;
  readonly type: SkipReasonType;
}

export interface ImportSummary {
  readonly totalRecords: number;
  readonly importedRecords: number;
  readonly skippedRecords: number;
  readonly validationSkipped: number;
  readonly processingFailed: number;
}

export interface ImportResult {
  readonly summary: ImportSummary;
  readonly records: readonly CRMRecord[];
  readonly skipped: readonly SkippedRecord[];
}
