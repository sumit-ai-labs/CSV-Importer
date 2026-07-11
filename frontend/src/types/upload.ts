export type UploadStep =
  'IDLE' | 'FILE_SELECTED' | 'PREVIEW_READY' | 'IMPORTING' | 'COMPLETED' | 'ERROR';

export interface SelectedFile {
  readonly name: string;
  readonly size: number;
  readonly type: string;
  readonly lastModified: number;
}

export type PreviewHeaders = readonly string[];

export type PreviewRow = Readonly<Record<string, string | number>>;

export interface PreviewData {
  readonly headers: PreviewHeaders;
  readonly rows: readonly PreviewRow[];
  readonly rowCount: number;
  readonly columnCount: number;
}

export interface ImportProgress {
  readonly totalBatches: number;
  readonly completedBatches: number;
  readonly percentage: number;
  readonly status: string;
}

export interface UploadState {
  readonly selectedFile: SelectedFile | null;
  readonly rawFile: File | null;
  readonly preview: PreviewData | null;
  readonly progress: ImportProgress | null;
  readonly currentStep: UploadStep;
  readonly loading: boolean;
  readonly error: string | null;
  readonly importResult: import('./import').ImportResult | null;
}
