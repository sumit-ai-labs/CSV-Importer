'use client';

import * as React from 'react';
import { PreviewHeaders, PreviewRow } from '../../types/upload';
import { DataTable } from '../shared/data-table';

export interface PreviewTableProps {
  readonly headers: PreviewHeaders;
  readonly rows: readonly PreviewRow[];
  readonly className?: string;
}

export function PreviewTable({ headers, rows, className }: PreviewTableProps) {
  const columns = React.useMemo(() => {
    const isContactHeader = (col: string): boolean => {
      const c = col.toLowerCase();
      return (
        c.includes('email') ||
        c.includes('mail') ||
        c.includes('phone') ||
        c.includes('mobile') ||
        c.includes('cell') ||
        c.includes('contact')
      );
    };

    return headers.map((header) => ({
      accessorKey: header,
      header: header,
      cell: (info: any) => {
        const val = info.getValue();
        const strVal = String(val ?? '').trim();

        if (strVal === '') {
          if (isContactHeader(header)) {
            return (
              <span
                className="inline-flex items-center gap-1.5 text-xs text-amber-500 font-medium bg-amber-500/5 px-2 py-0.5 rounded-md border border-amber-500/10 select-none"
                title="Missing required contact detail (Email or Phone)"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />—
              </span>
            );
          }
          return <span className="text-xs text-muted-foreground/40 select-none">—</span>;
        }

        if (isContactHeader(header)) {
          const parts = strVal
            .split(/[;,]/)
            .map((p) => p.trim())
            .filter(Boolean);
          if (parts.length > 1) {
            return (
              <div className="flex flex-col gap-1.5 items-start">
                {parts.map((part, idx) => (
                  <span
                    key={idx}
                    className="text-[11px] font-mono px-1.5 py-0.5 rounded-md bg-muted text-muted-foreground border border-border/40 hover:bg-muted/80 transition-colors select-all"
                  >
                    {part}
                  </span>
                ))}
              </div>
            );
          }
        }

        if (typeof val === 'number') {
          return <span className="font-mono text-xs text-foreground/80">{val}</span>;
        }

        return (
          <span
            className="text-xs whitespace-pre-wrap max-w-[180px] block text-foreground/90"
            title={strVal}
          >
            {strVal}
          </span>
        );
      },
    }));
  }, [headers]);

  if (headers.length === 0) {
    return null;
  }

  return (
    <DataTable
      columns={columns}
      data={rows as any[]}
      maxHeight="360px"
      className={className}
      emptyMessage="No preview data available."
    />
  );
}
