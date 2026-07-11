import { ImportSummary, SkippedRecord } from '../../types/crm.js';

/**
 * Generates the final summary statistics for the CSV import execution.
 */
export const generateSummary = (
  totalRecords: number,
  importedRecords: number,
  skipped: readonly SkippedRecord[],
): ImportSummary => {
  let validationSkipped = 0;
  let processingFailed = 0;

  for (const record of skipped) {
    if (record.type === 'AI_FAILURE' || record.type === 'PARSER') {
      processingFailed++;
    } else {
      validationSkipped++;
    }
  }

  return Object.freeze({
    totalRecords,
    importedRecords,
    skippedRecords: skipped.length,
    validationSkipped,
    processingFailed,
  });
};
