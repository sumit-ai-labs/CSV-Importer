import { env } from '../../config/env.js';
import { extractLeadsWithOpenAI } from './openai.service.js';
import { extractLeadsWithGemini } from './gemini.service.js';
import { CSVBatch } from '../../types/csv.js';
import { AIExtractionResponse } from './types.js';

export const extractLeadsWithAI = async (
  batch: CSVBatch,
  headers: readonly string[],
): Promise<AIExtractionResponse> => {
  if (env.AI_PROVIDER === 'gemini') {
    return extractLeadsWithGemini(batch, headers);
  }
  return extractLeadsWithOpenAI(batch, headers);
};
