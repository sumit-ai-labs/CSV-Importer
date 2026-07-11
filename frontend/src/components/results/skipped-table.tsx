import * as React from 'react';
import { SkippedImport, SkipReasonType } from '../../types/import';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Button } from '../ui/button';
import { ChevronDown, ChevronRight, AlertTriangle, Zap, XCircle } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface SkippedTableProps {
  readonly skipped: readonly SkippedImport[];
}

interface RowMeta {
  icon: React.ReactNode;
  label: string;
  labelClass: string;
  suggestedAction: string;
}

function getRowMeta(type: SkipReasonType | undefined): RowMeta {
  switch (type) {
    case 'AI_FAILURE':
      return {
        icon: <Zap className="h-3.5 w-3.5 shrink-0 text-rose-500" />,
        label: 'AI Processing Failed',
        labelClass: 'text-rose-600 dark:text-rose-400',
        suggestedAction:
          'The AI provider temporarily rejected this request due to rate limits or a timeout. Retry the import in a few minutes.',
      };
    case 'VALIDATION':
      return {
        icon: <XCircle className="h-3.5 w-3.5 shrink-0 text-amber-500" />,
        label: 'Validation Error',
        labelClass: 'text-amber-600 dark:text-amber-400',
        suggestedAction: 'Check that the row has at least one of: a valid email or phone number.',
      };
    case 'PARSER':
      return {
        icon: <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-orange-500" />,
        label: 'Parse Error',
        labelClass: 'text-orange-600 dark:text-orange-400',
        suggestedAction:
          'This row could not be read from the CSV. Check for malformed characters or unbalanced quotes.',
      };
    default:
      return {
        icon: <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />,
        label: 'Skipped',
        labelClass: 'text-muted-foreground',
        suggestedAction: 'Review the original row data below for clues.',
      };
  }
}

export function SkippedTable({ skipped }: SkippedTableProps) {
  const [expandedRows, setExpandedRows] = React.useState<Record<number, boolean>>({});

  const toggleRow = (rowNumber: number) => {
    setExpandedRows((prev) => ({
      ...prev,
      [rowNumber]: !prev[rowNumber],
    }));
  };

  return (
    <div className="rounded-md border border-border/40 bg-card max-h-[480px] overflow-auto relative">
      <Table className="w-full">
        <TableHeader className="sticky top-0 bg-card z-10 shadow-xs">
          <TableRow>
            <TableHead className="w-[50px] bg-muted/50"></TableHead>
            <TableHead className="w-[100px] bg-muted/50 text-xs font-semibold">Row</TableHead>
            <TableHead className="w-[180px] bg-muted/50 text-xs font-semibold">Category</TableHead>
            <TableHead className="bg-muted/50 text-xs font-semibold">Reason</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {skipped?.length ? (
            skipped.map((item) => {
              const isExpanded = !!expandedRows[item.rowNumber];
              const meta = getRowMeta(item.type);
              return (
                <React.Fragment key={item.rowNumber}>
                  <TableRow className="hover:bg-muted/40">
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => toggleRow(item.rowNumber)}
                        aria-label={isExpanded ? 'Collapse row details' : 'Expand row details'}
                      >
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {item.rowNumber}
                    </TableCell>
                    <TableCell>
                      <div
                        className={cn(
                          'flex items-center gap-1.5 text-xs font-semibold',
                          meta.labelClass,
                        )}
                      >
                        {meta.icon}
                        {meta.label}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-foreground/80">{item.reason}</TableCell>
                  </TableRow>
                  {isExpanded && (
                    <TableRow className="hover:bg-transparent">
                      <TableCell colSpan={4} className="p-4 border-t-0">
                        <div className="rounded-lg bg-muted/60 p-4 border text-xs space-y-4">
                          {/* Suggested action */}
                          <div className="flex items-start gap-2">
                            <span className="text-muted-foreground font-semibold shrink-0">
                              Suggested action:
                            </span>
                            <span className="text-foreground/80">{meta.suggestedAction}</span>
                          </div>
                          {/* Original row data */}
                          {Object.keys(item.originalRow || {}).length > 0 && (
                            <div>
                              <span className="block font-semibold text-muted-foreground mb-2">
                                Original CSV Data:
                              </span>
                              <div className="grid gap-2 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
                                {Object.entries(item.originalRow || {}).map(([key, value]) => (
                                  <div
                                    key={key}
                                    className="flex flex-col gap-0.5 border-b border-border/40 pb-1"
                                  >
                                    <span className="text-muted-foreground font-medium truncate">
                                      {key}
                                    </span>
                                    <span className="font-mono whitespace-pre-wrap text-foreground/90">
                                      {value || '(empty)'}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              );
            })
          ) : (
            <TableRow>
              <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                No skipped records.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
