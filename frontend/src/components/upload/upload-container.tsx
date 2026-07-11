'use client';

import * as React from 'react';
import { useUploadStore } from '../../store/upload.store';
import { useCsvPreview } from '../../hooks/use-csv-preview';
import { selectedFileSchema } from '../../schemas/upload.schema';
import { UploadZone } from './upload-zone';

export function UploadContainer() {
  // Zustand Store Selectors
  const {
    selectedFile,
    rawFile,
    loading,
    error,
    setSelectedFile,
    setRawFile,
    setPreview,
    setLoading,
    setError,
    setStep,
    reset,
  } = useUploadStore();

  // Custom Local parsing Hook
  const {
    headers: parsedHeaders,
    rows: parsedRows,
    totalRows: parsedTotalRows,
    loading: parsingLoading,
    error: parsingError,
  } = useCsvPreview(rawFile);

  // Handle file selection and validation
  const handleFileSelect = (file: File) => {
    setError(null);
    setLoading(true);

    try {
      // Validate with Zod
      selectedFileSchema.parse({
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: file.lastModified,
      });

      // Synchronize serialize data to state
      setSelectedFile({
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: file.lastModified,
      });
      setRawFile(file);
      setStep('FILE_SELECTED');
    } catch (err: any) {
      const errorMsg = err.errors?.[0]?.message || err.message || 'Failed to validate file';
      setError(errorMsg);
      setStep('ERROR');
      setRawFile(null);
      setSelectedFile(null);
    } finally {
      setLoading(false);
    }
  };

  // Sync Local parser state to Zustand Store
  React.useEffect(() => {
    if (parsingLoading) {
      setLoading(true);
      setError(null);
    } else if (parsingError) {
      setError(parsingError);
      setStep('ERROR');
      setLoading(false);
    } else if (parsedHeaders.length > 0 && selectedFile) {
      setPreview({
        headers: parsedHeaders,
        rows: parsedRows,
        rowCount: parsedTotalRows,
        columnCount: parsedHeaders.length,
      });
      setStep('PREVIEW_READY');
      setLoading(false);
    }
  }, [
    parsedHeaders,
    parsedRows,
    parsingLoading,
    parsingError,
    selectedFile,
    setPreview,
    setError,
    setStep,
    setLoading,
  ]);

  // Clean-up and start over
  const handleStartOver = () => {
    reset();
  };

  // Fallback to initial IDLE / upload selection interface
  return (
    <UploadZone
      onFileSelect={handleFileSelect}
      onRemove={handleStartOver}
      selectedFile={rawFile}
      error={error}
    />
  );
}
