import axios, { AxiosError } from 'axios';
import { apiInstance } from './api-client';
import { ImportResponse, ImportResult, CRMRecord, SkippedImport } from '../../types/import';

// Define the custom typed API error class
export class ImportApiError extends Error {
  readonly code?: string;
  readonly details?: unknown;

  constructor(message: string, code?: string, details?: unknown) {
    super(message);
    this.name = 'ImportApiError';
    this.code = code;
    this.details = details;
  }
}

// Backend structural types for mapping
interface BackendImportSummary {
  readonly totalRecords: number;
  readonly importedRecords: number;
  readonly skippedRecords: number;
  readonly validationSkipped: number;
  readonly processingFailed: number;
}

interface BackendSkippedRecord {
  readonly rowNumber: number;
  readonly reason: string;
  readonly originalRow: Record<string, string>;
  readonly type?: string;
}

interface BackendImportResult {
  readonly summary: BackendImportSummary;
  readonly records: readonly CRMRecord[];
  readonly skipped: readonly BackendSkippedRecord[];
}

interface BackendApiResponse<T> {
  readonly success: boolean;
  readonly message: string;
  readonly data: T;
  readonly error?: {
    readonly code: string;
    readonly message: string;
    readonly details?: unknown;
  };
}

/**
 * Uploads raw CSV file to backend import API endpoint using Axios client instance.
 *
 * @param file Raw CSV file selected by client
 */
export const uploadCsvFile = async (file: File): Promise<ImportResponse> => {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiInstance.post<BackendApiResponse<BackendImportResult>>(
      '/import',
      formData,
    );
    const backendData = response.data;

    if (!backendData.success) {
      throw new ImportApiError(
        backendData.error?.message || backendData.message || 'Import failed',
        backendData.error?.code,
        backendData.error?.details,
      );
    }

    // Map backend schema keys to frontend domain keys
    const mappedResult: ImportResult = {
      summary: {
        total: backendData.data.summary.totalRecords,
        imported: backendData.data.summary.importedRecords,
        skipped: backendData.data.summary.skippedRecords,
        validationSkipped: backendData.data.summary.validationSkipped,
        processingFailed: backendData.data.summary.processingFailed,
      },
      records: backendData.data.records,
      skipped: backendData.data.skipped.map((s): SkippedImport => ({
        rowNumber: s.rowNumber,
        reason: s.reason,
        originalRow: s.originalRow,
        type: (s.type as SkippedImport['type']) ?? 'UNKNOWN',
      })),
    };

    return {
      success: true,
      message: backendData.message,
      data: mappedResult,
    };
  } catch (error) {
    if (error instanceof ImportApiError) {
      throw error;
    }
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<BackendApiResponse<unknown>>;
      const errorData = axiosError.response?.data?.error;
      throw new ImportApiError(
        errorData?.message || axiosError.message,
        errorData?.code || axiosError.code,
        errorData?.details || axiosError.response?.data,
      );
    }
    throw new ImportApiError(
      error instanceof Error ? error.message : 'An unexpected error occurred',
    );
  }
};
