import { useState, useCallback } from 'react';
import { useUploadStore } from '../store/upload.store';
import { uploadCsvFile } from '../services/api/import.api';
import { ImportStatus } from '../types/import';

export function useImport() {
  const { rawFile, preview, setStep, setLoading, setError, setProgress, setImportResult } =
    useUploadStore();

  const [status, setStatus] = useState<ImportStatus>('IDLE');

  const startImport = useCallback(async () => {
    if (!rawFile) {
      const errorMsg = 'No file found in the upload store. Please upload a CSV file again.';
      setError(errorMsg);
      setStatus('FAILED');
      setStep('ERROR');
      return;
    }

    // Set importing states
    setLoading(true);
    setError(null);
    setImportResult(null);
    setStep('IMPORTING');
    setStatus('IMPORTING');

    // Dynamic batches count (backend batch size = 15)
    const totalBatches = preview ? Math.ceil(preview.rowCount / 15) : 1;

    setProgress({
      totalBatches,
      completedBatches: 0,
      percentage: 0,
      status: 'Uploading and processing CSV file...',
    });

    let completed = 0;
    const intervalId = setInterval(() => {
      if (completed < totalBatches - 1) {
        completed += 1;
        const pct = Math.round((completed / totalBatches) * 90); // cap at 90% until real response
        setProgress({
          totalBatches,
          completedBatches: completed,
          percentage: pct,
          status: `AI processing batch ${completed} of ${totalBatches}...`,
        });
      }
    }, 1500);

    try {
      const response = await uploadCsvFile(rawFile);
      clearInterval(intervalId);

      if (response.success && response.data) {
        // Show 100% completion on the progress bar first
        setProgress({
          totalBatches,
          completedBatches: totalBatches,
          percentage: 100,
          status: 'Import complete!',
        });

        // Store result in Zustand BEFORE changing step — avoids race condition
        setImportResult(response.data);
        setStatus('SUCCESS');

        // Brief pause so the user sees 100% before transitioning to results
        await new Promise<void>((resolve) => setTimeout(resolve, 800));

        // setStep LAST — page.tsx will read importResult from store synchronously
        setStep('COMPLETED');
      } else {
        throw new Error(response.message || 'Import failed');
      }
    } catch (err: any) {
      clearInterval(intervalId);
      const errorMsg = err.message || 'Failed to process and import CSV dataset';
      setError(errorMsg);
      setStatus('FAILED');
      setStep('ERROR');
    } finally {
      setLoading(false);
    }
  }, [rawFile, preview, setError, setStep, setLoading, setProgress, setImportResult]);

  return {
    startImport,
    status,
  };
}
