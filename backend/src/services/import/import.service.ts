import { parseCSV } from '../csv/parser.service.js';
import { createBatches } from '../csv/batch.service.js';
import { extractLeadsWithAI } from '../ai/ai.service.js';
import { env } from '../../config/env.js';
import { CRMRecord, SkippedRecord, ImportResult } from '../../types/crm.js';
import AppError from '../../errors/app-error.js';
import { ERROR_CODES } from '../../constants/error-codes.js';
import logger from '../../config/logger.js';
import { Readable } from 'stream';
import { normalizeRecord } from './normalize.service.js';
import { generateSummary } from './summary.service.js';
import { PROMPT_VERSION } from '../../prompts/crm-extraction.prompt.js';
import { crmRecordSchema } from '../../schemas/crm.schema.js';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Retries an asynchronous operation with exponential backoff.
 */
const retryWithBackoff = async <T>(
  fn: () => Promise<T>,
  retries = 3,
  delayMs = 500,
  backoffFactor = 2,
): Promise<T> => {
  let currentDelay = delayMs;
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === retries) {
        throw error;
      }
      logger.warn(
        {
          attempt,
          nextDelayMs: currentDelay,
          error: error instanceof Error ? error.message : String(error),
        },
        'AI request attempt failed. Retrying with exponential backoff...',
      );
      await delay(currentDelay);
      currentDelay *= backoffFactor;
    }
  }
  throw new Error('Retry failed'); // Unreachable
};

/**
 * Orchestrator service to import and process CSV stream data using AI lead extraction.
 */
export const importService = {
  importCSV: async (stream: Readable, requestId?: string): Promise<ImportResult> => {
    // 1. Parse CSV stream
    const parseResult = await parseCSV(stream);
    const { headers, rows, totalRows } = parseResult;

    if (totalRows === 0) {
      throw new AppError('No data rows found in the CSV file', 400, ERROR_CODES.CSV_PARSE_ERROR);
    }

    // 2. Split rows into batches for OpenAI
    const batchSize = env.DEFAULT_BATCH_SIZE || 15;
    const batches = createBatches(rows, batchSize);

    const allRecords: CRMRecord[] = [];
    const allSkipped: SkippedRecord[] = [];
    const seenEmails = new Set<string>();
    const seenMobiles = new Set<string>();

    // Concurrency limit config
    const concurrencyLimit = 3;
    let activeCount = 0;
    let nextIndex = 0;

    // Pipeline metrics tracking
    let totalPromptTokens = 0;
    let totalCompletionTokens = 0;
    let totalTokens = 0;
    let failedBatchesCount = 0;
    let successfulBatchesCount = 0;
    let totalDurationMs = 0;

    // 3. Process batches concurrently with limited concurrency pool
    await new Promise<void>((resolve) => {
      const runNext = async () => {
        if (nextIndex >= batches.length) {
          if (activeCount === 0) resolve();
          return;
        }

        const currentIdx = nextIndex++;
        activeCount++;

        const batch = batches[currentIdx];
        const startIdx = currentIdx * batchSize;
        const startTime = Date.now();

        try {
          // Invoke AI extraction service wrapped in backoff retry logic
          const aiResponse = await retryWithBackoff(
            async () => {
              return await extractLeadsWithAI(batch, headers);
            },
            3,
            500,
            2,
          );

          const duration = Date.now() - startTime;
          totalDurationMs += duration;
          successfulBatchesCount++;

          // Aggregate API token usage
          if (aiResponse.usage) {
            totalPromptTokens += aiResponse.usage.prompt_tokens;
            totalCompletionTokens += aiResponse.usage.completion_tokens;
            totalTokens += aiResponse.usage.total_tokens;
          }

          logger.info(
            {
              requestId,
              batchIndex: currentIdx + 1,
              batchSize: batch.length,
              duration,
              model: env.AI_PROVIDER === 'gemini' ? env.GEMINI_MODEL : env.OPENAI_MODEL,
              promptVersion: PROMPT_VERSION,
              tokensUsed: aiResponse.usage?.total_tokens || 0,
              success: true,
            },
            'Batch AI extraction succeeded',
          );

          // Process successfully returned records
          let recordIdx = 0;
          for (const record of aiResponse.data.records) {
            // Apply normalization
            const normalized = normalizeRecord(record);

            // Re-validate the normalized outputs to ensure business constraints hold
            const validation = crmRecordSchema.safeParse(normalized);
            if (validation.success) {
              const recordData = validation.data;
              const email = recordData.email.trim().toLowerCase();
              const mobile = recordData.mobile_without_country_code.trim();

              let isDuplicate = false;
              let duplicateReason = '';

              if (email && seenEmails.has(email)) {
                isDuplicate = true;
                duplicateReason = `Duplicate email: ${email} already exists in uploaded CSV.`;
              } else if (mobile && seenMobiles.has(mobile)) {
                isDuplicate = true;
                duplicateReason = `Duplicate mobile: ${mobile} already processed.`;
              }

              if (isDuplicate) {
                allSkipped.push({
                  rowNumber: startIdx + recordIdx + 2,
                  reason: duplicateReason,
                  originalRow: batch[recordIdx] || batch[0] || {},
                  type: 'VALIDATION',
                });
              } else {
                if (email) seenEmails.add(email);
                if (mobile) seenMobiles.add(mobile);
                allRecords.push(recordData);
              }
            } else {
              allSkipped.push({
                rowNumber: startIdx + recordIdx + 2, // Map to absolute CSV line number (1-indexed, starts at row 2)
                reason: `Normalization validation failed: ${validation.error.message}`,
                originalRow: batch[recordIdx] || batch[0] || {},
                type: 'VALIDATION',
              });
            }
            recordIdx++;
          }

          // Process skipped records from AI response (mapping batch relative index to absolute)
          for (const skip of aiResponse.data.skipped) {
            const absoluteRowNumber = startIdx + skip.rowNumber + 1;
            allSkipped.push({
              rowNumber: absoluteRowNumber,
              reason: skip.reason,
              originalRow: skip.originalRow,
              type: 'VALIDATION',
            });
          }
        } catch (error) {
          failedBatchesCount++;
          const duration = Date.now() - startTime;
          totalDurationMs += duration;

          logger.error(
            {
              requestId,
              batchIndex: currentIdx + 1,
              batchSize: batch.length,
              duration,
              model: env.AI_PROVIDER === 'gemini' ? env.GEMINI_MODEL : env.OPENAI_MODEL,
              promptVersion: PROMPT_VERSION,
              error: error instanceof Error ? error.message : String(error),
              success: false,
            },
            'Batch AI extraction failed entirely. Isolating error.',
          );

          let errorMessage = 'Temporary AI service unavailable.';
          if (error instanceof Error) {
            const msg = error.message;
            if (
              msg.includes('429') ||
              msg.includes('quota') ||
              msg.includes('RESOURCE_EXHAUSTED')
            ) {
              errorMessage =
                'AI service rate limit reached. This batch could not be processed after 3 retry attempts. Please try again in a few minutes.';
            } else if (msg.includes('timeout')) {
              errorMessage = 'AI request timed out. Please try again.';
            } else {
              errorMessage = `AI service error: ${msg}`;
            }
          }

          // Isolate error by marking all rows inside the failed batch as skipped
          for (let rowIdx = 0; rowIdx < batch.length; rowIdx++) {
            const absoluteRowNumber = startIdx + rowIdx + 2;
            allSkipped.push({
              rowNumber: absoluteRowNumber,
              reason: errorMessage,
              originalRow: batch[rowIdx],
              type: 'AI_FAILURE',
            });
          }
        }

        activeCount--;
        runNext();
      };

      // Boot up first batch of concurrent tasks
      for (let i = 0; i < Math.min(concurrencyLimit, batches.length); i++) {
        runNext();
      }
    });

    const totalProcessedBatches = successfulBatchesCount + failedBatchesCount;
    const avgBatchTime = totalProcessedBatches > 0 ? totalDurationMs / totalProcessedBatches : 0;

    // Log final pipeline metrics
    logger.info(
      {
        requestId,
        totalBatches: batches.length,
        successfulBatches: successfulBatchesCount,
        failedBatches: failedBatchesCount,
        avgBatchDurationMs: Math.round(avgBatchTime),
        tokens: {
          prompt: totalPromptTokens,
          completion: totalCompletionTokens,
          total: totalTokens,
        },
        promptVersion: PROMPT_VERSION,
      },
      'CSV Import processing pipeline complete',
    );

    // 4. Generate summary stats
    const summary = generateSummary(totalRows, allRecords.length, allSkipped);

    return {
      summary,
      records: Object.freeze(allRecords),
      skipped: Object.freeze(allSkipped),
    };
  },
};
