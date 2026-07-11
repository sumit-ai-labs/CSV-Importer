import { gemini } from '../../config/gemini.js';
import { env } from '../../config/env.js';
import { aiResponseSchema } from '../../schemas/ai.schema.js';
import { CSVBatch } from '../../types/csv.js';
import AppError from '../../errors/app-error.js';
import { ERROR_CODES } from '../../constants/error-codes.js';
import { SYSTEM_PROMPT, buildUserPrompt } from '../../prompts/crm-extraction.prompt.js';
import { AIExtractionResponse } from './types.js';
import { zodToJsonSchema } from 'zod-to-json-schema';

// Convert Zod schema to OpenAPI schema once
const rawSchema = zodToJsonSchema(aiResponseSchema, {
  target: 'openApi3',
  $refStrategy: 'none',
}) as any;

/**
 * Recursively removes properties from JSON schema that are not supported by the Gemini API
 * (e.g. exclusiveMinimum, exclusiveMaximum, minimum, maximum, minLength, maxLength, etc.)
 */
function sanitizeSchemaForGemini(schema: any): any {
  if (schema === null || typeof schema !== 'object') {
    return schema;
  }
  if (Array.isArray(schema)) {
    return schema.map(sanitizeSchemaForGemini);
  }
  const cleaned: any = {};
  for (const [key, value] of Object.entries(schema)) {
    // Skip unsupported properties
    if (
      [
        'exclusiveMinimum',
        'exclusiveMaximum',
        'minimum',
        'maximum',
        'minLength',
        'maxLength',
        'pattern',
        'minItems',
        'maxItems',
        'uniqueItems',
        'default',
      ].includes(key)
    ) {
      continue;
    }
    // Gemini does not allow empty string values in enums.
    // If the enum contains an empty string, delete the enum constraint entirely.
    if (key === 'enum' && Array.isArray(value) && value.includes('')) {
      continue;
    }
    cleaned[key] = sanitizeSchemaForGemini(value);
  }

  // Force all properties of objects to be required so Gemini does not omit them
  if (cleaned.type === 'object' && cleaned.properties) {
    cleaned.required = Object.keys(cleaned.properties);
  }

  return cleaned;
}

// Clean up fields Gemini doesn't need/want
const cleanSchema = sanitizeSchemaForGemini(rawSchema);
delete cleanSchema.$schema;
delete cleanSchema.definitions;

import { logger } from '../../config/logger.js';
import { handleAIError } from './error-handler.js';

export const extractLeadsWithGemini = async (
  batch: CSVBatch,
  headers: readonly string[],
): Promise<AIExtractionResponse> => {
  if (!gemini) {
    throw new AppError(
      'Gemini client is not initialized. GEMINI_API_KEY is missing.',
      500,
      ERROR_CODES.AI_REQUEST_FAILED,
    );
  }

  const modelName = env.GEMINI_MODEL || 'gemini-2.5-flash';
  const userPrompt = buildUserPrompt(headers, batch);

  const modelsToTry = Array.from(
    new Set([
      modelName,
      'gemini-3.5-flash',
      'gemini-2.5-flash',
      'gemini-2.0-flash',
      'gemini-2.5-pro',
    ]),
  );

  let lastError: any;

  for (const currentModel of modelsToTry) {
    try {
      const response = await gemini.models.generateContent({
        model: currentModel,
        contents: userPrompt,
        config: {
          systemInstruction: SYSTEM_PROMPT,
          responseMimeType: 'application/json',
          responseSchema: cleanSchema,
          temperature: 0,
          abortSignal: AbortSignal.timeout(30000),
        },
      });

      const text = response.text;
      if (!text) {
        throw new AppError(
          `No structured output received from Gemini model ${currentModel}`,
          502,
          ERROR_CODES.AI_RESPONSE_INVALID,
        );
      }

      let parsed: any;
      try {
        parsed = JSON.parse(text);
      } catch (e) {
        throw new AppError(
          `Failed to parse Gemini JSON output for model ${currentModel}`,
          502,
          ERROR_CODES.AI_RESPONSE_INVALID,
        );
      }

      // Secondary validation via Zod runtime type-checking
      const validation = aiResponseSchema.safeParse(parsed);
      if (!validation.success) {
        throw new AppError(
          `Gemini structured output for model ${currentModel} failed validation: ${validation.error.message}`,
          502,
          ERROR_CODES.AI_RESPONSE_INVALID,
        );
      }

      return {
        data: validation.data,
        usage: response.usageMetadata
          ? {
              prompt_tokens: response.usageMetadata.promptTokenCount ?? 0,
              completion_tokens: response.usageMetadata.candidatesTokenCount ?? 0,
              total_tokens: response.usageMetadata.totalTokenCount ?? 0,
            }
          : undefined,
      };
    } catch (error: any) {
      lastError = error;
      logger.warn(
        { model: currentModel, error: error.message },
        'Gemini model request failed. Trying fallback model...',
      );
    }
  }

  throw handleAIError(lastError);
};
