import * as React from 'react';
import { cn } from '@/lib/utils';

export interface PageContainerProps extends React.HTMLAttributes<HTMLElement> {
  as?: React.ElementType;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

const sizeClasses = {
  sm: 'max-w-xl',
  md: 'max-w-2xl',
  lg: 'max-w-3xl',
  xl: 'max-w-5xl',
  full: 'max-w-none',
};

export const PageContainer = React.forwardRef<HTMLElement, PageContainerProps>(
  ({ as: Component = 'main', size = 'md', className, ...props }, ref) => {
    return (
      <Component
        ref={ref}
        className={cn(
          'flex-1 flex flex-col items-center justify-center w-full px-4 py-12 md:px-6',
          className,
        )}
        {...props}
      >
        <div className={cn('w-full', sizeClasses[size])}>{props.children}</div>
      </Component>
    );
  },
);

PageContainer.displayName = 'PageContainer';
