export type CSVValue = string;

export type CSVRow = Record<string, CSVValue>;

export type CSVHeaders = readonly string[];

export type CSVBatch = readonly CSVRow[];

export interface CSVParseResult {
  readonly headers: CSVHeaders;
  readonly rows: readonly CSVRow[];
  readonly totalRows: number;
}

export interface CSVParserOptions {
  readonly delimiter?: string;
  readonly skipEmptyLines?: boolean;
}
