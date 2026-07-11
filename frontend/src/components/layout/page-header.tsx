'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Sparkles, CheckCheck } from 'lucide-react';
import { ThemeToggle } from './theme-toggle';

const STEPS = [
  { id: 1, label: 'Upload' },
  { id: 2, label: 'Preview' },
  { id: 3, label: 'AI Process' },
  { id: 4, label: 'Results' },
] as const;

export type StepId = (typeof STEPS)[number]['id'];

export interface PageHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  description?: React.ReactNode;
  currentStep?: StepId;
}

export function PageHeader({
  title = 'AI CSV Importer',
  description,
  currentStep = 1,
  className,
  ...props
}: PageHeaderProps) {
  return (
    <div
      className={cn('relative flex flex-col items-center text-center gap-5 mb-8', className)}
      {...props}
    >
      {/* Theme toggle — top-right, doesn't affect centred layout */}
      <ThemeToggle className="absolute right-0 top-0" />
      {/* Brand Badge — softer, less saturated */}
      <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/15 bg-primary/5 px-2.5 py-0.5 text-[11px] font-medium text-primary/80 tracking-wider">
        <span className="h-1.5 w-1.5 rounded-full bg-primary/70 animate-pulse" />
        GrowEasy · AI Powered
      </div>

      {/* Hero Title */}
      <div className="flex flex-col items-center gap-2">
        <h1 className="flex items-center gap-2.5 text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">
          <Sparkles className="h-8 w-8 text-primary shrink-0" aria-hidden="true" />
          {title}
        </h1>
        <p className="max-w-sm text-sm text-muted-foreground leading-relaxed">
          {description ??
            'Import leads from Facebook, Google Ads, Excel, or any CSV — AI maps fields automatically.'}
        </p>
      </div>

      {/* Step Indicator */}
      <nav aria-label="Import progress steps" className="flex items-center">
        {STEPS.map((step, index) => {
          const isCompleted = step.id < currentStep;
          const isCurrent = step.id === currentStep;

          return (
            <React.Fragment key={step.id}>
              {/* Step pill */}
              <div
                className={cn(
                  'flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-all duration-300',
                  isCompleted && 'text-primary/80',
                  isCurrent && 'bg-primary text-primary-foreground shadow-sm font-semibold',
                  !isCompleted && !isCurrent && 'text-muted-foreground/50',
                )}
                aria-current={isCurrent ? 'step' : undefined}
              >
                <span
                  className={cn(
                    'flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold shrink-0',
                    isCompleted && 'bg-primary/12 text-primary',
                    isCurrent && 'bg-white/20',
                    !isCompleted && !isCurrent && 'bg-muted/60',
                  )}
                >
                  {isCompleted ? <CheckCheck className="h-2.5 w-2.5" /> : step.id}
                </span>
                {step.label}
              </div>

              {/* Connector line */}
              {index < STEPS.length - 1 && (
                <div
                  className={cn(
                    'h-px w-5 transition-all duration-500',
                    step.id < currentStep ? 'bg-primary/40' : 'bg-border/50',
                  )}
                  aria-hidden="true"
                />
              )}
            </React.Fragment>
          );
        })}
      </nav>
    </div>
  );
}
