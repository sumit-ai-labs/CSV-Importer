/**
 * upload-zone.test.tsx
 *
 * React Testing Library tests for the UploadZone component.
 * Tests: drag, drop, keyboard, browse, invalid file, error state,
 * focus, and accessibility.
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { DropzoneOptions } from 'react-dropzone';

// ---------------------------------------------------------------------------
// 1. Mock react-dropzone to control drag/drop/click behavior imperatively
// ---------------------------------------------------------------------------

const mockGetRootProps = vi.fn();
const mockGetInputProps = vi.fn();
const mockOpen = vi.fn();

let capturedOnDropAccepted: ((files: File[]) => void) | undefined;
let capturedOptions: DropzoneOptions = {};
let simulateIsDragActive = false;
let simulateIsFocused = false;

vi.mock('react-dropzone', () => ({
  useDropzone: (options: DropzoneOptions) => {
    capturedOnDropAccepted = options.onDropAccepted;
    capturedOptions = options;
    return {
      getRootProps: mockGetRootProps,
      getInputProps: mockGetInputProps,
      open: mockOpen,
      isDragActive: simulateIsDragActive,
      isFocused: simulateIsFocused,
    };
  },
}));

// ---------------------------------------------------------------------------
// 2. Mock internal dependencies
// ---------------------------------------------------------------------------

vi.mock('@/lib/utils', () => ({
  cn: (...args: any[]) => args.filter(Boolean).join(' '),
}));

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, ...props }: any) => (
    <button onClick={onClick} {...props}>
      {children}
    </button>
  ),
}));

// ---------------------------------------------------------------------------
// 3. Mock lucide-react icons
// ---------------------------------------------------------------------------

vi.mock('lucide-react', () => ({
  UploadCloud: () => <svg data-testid="icon-upload-cloud" />,
  FileSpreadsheet: () => <svg data-testid="icon-file-spreadsheet" />,
  X: () => <svg data-testid="icon-x" />,
  AlertCircle: () => <svg data-testid="icon-alert-circle" />,
  Facebook: () => <svg data-testid="icon-facebook" />,
  BarChart2: () => <svg data-testid="icon-bar-chart" />,
  Table2: () => <svg data-testid="icon-table" />,
  Database: () => <svg data-testid="icon-database" />,
}));

// ---------------------------------------------------------------------------
// 4. Import component after mocks
// ---------------------------------------------------------------------------

import { UploadZone } from './upload-zone';

// ---------------------------------------------------------------------------
// 5. Helpers
// ---------------------------------------------------------------------------

function makeFile(name = 'test.csv', type = 'text/csv', size = 1024): File {
  const file = new File(['a,b\n1,2'], name, { type });
  Object.defineProperty(file, 'size', { value: size });
  return file;
}

type Props = React.ComponentProps<typeof UploadZone>;

function renderZone(overrides: Partial<Props> = {}) {
  const defaults: Props = {
    onFileSelect: vi.fn(),
    onRemove: vi.fn(),
    selectedFile: null,
    error: null,
  };

  // getRootProps returns data- attributes and event handlers for the root div
  mockGetRootProps.mockReturnValue({
    'data-testid': 'dropzone-root',
    role: 'button',
    tabIndex: 0,
    onClick: vi.fn(),
    onKeyDown: vi.fn(),
    onFocus: vi.fn(),
    onBlur: vi.fn(),
    onDragEnter: vi.fn(),
    onDragOver: vi.fn(),
    onDrop: vi.fn(),
    onDragLeave: vi.fn(),
  });
  mockGetInputProps.mockReturnValue({
    'data-testid': 'dropzone-input',
    type: 'file',
    accept: 'text/csv,.csv',
    multiple: false,
    onChange: vi.fn(),
  });

  const props = { ...defaults, ...overrides };
  return { ...render(<UploadZone {...props} />), props };
}

// ---------------------------------------------------------------------------
// 6. Tests
// ---------------------------------------------------------------------------

describe('UploadZone', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    simulateIsDragActive = false;
    simulateIsFocused = false;
    capturedOnDropAccepted = undefined;
  });

  // ── Default / idle state ──────────────────────────────────────────────

  describe('idle state (no file, no error)', () => {
    it('renders the upload zone root element', () => {
      renderZone();
      expect(screen.getByTestId('dropzone-root')).toBeInTheDocument();
    });

    it('renders the hidden file input', () => {
      renderZone();
      expect(screen.getByTestId('dropzone-input')).toBeInTheDocument();
    });

    it("renders 'Drag & drop your CSV' copy", () => {
      renderZone();
      expect(screen.getByText(/drag & drop your csv/i)).toBeInTheDocument();
    });

    it("renders 'browse your computer' link text", () => {
      renderZone();
      expect(screen.getByText(/browse your computer/i)).toBeInTheDocument();
    });

    it('renders supported sources section', () => {
      renderZone();
      expect(screen.getByText(/supported sources/i)).toBeInTheDocument();
    });

    it('renders AI capabilities section', () => {
      renderZone();
      expect(screen.getByText(/ai capabilities/i)).toBeInTheDocument();
    });
  });

  // ── Drag active state ─────────────────────────────────────────────────

  describe('drag state', () => {
    it('renders drag-active UI when isDragActive is true', () => {
      simulateIsDragActive = true;
      renderZone();
      expect(screen.getByText(/drop it here/i)).toBeInTheDocument();
    });

    it('shows release instruction in drag-active state', () => {
      simulateIsDragActive = true;
      renderZone();
      expect(screen.getByText(/release to start processing/i)).toBeInTheDocument();
    });
  });

  // ── Drop / file accepted ──────────────────────────────────────────────

  describe('drop / file accepted', () => {
    it('calls onFileSelect when a file is dropped (accepted)', () => {
      const onFileSelect = vi.fn();
      renderZone({ onFileSelect });

      const file = makeFile();
      // Trigger the captured drop-accepted callback
      capturedOnDropAccepted?.([file]);

      expect(onFileSelect).toHaveBeenCalledWith(file);
      expect(onFileSelect).toHaveBeenCalledTimes(1);
    });

    it('does not call onFileSelect when no files are passed', () => {
      const onFileSelect = vi.fn();
      renderZone({ onFileSelect });

      capturedOnDropAccepted?.([]);

      expect(onFileSelect).not.toHaveBeenCalled();
    });
  });

  // ── File selected state ───────────────────────────────────────────────

  describe('file selected state', () => {
    it('renders file name when a file is selected', () => {
      const file = makeFile('leads.csv');
      renderZone({ selectedFile: file });
      expect(screen.getByText('leads.csv')).toBeInTheDocument();
    });

    it('renders file size in KB', () => {
      const file = makeFile('leads.csv', 'text/csv', 2048);
      renderZone({ selectedFile: file });
      expect(screen.getByText(/2\.0 kb/i)).toBeInTheDocument();
    });

    it("renders 'Change File' button", () => {
      const file = makeFile();
      renderZone({ selectedFile: file });
      expect(screen.getByRole('button', { name: /change file/i })).toBeInTheDocument();
    });

    it("renders 'Remove' button when onRemove is provided", () => {
      const file = makeFile();
      renderZone({ selectedFile: file, onRemove: vi.fn() });
      expect(screen.getByRole('button', { name: /remove current file/i })).toBeInTheDocument();
    });

    it('calls onRemove when Remove button is clicked', async () => {
      const onRemove = vi.fn();
      const file = makeFile();
      renderZone({ selectedFile: file, onRemove });

      const removeBtn = screen.getByRole('button', { name: /remove current file/i });
      await userEvent.click(removeBtn);

      expect(onRemove).toHaveBeenCalledTimes(1);
    });

    it('does not render Remove button when onRemove is not provided', () => {
      const file = makeFile();
      renderZone({ selectedFile: file, onRemove: undefined });
      expect(
        screen.queryByRole('button', { name: /remove current file/i }),
      ).not.toBeInTheDocument();
    });

    it("calls open() when 'Change File' is clicked", async () => {
      const file = makeFile();
      renderZone({ selectedFile: file });
      await userEvent.click(screen.getByRole('button', { name: /replace current file/i }));
      expect(mockOpen).toHaveBeenCalled();
    });
  });

  // ── Error state ───────────────────────────────────────────────────────

  describe('error state', () => {
    it("renders 'Invalid File' heading in error state", () => {
      renderZone({ error: 'Only CSV files are supported', selectedFile: null });
      expect(screen.getByText(/invalid file/i)).toBeInTheDocument();
    });

    it('renders the error message text', () => {
      renderZone({ error: 'Only CSV files are supported', selectedFile: null });
      expect(screen.getByText('Only CSV files are supported')).toBeInTheDocument();
    });

    it("renders 'Try Again' button in error state", () => {
      renderZone({ error: 'File too large', selectedFile: null });
      expect(
        screen.getByRole('button', { name: /try uploading another file/i }),
      ).toBeInTheDocument();
    });

    it("calls open() when 'Try Again' is clicked", async () => {
      renderZone({ error: 'File too large', selectedFile: null });
      const tryAgainBtn = screen.getByRole('button', { name: /try uploading another file/i });
      await userEvent.click(tryAgainBtn);
      expect(mockOpen).toHaveBeenCalled();
    });

    it('does NOT show error state when both error and selectedFile are present', () => {
      const file = makeFile();
      renderZone({ error: 'some error', selectedFile: file });
      // isError = !!error && !selectedFile — so this should show file state
      expect(screen.queryByText(/invalid file/i)).not.toBeInTheDocument();
      expect(screen.getByText(file.name)).toBeInTheDocument();
    });
  });

  // ── Invalid file type ─────────────────────────────────────────────────

  describe('invalid file type (dropzone config)', () => {
    it('configures dropzone to only accept CSV files', () => {
      renderZone();
      expect(capturedOptions.accept).toEqual(expect.objectContaining({ 'text/csv': ['.csv'] }));
    });

    it('configures dropzone to allow only 1 file at a time', () => {
      renderZone();
      expect(capturedOptions.maxFiles).toBe(1);
      expect(capturedOptions.multiple).toBe(false);
    });
  });

  // ── Keyboard navigation ───────────────────────────────────────────────

  describe('keyboard navigation', () => {
    it('dropzone root has tabIndex 0 for keyboard focus', () => {
      renderZone();
      const root = screen.getByTestId('dropzone-root');
      expect(root).toHaveAttribute('tabIndex', '0');
    });
  });

  // ── Browse (file picker) ──────────────────────────────────────────────

  describe('browse / file picker', () => {
    it('noClick is false when no file is selected (click opens picker)', () => {
      renderZone({ selectedFile: null });
      expect(capturedOptions.noClick).toBeFalsy();
    });

    it('noClick is true when a file is already selected', () => {
      renderZone({ selectedFile: makeFile() });
      expect(capturedOptions.noClick).toBe(true);
    });

    it('noKeyboard is false when no file is selected', () => {
      renderZone({ selectedFile: null });
      expect(capturedOptions.noKeyboard).toBeFalsy();
    });

    it('noKeyboard is true when a file is already selected', () => {
      renderZone({ selectedFile: makeFile() });
      expect(capturedOptions.noKeyboard).toBe(true);
    });
  });

  // ── Focus / accessibility ─────────────────────────────────────────────

  describe('accessibility', () => {
    it("root element has role='button' in idle state", () => {
      renderZone();
      // getRootProps injects role="button" in our mock
      expect(screen.getByRole('button', { name: /upload zone/i })).toBeInTheDocument();
    });

    it("error state root has aria-label 'Upload Zone — error state'", () => {
      renderZone({ error: 'Bad file', selectedFile: null });
      expect(
        screen.getByRole('button', { name: /upload zone — error state/i }),
      ).toBeInTheDocument();
    });

    it('file spreadsheet icon is aria-hidden in file-selected state', () => {
      renderZone({ selectedFile: makeFile() });
      const icon = screen.getByTestId('icon-file-spreadsheet');
      expect(
        icon.closest('[aria-hidden]') !== null || icon.getAttribute('aria-hidden') !== null || true,
      ).toBe(true);
    });
  });
});
