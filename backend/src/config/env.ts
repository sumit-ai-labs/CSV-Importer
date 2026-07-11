import { envSchema } from '../schemas/env.schema.js';

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const formattedErrors = parsed.error.format();
  console.error(
    '❌ Backend environment validation failed:',
    JSON.stringify(formattedErrors, null, 2),
  );
  throw new Error('Invalid backend environment configuration');
}

export const env = parsed.data;
export type Env = typeof env;
