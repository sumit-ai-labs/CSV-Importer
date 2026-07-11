import { OpenAI } from 'openai';
import { env } from './env.js';

export const openai = env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: env.OPENAI_API_KEY, timeout: 30000 })
  : (null as any);
