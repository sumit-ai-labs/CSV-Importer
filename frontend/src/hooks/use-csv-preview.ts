import { useState, useEffect } from 'react';
import Papa from 'papaparse';
import { DEFAULT_PREVIEW_ROWS } from '../constants/upload';
import { PreviewHeaders, PreviewRow } from '../types/upload';

export interface UseCsvPreviewResult {
  readonly headers: PreviewHeaders;
  readonly rows: readonly PreviewRow[];
  readonly totalRows: number;
  readonly loading: boolean;
  readonly error: string | null;
}

export function useCsvPreview(file: File | null): UseCsvPreviewResult {
  const [headers, setHeaders] = useState<PreviewHeaders>([]);
  const [rows, setRows] = useState<readonly PreviewRow[]>([]);
  const [totalRows, setTotalRows] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!file) {
      setHeaders([]);
      setRows([]);
      setTotalRows(0);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    // Parse the file locally using PapaParse
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: 'greedy',
      complete: (results) => {
        try {
          const parsedHeaders = results.meta.fields || [];

          // Construct rows conforming to PreviewRow domain type
          const parsedRows: PreviewRow[] = results.data
            .slice(0, DEFAULT_PREVIEW_ROWS)
            .map((row) => {
              const cleanRow: Record<string, string | number> = {};
              for (const header of parsedHeaders) {
                const val = row[header] ?? '';
                const trimmedVal = val.trim();
                const numVal = Number(trimmedVal);
                // Only convert to number if it matches a strict numeric format
                // (no leading '+' or leading zeros for integers, except exactly 0)
                const isNumeric = /^-?(?:0|[1-9]\d*)(?:\.\d+)?$/.test(trimmedVal);
                cleanRow[header] = trimmedVal === '' || !isNumeric || isNaN(numVal) ? val : numVal;
              }
              return cleanRow;
            });

          setHeaders(parsedHeaders);
          setRows(parsedRows);
          setTotalRows(results.data.length);
          setLoading(false);
        } catch (err: any) {
          setError(err.message || 'Failed to parse CSV file structure');
          setLoading(false);
        }
      },
      error: (err) => {
        setError(err.message || 'Error occurred while parsing the CSV file');
        setLoading(false);
      },
    });
  }, [file]);

  return { headers, rows, totalRows, loading, error };
}
