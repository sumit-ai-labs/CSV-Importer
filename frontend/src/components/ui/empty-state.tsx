import * as React from 'react';
import { cn } from '@/lib/utils';

export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  description?: string;
  icon?: React.ComponentType<{ className?: string }> | React.ReactNode;
  illustration?: React.ReactNode;
  action?: React.ReactNode;
}

export function EmptyState({
  title,
  description,
  icon: Icon,
  illustration,
  action,
  className,
  ...props
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center p-8 md:p-12 rounded-xl border border-dashed border-border bg-card text-card-foreground shadow-xs min-h-[300px]',
        className,
      )}
      {...props}
    >
      {illustration && (
        <div className="mb-6 max-w-xs w-full flex items-center justify-center">{illustration}</div>
      )}
      {!illustration && Icon && (
        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-muted text-muted-foreground mb-4">
          {typeof Icon === 'function' ? <Icon className="w-6 h-6" aria-hidden="true" /> : Icon}
        </div>
      )}
      <h3 className="font-semibold text-lg tracking-tight mb-1.5">{title}</h3>
      {description && (
        <p className="text-sm text-muted-foreground max-w-sm mb-6 leading-relaxed">{description}</p>
      )}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
