import { z } from 'zod';
import { crmRecordSchema, skippedRecordSchema } from './crm.schema.js';

/**
 * Expected JSON response structure returned by OpenAI structured outputs.
 */
export const aiResponseSchema = z.object({
  records: z.array(crmRecordSchema),
  skipped: z.array(skippedRecordSchema),
});

export type AiResponseSchemaType = z.infer<typeof aiResponseSchema>;
