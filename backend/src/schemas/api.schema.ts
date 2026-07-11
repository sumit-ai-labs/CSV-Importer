import { z } from 'zod';

export const importRequestSchema = z.object({
  batchSize: z.coerce.number().min(1).max(100).optional(),
});

export type ImportRequestQuery = z.infer<typeof importRequestSchema>;
