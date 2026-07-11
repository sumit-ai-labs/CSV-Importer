import * as React from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import { LoadingState } from './loading-state';
import { cn } from '@/lib/utils';

export interface SectionCardProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  title?: React.ReactNode;
  description?: React.ReactNode;
  footer?: React.ReactNode;
  loading?: boolean;
  headerClassName?: string;
  contentClassName?: string;
  footerClassName?: string;
}

export function SectionCard({
  title,
  description,
  children,
  footer,
  loading = false,
  className,
  headerClassName,
  contentClassName,
  footerClassName,
  ...props
}: SectionCardProps) {
  const hasHeader = title || description;

  return (
    <Card
      className={cn('overflow-hidden rounded-2xl shadow-xl border border-border/60', className)}
      {...props}
    >
      {hasHeader && (
        <CardHeader className={headerClassName}>
          {title && <CardTitle className="text-xl font-semibold tracking-tight">{title}</CardTitle>}
          {description && (
            <CardDescription className="text-muted-foreground">{description}</CardDescription>
          )}
        </CardHeader>
      )}
      <CardContent className={contentClassName}>
        {loading ? (
          <LoadingState variant="default" title="" description="" className="py-12" />
        ) : (
          children
        )}
      </CardContent>
      {!loading && footer && <CardFooter className={footerClassName}>{footer}</CardFooter>}
    </Card>
  );
}
