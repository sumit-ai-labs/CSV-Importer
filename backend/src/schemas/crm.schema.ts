import { z } from 'zod';

export const crmRecordSchema = z.object({
  created_at: z.string().trim().default(''),
  name: z.string().trim().default(''),
  email: z.string().trim().default(''),
  country_code: z.string().trim().default(''),
  mobile_without_country_code: z.string().trim().default(''),
  company: z.string().trim().default(''),
  city: z.string().trim().default(''),
  state: z.string().trim().default(''),
  country: z.string().trim().default(''),
  lead_owner: z.string().trim().default(''),
  crm_status: z
    .enum(['GOOD_LEAD_FOLLOW_UP', 'DID_NOT_CONNECT', 'BAD_LEAD', 'SALE_DONE'])
    .default('GOOD_LEAD_FOLLOW_UP'),
  crm_note: z.string().trim().default(''),
  data_source: z
    .enum(['leads_on_demand', 'meridian_tower', 'eden_park', 'varah_swamy', 'sarjapur_plots', ''])
    .default(''),
  possession_time: z.string().trim().default(''),
  description: z.string().trim().default(''),
});

export const skippedRecordSchema = z.object({
  rowNumber: z.number().int().positive(),
  reason: z.string().trim(),
  originalRow: z.record(z.string(), z.string()),
  type: z.enum(['VALIDATION', 'AI_FAILURE', 'PARSER', 'UNKNOWN']).default('VALIDATION'),
});

export const importSummarySchema = z.object({
  totalRecords: z.number().int().nonnegative(),
  importedRecords: z.number().int().nonnegative(),
  skippedRecords: z.number().int().nonnegative(),
  validationSkipped: z.number().int().nonnegative().default(0),
  processingFailed: z.number().int().nonnegative().default(0),
});

export const importResultSchema = z.object({
  summary: importSummarySchema,
  records: z.array(crmRecordSchema),
  skipped: z.array(skippedRecordSchema),
});

export type CRMRecordSchemaType = z.infer<typeof crmRecordSchema>;
export type SkippedRecordSchemaType = z.infer<typeof skippedRecordSchema>;
export type ImportSummarySchemaType = z.infer<typeof importSummarySchema>;
export type ImportResultSchemaType = z.infer<typeof importResultSchema>;
