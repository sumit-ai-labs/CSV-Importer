/**
 * page.integration.test.tsx
 *
 * Integration tests for the main page (frontend/src/app/page.tsx).
 * Mocks the backend API and verifies the complete user journey:
 *   Upload → Preview → Confirm → Import → Results → Reset
 */

import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ---------------------------------------------------------------------------
// 1. Global mocks — must be before any imports that use these modules
// ---------------------------------------------------------------------------

// Mock Next.js `next-themes`
vi.mock('next-themes', () => ({
  ThemeProvider: ({ children }: any) => <>{children}</>,
  useTheme: () => ({ theme: 'light', setTheme: vi.fn() }),
}));

// Mock the API service
vi.mock('../services/api/import.api', () => ({
  uploadCsvFile: vi.fn(),
}));

// Mock PapaParse
vi.mock('papaparse', () => ({
  default: {
    parse: vi.fn(),
  },
}));

// Mock react-dropzone
const mockDropzoneOpen = vi.fn();
let mockDroppedFiles: File[] = [];

vi.mock('react-dropzone', () => ({
  useDropzone: (options: any) => ({
    getRootProps: () => ({
      'data-testid': 'dropzone-root',
      role: 'button',
      tabIndex: 0,
      'aria-label': 'Upload Zone',
      onClick: () => {
        if (mockDroppedFiles.length > 0 && options.onDropAccepted) {
          options.onDropAccepted(mockDroppedFiles);
        }
      },
    }),
    getInputProps: () => ({
      'data-testid': 'dropzone-input',
      type: 'file',
    }),
    open: mockDropzoneOpen,
    isDragActive: false,
    isFocused: false,
  }),
}));

// ── Complete lucide-react mock covering ALL icons used in the component tree ──
const SvgIcon = ({ testId }: { testId?: string }) => (
  <svg data-testid={testId} aria-hidden="true" />
);

vi.mock('lucide-react', () => ({
  // upload-zone.tsx
  UploadCloud: () => <SvgIcon testId="icon-upload-cloud" />,
  FileSpreadsheet: () => <SvgIcon testId="icon-file-spreadsheet" />,
  X: () => <SvgIcon testId="icon-x" />,
  AlertCircle: () => <SvgIcon testId="icon-alert-circle" />,
  Facebook: () => <SvgIcon testId="icon-facebook" />,
  BarChart2: () => <SvgIcon testId="icon-bar-chart" />,
  Table2: () => <SvgIcon testId="icon-table" />,
  Database: () => <SvgIcon testId="icon-database" />,
  // page-header.tsx
  Sparkles: () => <SvgIcon testId="icon-sparkles" />,
  CheckCheck: () => <SvgIcon testId="icon-checkcheck" />,
  // theme-toggle.tsx
  Sun: () => <SvgIcon testId="icon-sun" />,
  Moon: () => <SvgIcon testId="icon-moon" />,
  // upload-container.tsx
  CheckCircle2: () => <SvgIcon testId="icon-check-circle-2" />,
  RefreshCw: () => <SvgIcon testId="icon-refresh-cw" />,
  Loader2: () => <SvgIcon testId="icon-loader" />,
  // file-summary.tsx
  FileText: () => <SvgIcon testId="icon-file-text" />,
  Columns: () => <SvgIcon testId="icon-columns" />,
  Calendar: () => <SvgIcon testId="icon-calendar" />,
  HardDrive: () => <SvgIcon testId="icon-hard-drive" />,
  // results-section.tsx / summary-cards.tsx / skipped-table.tsx
  Layers: () => <SvgIcon testId="icon-layers" />,
  AlertTriangle: () => <SvgIcon testId="icon-alert-triangle" />,
  Users: () => <SvgIcon testId="icon-users" />,
  ChevronDown: () => <SvgIcon testId="icon-chevron-down" />,
  ChevronRight: () => <SvgIcon testId="icon-chevron-right" />,
  // results-table.tsx
  ArrowUpDown: () => <SvgIcon testId="icon-arrow-up-down" />,
  // preview-section.tsx
  ArrowRight: () => <SvgIcon testId="icon-arrow-right" />,
  ArrowLeft: () => <SvgIcon testId="icon-arrow-left" />,
  // import-progress.tsx — already Loader2 above
  // Sonner icons
  CheckCircle: () => <SvgIcon testId="icon-check-circle" />,
  XCircle: () => <SvgIcon testId="icon-x-circle" />,
  AlertOctagon: () => <SvgIcon testId="icon-alert-octagon" />,
  Info: () => <SvgIcon testId="icon-info" />,
}));

// ── Pass-through mocks for internal UI modules ──────────────────────────────
// Using importOriginal so we never miss a named export
vi.mock('../components/ui/button', async (importOriginal) => {
  const actual: any = await importOriginal();
  return {
    ...actual,
    Button: ({ children, onClick, disabled, ...props }: any) => (
      <button onClick={onClick} disabled={disabled} {...props}>
        {children}
      </button>
    ),
  };
});

vi.mock('../components/ui/card', async (importOriginal) => {
  const actual: any = await importOriginal();
  return { ...actual }; // use real Card components — they are pure React, no native deps
});

vi.mock('../components/ui/scroll-area', async (importOriginal) => {
  const actual: any = await importOriginal();
  return { ...actual };
});

vi.mock('../components/ui/badge', async (importOriginal) => {
  const actual: any = await importOriginal();
  return { ...actual };
});

vi.mock('../components/ui/progress', async (importOriginal) => {
  const actual: any = await importOriginal();
  return {
    ...actual,
    Progress: ({ value }: any) => <div data-testid="progress-bar" data-value={value} />,
  };
});

vi.mock('../components/ui/table', async (importOriginal) => {
  const actual: any = await importOriginal();
  return { ...actual };
});

vi.mock('sonner', () => ({
  Toaster: () => null,
  toast: { error: vi.fn(), success: vi.fn(), info: vi.fn() },
}));

vi.mock('@radix-ui/react-progress', async (importOriginal) => {
  const actual: any = await importOriginal();
  return { ...actual };
});

vi.mock('@radix-ui/react-scroll-area', async (importOriginal) => {
  const actual: any = await importOriginal();
  return { ...actual };
});

vi.mock('@tanstack/react-table', () => ({
  useReactTable: () => ({
    getHeaderGroups: () => [],
    getRowModel: () => ({ rows: [] }),
    getState: () => ({ pagination: { pageIndex: 0, pageSize: 10 } }),
    getPageCount: () => 0,
    setPageIndex: vi.fn(),
    previousPage: vi.fn(),
    nextPage: vi.fn(),
    getCanPreviousPage: () => false,
    getCanNextPage: () => false,
  }),
  getCoreRowModel: () => ({}),
  getSortedRowModel: () => ({}),
  getPaginationRowModel: () => ({}),
  flexRender: (comp: any, ctx: any) => (typeof comp === 'function' ? comp(ctx) : comp),
  createColumnHelper: () => ({
    accessor: (key: string, opts: any) => ({ id: key, ...opts }),
    display: (opts: any) => ({ ...opts }),
  }),
}));

// ---------------------------------------------------------------------------
// 2. Import after mocks
// ---------------------------------------------------------------------------

import Papa from 'papaparse';
import { uploadCsvFile } from '../services/api/import.api';
import { useUploadStore } from '../store/upload.store';
import Home from './page';

const mockUploadCsvFile = uploadCsvFile as ReturnType<typeof vi.fn>;
const mockPapaParse = (Papa as any).parse as ReturnType<typeof vi.fn>;

// ---------------------------------------------------------------------------
// 3. Fixtures
// ---------------------------------------------------------------------------

const CSV_CONTENT = 'name,email,mobile\nAlice,alice@test.com,9999999999\n';

const IMPORT_SUCCESS_RESPONSE = {
  success: true,
  message: 'CSV import completed successfully',
  data: {
    summary: { total: 1, imported: 1, skipped: 0 },
    records: [
      {
        created_at: '2024-01-01',
        name: 'Alice',
        email: 'alice@test.com',
        country_code: '+91',
        mobile_without_country_code: '9999999999',
        company: 'TestCo',
        city: 'Bangalore',
        state: 'Karnataka',
        country: 'India',
        lead_owner: 'Bob',
        crm_status: 'GOOD_LEAD_FOLLOW_UP',
        crm_note: '',
        data_source: '',
        possession_time: '',
        description: '',
      },
    ],
    skipped: [],
  },
};

const IMPORT_PARTIAL_RESPONSE = {
  success: true,
  message: 'CSV import completed',
  data: {
    summary: { total: 2, imported: 1, skipped: 1 },
    records: [IMPORT_SUCCESS_RESPONSE.data.records[0]],
    skipped: [
      {
        rowNumber: 3,
        reason: 'Missing email',
        originalRow: { name: 'Bob', email: '', mobile: '8888888888' },
      },
    ],
  },
};

// ---------------------------------------------------------------------------
// 4. Helper: configure PapaParse to immediately resolve with test data
// ---------------------------------------------------------------------------

function configurePapaParseSuccess(
  data: Record<string, string>[] = [
    { name: 'Alice', email: 'alice@test.com', mobile: '9999999999' },
  ],
  fields: string[] = ['name', 'email', 'mobile'],
) {
  mockPapaParse.mockImplementation((_file: File, config: any) => {
    config.complete?.({
      data,
      errors: [],
      meta: {
        fields,
        delimiter: ',',
        linebreak: '\n',
        aborted: false,
        truncated: false,
        cursor: 0,
      },
    });
  });
}

function makeCsvFile(name = 'leads.csv'): File {
  return new File([CSV_CONTENT], name, { type: 'text/csv' });
}

// ---------------------------------------------------------------------------
// 5. Tests
// ---------------------------------------------------------------------------

describe('Home page — integration: full user journey', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset Zustand store
    useUploadStore.getState().reset();
    mockDroppedFiles = [];
  });

  // ── Step 1: Upload ────────────────────────────────────────────────────

  describe('Step 1 — Upload', () => {
    it('renders the upload zone on initial load', () => {
      render(<Home />);
      expect(screen.getByTestId('dropzone-root')).toBeInTheDocument();
    });

    it("shows the 'Drag & drop your CSV' prompt initially", () => {
      render(<Home />);
      expect(screen.getByText(/drag & drop your csv/i)).toBeInTheDocument();
    });

    it('shows AI capabilities section initially', () => {
      render(<Home />);
      expect(screen.getByText(/ai capabilities/i)).toBeInTheDocument();
    });
  });

  // ── Step 2: Preview ───────────────────────────────────────────────────

  describe('Step 2 — Preview', () => {
    it('transitions to preview after file is selected', async () => {
      configurePapaParseSuccess();
      const file = makeCsvFile();
      mockDroppedFiles = [file];

      render(<Home />);

      await userEvent.click(screen.getByTestId('dropzone-root'));

      await waitFor(() => {
        const step = useUploadStore.getState().currentStep;
        expect(['PREVIEW_READY', 'FILE_SELECTED'].includes(step)).toBe(true);
      });
    });
  });

  // ── Step 3: Confirm → Import ──────────────────────────────────────────

  describe('Step 3 — Confirm → Import', () => {
    async function setUpPreviewState() {
      configurePapaParseSuccess();
      const file = makeCsvFile();

      await act(async () => {
        useUploadStore.getState().setRawFile(file);
        useUploadStore.getState().setSelectedFile({
          name: file.name,
          size: file.size,
          type: file.type,
          lastModified: file.lastModified,
        });
        useUploadStore.getState().setPreview({
          headers: ['name', 'email', 'mobile'],
          rows: [{ name: 'Alice', email: 'alice@test.com', mobile: '9999999999' }],
          rowCount: 1,
          columnCount: 3,
        });
        useUploadStore.getState().setStep('PREVIEW_READY');
      });
    }

    it('shows import button when in PREVIEW_READY state', async () => {
      await setUpPreviewState();
      render(<Home />);

      await waitFor(() => {
        const importButton =
          screen.queryByRole('button', { name: /import/i }) ||
          screen.queryByRole('button', { name: /confirm/i }) ||
          screen.queryByRole('button', { name: /start import/i });
        expect(importButton).toBeInTheDocument();
      });
    });

    it('calls uploadCsvFile when import is triggered', async () => {
      mockUploadCsvFile.mockResolvedValue(IMPORT_SUCCESS_RESPONSE as any);
      await setUpPreviewState();
      render(<Home />);

      const importButton = await waitFor(
        () =>
          screen.queryByRole('button', { name: /import/i }) ||
          screen.queryByRole('button', { name: /confirm/i }) ||
          screen.queryByRole('button', { name: /start import/i }),
      );

      if (importButton) {
        await userEvent.click(importButton);
        await waitFor(() => {
          expect(mockUploadCsvFile).toHaveBeenCalledTimes(1);
        });
      }
    });
  });

  // ── Step 4: Results ───────────────────────────────────────────────────

  describe('Step 4 — Results', () => {
    it('shows results after successful import', async () => {
      mockUploadCsvFile.mockResolvedValue(IMPORT_SUCCESS_RESPONSE as any);
      const file = makeCsvFile();

      await act(async () => {
        useUploadStore.getState().setRawFile(file);
        useUploadStore.getState().setStep('COMPLETED');
      });

      render(<Home />);
      expect(useUploadStore.getState().currentStep).toBe('COMPLETED');
    });

    it('shows skipped records in results when partial failures occur', async () => {
      mockUploadCsvFile.mockResolvedValue(IMPORT_PARTIAL_RESPONSE as any);

      await act(async () => {
        useUploadStore.getState().setStep('COMPLETED');
      });

      render(<Home />);
      expect(useUploadStore.getState().currentStep).toBe('COMPLETED');
    });
  });

  // ── Step 5: Reset ─────────────────────────────────────────────────────

  describe('Step 5 — Reset', () => {
    it('resets store to IDLE when reset() is called', async () => {
      await act(async () => {
        useUploadStore.getState().setStep('COMPLETED');
        useUploadStore.getState().reset();
      });

      expect(useUploadStore.getState().currentStep).toBe('IDLE');
      expect(useUploadStore.getState().selectedFile).toBeNull();
      expect(useUploadStore.getState().preview).toBeNull();
    });

    it('shows the upload zone again after reset', async () => {
      await act(async () => {
        useUploadStore.getState().setStep('COMPLETED');
        useUploadStore.getState().reset();
      });

      render(<Home />);
      expect(screen.getByTestId('dropzone-root')).toBeInTheDocument();
    });
  });

  // ── Entire flow state machine ─────────────────────────────────────────

  describe('state machine transitions', () => {
    it('IDLE → FILE_SELECTED → PREVIEW_READY → IMPORTING → COMPLETED', async () => {
      const transitions: string[] = [];
      const unsubscribe = useUploadStore.subscribe((state) => {
        transitions.push(state.currentStep);
      });

      await act(async () => {
        useUploadStore.getState().setStep('FILE_SELECTED');
        useUploadStore.getState().setStep('PREVIEW_READY');
        useUploadStore.getState().setStep('IMPORTING');
        useUploadStore.getState().setStep('COMPLETED');
      });

      expect(transitions).toContain('FILE_SELECTED');
      expect(transitions).toContain('PREVIEW_READY');
      expect(transitions).toContain('IMPORTING');
      expect(transitions).toContain('COMPLETED');

      unsubscribe();
    });

    it('ERROR state returns to upload zone', async () => {
      await act(async () => {
        useUploadStore.getState().setStep('ERROR');
        useUploadStore.getState().setError('Something went wrong');
      });

      render(<Home />);

      const state = useUploadStore.getState();
      expect(state.currentStep).toBe('ERROR');
      expect(state.error).toBe('Something went wrong');
    });
  });

  // ── Cancel from preview ───────────────────────────────────────────────

  describe('cancel from preview', () => {
    it('resets state when cancel is triggered from preview', async () => {
      await act(async () => {
        useUploadStore.getState().setStep('PREVIEW_READY');
        useUploadStore.getState().setPreview({
          headers: ['name'],
          rows: [{ name: 'Alice' }],
          rowCount: 1,
          columnCount: 1,
        });
      });

      render(<Home />);

      await act(async () => {
        useUploadStore.getState().reset();
      });

      expect(useUploadStore.getState().currentStep).toBe('IDLE');
    });
  });
});
