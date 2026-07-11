import { z } from 'zod';

const envSchema = z.object({
  NEXT_PUBLIC_API_URL: z.string().url('NEXT_PUBLIC_API_URL must be a valid URL'),
});

const parsed = envSchema.safeParse({
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
});

if (!parsed.success) {
  const formattedErrors = parsed.error.format();
  console.error(
    '❌ Frontend environment validation failed:',
    JSON.stringify(formattedErrors, null, 2),
  );
  throw new Error('Invalid frontend environment configuration');
}

export const env = parsed.data;
export type Env = z.infer<typeof envSchema>;
