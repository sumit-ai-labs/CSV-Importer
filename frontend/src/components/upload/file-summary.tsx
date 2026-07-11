import * as React from 'react';
import { SelectedFile } from '../../types/upload';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { FileText, Database, Columns, Calendar, HardDrive } from 'lucide-react';

export interface FileSummaryProps {
  readonly file: SelectedFile;
  readonly rowCount: number;
  readonly columnCount: number;
  readonly className?: string;
}

const formatBytes = (bytes: number, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

const formatDate = (timestamp: number) => {
  return new Date(timestamp).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export function FileSummary({ file, rowCount, columnCount, className }: FileSummaryProps) {
  return (
    <Card className={cn('overflow-hidden border border-border bg-card shadow-xs', className)}>
      <CardHeader className="border-b border-border/40 bg-muted/20 py-4 px-6">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500">
              <FileText className="h-4.5 w-4.5" />
            </div>
            <CardTitle className="text-base font-semibold tracking-tight">
              File Properties
            </CardTitle>
          </div>
          <Badge
            variant="outline"
            className="bg-emerald-500/5 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 font-mono text-xs"
          >
            CSV
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
          {/* File Name */}
          <div className="flex flex-col gap-1.5 p-3 rounded-lg bg-muted/30 border border-border/50 hover:bg-muted/50 transition-colors">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <FileText className="h-4 w-4" />
              <span className="text-xs font-medium">Name</span>
            </div>
            <span className="text-sm font-semibold truncate" title={file.name}>
              {file.name}
            </span>
          </div>

          {/* File Size */}
          <div className="flex flex-col gap-1.5 p-3 rounded-lg bg-muted/30 border border-border/50 hover:bg-muted/50 transition-colors">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <HardDrive className="h-4 w-4" />
              <span className="text-xs font-medium">Size</span>
            </div>
            <span className="text-sm font-semibold truncate">{formatBytes(file.size)}</span>
          </div>

          {/* Rows count */}
          <div className="flex flex-col gap-1.5 p-3 rounded-lg bg-muted/30 border border-border/50 hover:bg-muted/50 transition-colors">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Database className="h-4 w-4" />
              <span className="text-xs font-medium">Rows</span>
            </div>
            <span className="text-sm font-semibold truncate">{rowCount.toLocaleString()}</span>
          </div>

          {/* Columns count */}
          <div className="flex flex-col gap-1.5 p-3 rounded-lg bg-muted/30 border border-border/50 hover:bg-muted/50 transition-colors">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Columns className="h-4 w-4" />
              <span className="text-xs font-medium">Columns</span>
            </div>
            <span className="text-sm font-semibold truncate">{columnCount}</span>
          </div>

          {/* Last Modified */}
          <div className="col-span-2 sm:col-span-1 flex flex-col gap-1.5 p-3 rounded-lg bg-muted/30 border border-border/50 hover:bg-muted/50 transition-colors">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span className="text-xs font-medium">Modified</span>
            </div>
            <span className="text-sm font-semibold truncate" title={formatDate(file.lastModified)}>
              {formatDate(file.lastModified)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
