import * as React from 'react';
import { Progress } from '../ui/progress';
import { SectionCard } from '../ui/section-card';
import { Loader2 } from 'lucide-react';

export interface ImportProgressProps {
  readonly status: string;
  readonly percentage: number;
  readonly completedBatches?: number;
  readonly totalBatches?: number;
}

export function ImportProgress({
  status,
  percentage,
  completedBatches,
  totalBatches,
}: ImportProgressProps) {
  const showBatches =
    completedBatches !== undefined && totalBatches !== undefined && totalBatches > 0;

  return (
    <SectionCard
      title="Importing Contacts"
      description="Your dataset is being processed using AI-assisted validation checks. Do not close this window."
      className="w-full max-w-3xl mx-auto"
    >
      <div className="flex flex-col items-center justify-center py-10 px-4 space-y-6">
        <Loader2 className="h-10 w-10 text-primary animate-spin" />
        <div className="w-full max-w-md space-y-4 text-center">
          <div className="flex justify-between text-xs text-muted-foreground font-medium">
            <span className="truncate max-w-[240px] text-left">{status}</span>
            {showBatches && (
              <span className="font-semibold text-primary">
                {completedBatches} / {totalBatches} batches
              </span>
            )}
            <span>{Math.round(percentage)}%</span>
          </div>
          <Progress
            value={percentage}
            className="h-2 w-full bg-muted"
            aria-valuenow={Math.round(percentage)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Import progress"
          />
        </div>
        <p className="text-xs text-muted-foreground">
          Running data normalizations and matching columns...
        </p>
      </div>
    </SectionCard>
  );
}
