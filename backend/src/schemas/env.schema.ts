import { z } from 'zod';

export const envSchema = z
  .object({
    PORT: z.coerce.number().default(8000),
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    OPENAI_API_KEY: z.string().optional(),
    GEMINI_API_KEY: z.string().optional(),
    AI_PROVIDER: z.enum(['openai', 'gemini']).default('openai'),
    OPENAI_MODEL: z.string().default('gpt-4o-mini'),
    GEMINI_MODEL: z.string().default('gemini-2.5-flash'),
    MAX_FILE_SIZE_MB: z.coerce.number().default(10),
    DEFAULT_BATCH_SIZE: z.coerce.number().default(15),
    FRONTEND_URL: z
      .string()
      .url('FRONTEND_URL must be a valid URL')
      .default('http://localhost:3000'),
  })
  .superRefine((data, ctx) => {
    if (data.AI_PROVIDER === 'openai' && !data.OPENAI_API_KEY) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "OPENAI_API_KEY is required when AI_PROVIDER is 'openai'",
        path: ['OPENAI_API_KEY'],
      });
    }
    if (data.AI_PROVIDER === 'gemini' && !data.GEMINI_API_KEY) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "GEMINI_API_KEY is required when AI_PROVIDER is 'gemini'",
        path: ['GEMINI_API_KEY'],
      });
    }
  });

export type EnvConfig = z.infer<typeof envSchema>;
