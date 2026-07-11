'use client';

import * as React from 'react';
import { useTheme } from 'next-themes';
import { Moon, Sun } from 'lucide-react';
import { cn } from '@/lib/utils';

export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  // Avoid hydration mismatch — render only after mount
  React.useEffect(() => setMounted(true), []);

  if (!mounted) {
    // Placeholder same size as the button so layout doesn't shift
    return <div className={cn('h-8 w-8', className)} />;
  }

  const isDark = resolvedTheme === 'dark';

  return (
    <button
      type="button"
      aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className={cn(
        'group relative flex h-8 w-8 items-center justify-center rounded-full',
        'border border-border/60 bg-background',
        'text-muted-foreground transition-all duration-300',
        'hover:border-primary/40 hover:text-primary hover:bg-primary/5',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        className,
      )}
    >
      {/* Sun icon — shown in light mode */}
      <Sun
        className={cn(
          'absolute h-4 w-4 transition-all duration-300',
          isDark ? 'opacity-0 rotate-90 scale-50' : 'opacity-100 rotate-0 scale-100',
        )}
        aria-hidden="true"
      />
      {/* Moon icon — shown in dark mode */}
      <Moon
        className={cn(
          'absolute h-4 w-4 transition-all duration-300',
          isDark ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-50',
        )}
        aria-hidden="true"
      />
    </button>
  );
}
