'use client';

import * as React from 'react';
import { useUploadStore } from '../store/upload.store';
import { UploadContainer } from '../components/upload/upload-container';
import { useImport } from '../hooks/use-import';
import { ImportProgress } from '../components/import/import-progress';
import { ResultsSection } from '../components/results/results-section';
import { PreviewSection } from '../components/preview/preview-section';
import { PageContainer } from '../components/layout/page-container';
import { PageHeader } from '../components/layout/page-header';
import type { StepId } from '../components/layout/page-header';
import { cn } from '../lib/utils';

/** Map app steps → stepper step numbers */
function resolveStep(currentStep: string, importStatus: string): StepId {
  if (currentStep === 'IMPORTING' || importStatus === 'IMPORTING') return 3;
  if (currentStep === 'COMPLETED') return 4;
  if (currentStep === 'PREVIEW_READY' || currentStep === 'FILE_SELECTED') return 2;
  return 1;
}

/** Animated wrapper — fades + slides up each time key changes */
function AnimatedSection({
  animKey,
  children,
  className,
}: {
  animKey: string;
  children: React.ReactNode;
  className?: string;
}) {
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    setVisible(false);
    const t = requestAnimationFrame(() => {
      requestAnimationFrame(() => setVisible(true));
    });
    return () => cancelAnimationFrame(t);
  }, [animKey]);

  return (
    <div
      className={cn(
        'transition-all duration-500 ease-out',
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3',
        className,
      )}
    >
      {children}
    </div>
  );
}

export default function Home() {
  const {
    currentStep,
    preview,
    selectedFile,
    loading: uploadLoading,
    progress,
    reset,
    importResult,
  } = useUploadStore();

  const { startImport, status } = useImport();
  const activeStep = resolveStep(currentStep, status);

  const showUpload =
    currentStep === 'IDLE' || currentStep === 'FILE_SELECTED' || currentStep === 'ERROR';
  const showPreview = currentStep === 'PREVIEW_READY' && preview && selectedFile;
  const showProcessing = currentStep === 'IMPORTING' || status === 'IMPORTING';
  const showResults = currentStep === 'COMPLETED' && importResult != null;

  return (
    <PageContainer size="md">
      <PageHeader currentStep={activeStep} />

      <div className="w-full">
        {showUpload && (
          <AnimatedSection animKey="upload">
            <UploadContainer />
          </AnimatedSection>
        )}

        {showPreview && (
          <AnimatedSection animKey="preview">
            <PreviewSection
              preview={preview}
              file={selectedFile}
              onConfirm={startImport}
              onCancel={reset}
              loading={uploadLoading || status === 'IMPORTING'}
            />
          </AnimatedSection>
        )}

        {showProcessing && (
          <AnimatedSection animKey="processing">
            <ImportProgress
              status={progress?.status || 'Uploading and validating contacts...'}
              percentage={progress?.percentage || 0}
              completedBatches={progress?.completedBatches}
              totalBatches={progress?.totalBatches}
            />
          </AnimatedSection>
        )}

        {showResults && (
          <AnimatedSection animKey="results">
            <ResultsSection result={importResult!} onStartOver={reset} />
          </AnimatedSection>
        )}
      </div>
    </PageContainer>
  );
}
