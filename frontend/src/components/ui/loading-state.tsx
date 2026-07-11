import * as React from 'react';
import { Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

export interface LoadingStateProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  description?: string;
  variant?: 'default' | 'compact' | 'fullscreen';
}

export function LoadingState({
  title,
  description,
  variant = 'default',
  className,
  ...props
}: LoadingStateProps) {
  if (variant === 'fullscreen') {
    return (
      <div
        role="status"
        aria-live="polite"
        className={cn(
          'fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/85 backdrop-blur-xs text-center p-6',
          className,
        )}
        {...props}
      >
        <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" aria-hidden="true" />
        <div className="space-y-1.5 max-w-sm">
          <h3 className="font-semibold text-xl text-foreground">{title || 'Loading...'}</h3>
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </div>
        <span className="sr-only">{title || 'Loading in progress'}</span>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div
        role="status"
        aria-live="polite"
        className={cn('flex items-center justify-center gap-3 p-3 text-center w-full', className)}
        {...props}
      >
        <Loader2 className="h-5 w-5 animate-spin text-primary" aria-hidden="true" />
        {title && <span className="text-sm font-medium text-foreground">{title}</span>}
        <span className="sr-only">{title || 'Loading'}</span>
      </div>
    );
  }

  // Default variant
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'flex flex-col items-center justify-center p-8 text-center space-y-4 min-h-[200px] w-full',
        className,
      )}
      {...props}
    >
      <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden="true" />
      <div className="space-y-2 w-full max-w-sm flex flex-col items-center">
        {title ? (
          <h3 className="font-semibold text-lg text-foreground">{title}</h3>
        ) : (
          <Skeleton className="h-6 w-32 rounded-md" />
        )}
        {description ? (
          <p className="text-sm text-muted-foreground">{description}</p>
        ) : (
          !title && (
            <div className="w-full space-y-2 pt-2">
              <Skeleton className="h-4 w-full rounded-md" />
              <Skeleton className="h-4 w-[85%] mx-auto rounded-md" />
            </div>
          )
        )}
      </div>
      <span className="sr-only">{title || 'Loading in progress'}</span>
    </div>
  );
}
