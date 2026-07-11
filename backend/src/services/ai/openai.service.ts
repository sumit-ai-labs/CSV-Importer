import { openai } from '../../config/openai.js';
import { env } from '../../config/env.js';
import { aiResponseSchema } from '../../schemas/ai.schema.js';
import { CSVBatch } from '../../types/csv.js';
import AppError from '../../errors/app-error.js';
import { ERROR_CODES } from '../../constants/error-codes.js';
import { SYSTEM_PROMPT, buildUserPrompt } from '../../prompts/crm-extraction.prompt.js';
import { zodResponseFormat } from 'openai/helpers/zod';
import { AIExtractionResponse } from './types.js';

import { handleAIError } from './error-handler.js';

/**
 * Extracts structured CRM lead data from a CSV batch using OpenAI's structured outputs.
 * Captures token usage metadata.
 */
export const extractLeadsWithOpenAI = async (
  batch: CSVBatch,
  headers: readonly string[],
): Promise<AIExtractionResponse> => {
  const modelName = env.OPENAI_MODEL || 'gpt-4o-mini';

  try {
    const userPrompt = buildUserPrompt(headers, batch);

    const completion = await openai.beta.chat.completions.parse(
      {
        model: modelName,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userPrompt },
        ],
        response_format: zodResponseFormat(aiResponseSchema, 'crm_extraction'),
      },
      {
        timeout: 30000,
      },
    );

    const parsed = completion.choices[0]?.message.parsed;

    if (!parsed) {
      throw new AppError(
        'No structured output received from OpenAI',
        502,
        ERROR_CODES.AI_RESPONSE_INVALID,
      );
    }

    // Secondary validation via Zod runtime type-checking
    const validation = aiResponseSchema.safeParse(parsed);
    if (!validation.success) {
      throw new AppError(
        `AI structured output failed validation: ${validation.error.message}`,
        502,
        ERROR_CODES.AI_RESPONSE_INVALID,
      );
    }

    return {
      data: validation.data,
      usage: completion.usage
        ? {
            prompt_tokens: completion.usage.prompt_tokens,
            completion_tokens: completion.usage.completion_tokens,
            total_tokens: completion.usage.total_tokens,
          }
        : undefined,
    };
  } catch (error) {
    throw handleAIError(error);
  }
};
