import * as React from 'react';
import { ImportResult } from '../../types/import';
import { SummaryCards } from './summary-cards';
import { ResultsTable } from './results-table';
import { SkippedTable } from './skipped-table';
import { SectionCard } from '../ui/section-card';
import { Button } from '../ui/button';
import { RefreshCw, CheckCircle2, Users, AlertTriangle } from 'lucide-react';

export interface ResultsSectionProps {
  readonly result: ImportResult;
  readonly onStartOver?: () => void;
}

export function ResultsSection({ result, onStartOver }: ResultsSectionProps) {
  return (
    <div className="w-full space-y-5">
      {/* Header row */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-4 border-b border-border/60">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-950">
            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
          </span>
          <div>
            <h2 className="text-lg font-bold text-foreground leading-tight">Import Complete</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              AI processed and mapped your CSV fields into CRM-ready records.
            </p>
          </div>
        </div>
        {onStartOver && (
          <Button
            variant="outline"
            size="sm"
            onClick={onStartOver}
            className="gap-1.5 font-medium shrink-0"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Import Another File
          </Button>
        )}
      </div>

      {/* Summary stat cards */}
      <SummaryCards summary={result.summary} />

      {/* Imported contacts table */}
      {result.records.length > 0 && (
        <SectionCard
          title={
            <span className="flex items-center gap-2">
              <Users className="h-4 w-4 text-emerald-500" />
              Imported Contacts
              <span className="ml-1 rounded-full bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                {result.records.length}
              </span>
            </span>
          }
          description="AI-mapped CRM records extracted from your CSV."
        >
          <ResultsTable records={result.records} />
        </SectionCard>
      )}

      {/* Skipped records table */}
      {result.skipped.length > 0 && (
        <SectionCard
          title={
            <span className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              Skipped Rows
              <span className="ml-1 rounded-full bg-amber-50 dark:bg-amber-950 px-2 py-0.5 text-xs font-semibold text-amber-600 dark:text-amber-400">
                {result.skipped.length}
              </span>
            </span>
          }
          description="Rows that were not imported. Expand a row to view the reason and original data."
        >
          <SkippedTable skipped={result.skipped} />
        </SectionCard>
      )}
    </div>
  );
}
