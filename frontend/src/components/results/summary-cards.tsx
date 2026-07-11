import * as React from 'react';
import { ImportSummary } from '../../types/import';
import { Layers, CheckCircle2, AlertTriangle, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SummaryCardsProps {
  readonly summary: ImportSummary;
}

interface StatCardProps {
  label: string;
  value: React.ReactNode;
  sub: string;
  icon: React.ReactNode;
  className?: string;
  valueClassName?: string;
}

function StatCard({ label, value, sub, icon, className, valueClassName }: StatCardProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-3 rounded-2xl border border-border/60 bg-card px-5 py-4 shadow-sm',
        className,
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-muted/60">
          {icon}
        </span>
      </div>
      <div>
        <div className={cn('text-3xl font-extrabold tracking-tight', valueClassName)}>{value}</div>
        <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>
      </div>
    </div>
  );
}

export function SummaryCards({ summary }: SummaryCardsProps) {
  const successRate = summary.total > 0 ? Math.round((summary.imported / summary.total) * 100) : 0;

  const valSkipped = summary.validationSkipped ?? 0;
  const procFailed = summary.processingFailed ?? 0;

  return (
    <div className="grid gap-3 grid-cols-2 sm:grid-cols-4 w-full">
      <StatCard
        label="Imported"
        value={summary.imported}
        sub={`of ${summary.total.toLocaleString()} total rows`}
        icon={<CheckCircle2 className="h-4 w-4 text-emerald-500" />}
        className="border-emerald-500/20 bg-emerald-50/30 dark:bg-emerald-950/10"
        valueClassName="text-emerald-600 dark:text-emerald-400"
      />
      <StatCard
        label="Validation Errors"
        value={valSkipped}
        sub="Failed business rules"
        icon={
          <AlertTriangle
            className={cn('h-4 w-4', valSkipped > 0 ? 'text-amber-500' : 'text-muted-foreground')}
          />
        }
        className={
          valSkipped > 0 ? 'border-amber-500/20 bg-amber-50/30 dark:bg-amber-950/10' : undefined
        }
        valueClassName={valSkipped > 0 ? 'text-amber-600 dark:text-amber-400' : undefined}
      />
      <StatCard
        label="AI Processing Failed"
        value={procFailed}
        sub="Provider rate limits or timeouts"
        icon={
          <AlertTriangle
            className={cn('h-4 w-4', procFailed > 0 ? 'text-rose-500' : 'text-muted-foreground')}
          />
        }
        className={
          procFailed > 0 ? 'border-rose-500/20 bg-rose-50/30 dark:bg-rose-950/10' : undefined
        }
        valueClassName={procFailed > 0 ? 'text-rose-600 dark:text-rose-400' : undefined}
      />
      <StatCard
        label="Import Success"
        value={`${successRate}%`}
        sub="Successful processing rate"
        icon={<Sparkles className="h-4 w-4 text-primary" />}
        className="border-primary/15 bg-primary/4"
        valueClassName="text-primary"
      />
    </div>
  );
}
