'use client';

import * as React from 'react';
import { PreviewData, SelectedFile } from '../../types/upload';
import { SectionCard } from '@/components/ui/section-card';
import { FileSummary } from '../upload/file-summary';
import { PreviewTable } from './preview-table';
import { Button } from '@/components/ui/button';
import { ArrowRight, Loader2, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface PreviewSectionProps {
  readonly preview: PreviewData;
  readonly file: SelectedFile;
  readonly onConfirm: () => void;
  readonly onCancel?: () => void;
  readonly loading: boolean;
  readonly className?: string;
}

export function PreviewSection({
  preview,
  file,
  onConfirm,
  onCancel,
  loading,
  className,
}: PreviewSectionProps) {
  return (
    <div className={cn('w-full space-y-6', className)}>
      <SectionCard
        title="Review & Confirm Import"
        description="Verify the columns and sample data below. Click confirm to start importing this dataset."
        footer={
          <div className="flex items-center justify-between w-full flex-wrap gap-3">
            {onCancel ? (
              <Button
                variant="outline"
                onClick={onCancel}
                disabled={loading}
                className="gap-1.5"
                aria-label="Back to file upload"
              >
                <ArrowLeft className="h-4 w-4" /> Cancel
              </Button>
            ) : (
              <div />
            )}
            <Button
              onClick={onConfirm}
              disabled={loading}
              className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90 font-medium px-6"
              aria-label="Confirm import of contacts"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Importing Contacts...
                </>
              ) : (
                <>
                  Confirm Import
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        }
      >
        <div className="flex flex-col gap-6">
          {/* File Summary Metrics */}
          <FileSummary file={file} rowCount={preview.rowCount} columnCount={preview.columnCount} />

          {/* TanStack Table Preview */}
          <div className="flex flex-col gap-2">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Data Preview
              </span>
              <span className="text-xs text-muted-foreground">
                Showing first {preview.rows.length} of {preview.rowCount.toLocaleString()} total
                rows
              </span>
            </div>
            <PreviewTable headers={preview.headers} rows={preview.rows} />
            <p className="text-xs text-muted-foreground mt-1">
              Preview shows the uploaded CSV exactly as provided. AI mapping and validation will
              begin only after you confirm the import.
            </p>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}
