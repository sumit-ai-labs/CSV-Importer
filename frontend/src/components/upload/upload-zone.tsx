'use client';

import * as React from 'react';
import { useDropzone } from 'react-dropzone';
import {
  UploadCloud,
  FileSpreadsheet,
  X,
  AlertCircle,
  Facebook,
  BarChart2,
  Table2,
  Database,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export interface UploadZoneProps {
  readonly onFileSelect: (file: File) => void;
  readonly onRemove?: () => void;
  readonly selectedFile: File | null;
  readonly error: string | null;
  readonly className?: string;
}

const SUPPORTED_SOURCES = [
  { icon: Facebook, label: 'Facebook Leads' },
  { icon: BarChart2, label: 'Google Ads' },
  { icon: Table2, label: 'Excel / Sheets' },
  { icon: Database, label: 'CRM Export' },
] as const;

const AI_FEATURES = [
  'Intelligent column mapping',
  'Duplicate email detection',
  'Phone number normalization',
  'CRM field auto-extraction',
] as const;

const formatBytes = (bytes: number, decimals = 1) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return (bytes / Math.pow(k, i)).toFixed(dm) + ' ' + sizes[i];
};

export function UploadZone({
  onFileSelect,
  onRemove,
  selectedFile,
  error,
  className,
}: UploadZoneProps) {
  const acceptConfig = React.useMemo(
    () => ({
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.csv'],
    }),
    [],
  );

  const { getRootProps, getInputProps, open, isDragActive, isFocused } = useDropzone({
    onDropAccepted: (files) => {
      if (files[0]) onFileSelect(files[0]);
    },
    maxFiles: 1,
    multiple: false,
    accept: acceptConfig,
    noClick: !!selectedFile,
    noKeyboard: !!selectedFile,
  });

  const isError = !!error && !selectedFile;

  /* ── Drag-active state ── */
  if (isDragActive) {
    return (
      <div
        {...getRootProps()}
        className={cn(
          'relative flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-primary bg-primary/5 px-8 py-12 text-center transition-all duration-200 cursor-copy',
          className,
        )}
      >
        <input {...getInputProps()} />
        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/15">
          <UploadCloud className="h-7 w-7 text-primary animate-bounce" aria-hidden="true" />
        </div>
        <p className="text-base font-semibold text-primary">Drop it here!</p>
        <p className="text-xs text-muted-foreground">Release to start processing</p>
      </div>
    );
  }

  /* ── File selected state ── */
  if (selectedFile) {
    return (
      <div
        {...getRootProps()}
        className={cn(
          'relative flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-primary/30 bg-primary/4 px-8 py-10 text-center transition-all duration-200',
          className,
        )}
      >
        <input {...getInputProps()} />
        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-950">
          <FileSpreadsheet className="h-7 w-7 text-emerald-500" aria-hidden="true" />
        </div>
        <div>
          <p className="font-semibold text-foreground text-sm">{selectedFile.name}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {formatBytes(selectedFile.size)} · CSV
          </p>
        </div>
        <div className="flex items-center gap-2 mt-1">
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              open();
            }}
            aria-label="Replace current file"
          >
            Change File
          </Button>
          {onRemove && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onRemove();
              }}
              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
              aria-label="Remove current file"
            >
              <X className="w-4 h-4 mr-1" /> Remove
            </Button>
          )}
        </div>
      </div>
    );
  }

  /* ── Error state ── */
  if (isError) {
    return (
      <div
        {...getRootProps()}
        className={cn(
          'relative flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-destructive/30 bg-destructive/4 px-8 py-12 text-center transition-all duration-200 cursor-pointer',
          isFocused && 'ring-2 ring-ring ring-offset-2',
          className,
        )}
        role="button"
        aria-label="Upload Zone — error state"
      >
        <input {...getInputProps()} />
        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-destructive/10">
          <AlertCircle className="h-7 w-7 text-destructive" aria-hidden="true" />
        </div>
        <div>
          <p className="font-semibold text-destructive text-sm">Invalid File</p>
          <p className="text-xs text-muted-foreground mt-1 max-w-xs">{error}</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            open();
          }}
          className="border-destructive text-destructive hover:bg-destructive/10 mt-1"
          aria-label="Try uploading another file"
        >
          Try Again
        </Button>
      </div>
    );
  }

  /* ── Default idle state ── */
  return (
    <div className={cn('flex flex-col gap-4', className)}>
      {/* Main drop zone — reduced height */}
      <div
        {...getRootProps()}
        className={cn(
          'group relative flex flex-col items-center justify-center gap-4 rounded-2xl',
          'border-2 border-dashed border-border/60 bg-muted/20 px-8 py-10 text-center',
          'cursor-pointer transition-all duration-300',
          'hover:border-primary/40 hover:bg-primary/4 hover:shadow-md',
          isFocused && 'border-primary/50 bg-primary/4 ring-2 ring-ring ring-offset-2',
        )}
        role="button"
        aria-label="Upload Zone"
      >
        <input {...getInputProps()} />

        {/* Animated icon — uses accent/primary colour */}
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/8 transition-all duration-300 group-hover:bg-primary/15 group-hover:scale-105">
          <UploadCloud
            className="h-8 w-8 text-primary/70 transition-all duration-300 group-hover:text-primary group-hover:-translate-y-0.5"
            aria-hidden="true"
          />
        </div>

        {/* Copy */}
        <div className="flex flex-col gap-1">
          <p className="text-sm font-semibold text-foreground">Drag &amp; drop your CSV</p>
          <p className="text-xs text-muted-foreground">
            or{' '}
            <span className="text-primary font-medium underline underline-offset-2 decoration-dotted cursor-pointer">
              browse your computer
            </span>
          </p>
        </div>

        {/* Format badge */}
        <span className="inline-flex items-center gap-1.5 rounded-full border border-border/80 bg-background px-3 py-1 text-[11px] text-muted-foreground">
          <FileSpreadsheet className="h-3 w-3" aria-hidden="true" />
          CSV · Max 10 MB
        </span>
      </div>

      {/* Supported sources row */}
      <div className="rounded-xl border border-border/50 bg-card px-4 py-3">
        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2.5">
          Supported sources
        </p>
        <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
          {SUPPORTED_SOURCES.map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-primary/8">
                <Icon className="h-3 w-3 text-primary/80" />
              </span>
              {label}
            </div>
          ))}
        </div>
      </div>

      {/* AI features strip */}
      <div className="rounded-xl border border-primary/10 bg-primary/4 px-4 py-3">
        <p className="text-[11px] font-semibold text-primary/70 uppercase tracking-wider mb-2.5">
          AI capabilities
        </p>
        <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
          {AI_FEATURES.map((feature) => (
            <div key={feature} className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="text-primary font-bold">✓</span>
              {feature}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
