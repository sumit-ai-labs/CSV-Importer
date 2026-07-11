import { CRMRecord } from './crm.js';

// Represents a single record returned by the AI extraction model.
// Since the AI model parses semantic representations, fields can be optional or omitted.
export type AIExtractedRecord = Partial<Omit<CRMRecord, 'created_at' | 'country_code'>>;

export interface AIExtractionBatchResponse {
  records: AIExtractedRecord[];
}
