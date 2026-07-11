/**
 * upload.store.test.ts
 *
 * Unit tests for frontend/src/store/upload.store.ts (Zustand store)
 *
 * Tests: initial state, setFile, setPreview, setProgress, setStep,
 * setLoading, setError, reset, immutability, and selector behaviour.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { act } from '@testing-library/react';
import { useUploadStore } from './upload.store';
import type { SelectedFile, PreviewData, ImportProgress } from '../types/upload';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Hard-resets the store to initial state before each test. */
function resetStore() {
  useUploadStore.getState().reset();
}

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const selectedFileFix: SelectedFile = {
  name: 'leads.csv',
  size: 4096,
  type: 'text/csv',
  lastModified: 1700000000000,
};

const rawFileFix = new File(['name,email\nAlice,alice@test.com\n'], 'leads.csv', {
  type: 'text/csv',
});

const previewFix: PreviewData = {
  headers: ['name', 'email'],
  rows: [{ name: 'Alice', email: 'alice@test.com' }],
  rowCount: 1,
  columnCount: 2,
};

const progressFix: ImportProgress = {
  totalBatches: 5,
  completedBatches: 2,
  percentage: 40,
  status: 'Processing batch 2 of 5...',
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useUploadStore', () => {
  beforeEach(resetStore);

  // ── Initial state ─────────────────────────────────────────────────────

  describe('initial state', () => {
    it('has null selectedFile', () => {
      expect(useUploadStore.getState().selectedFile).toBeNull();
    });

    it('has null rawFile', () => {
      expect(useUploadStore.getState().rawFile).toBeNull();
    });

    it('has null preview', () => {
      expect(useUploadStore.getState().preview).toBeNull();
    });

    it('has null progress', () => {
      expect(useUploadStore.getState().progress).toBeNull();
    });

    it('has IDLE currentStep', () => {
      expect(useUploadStore.getState().currentStep).toBe('IDLE');
    });

    it('has loading: false', () => {
      expect(useUploadStore.getState().loading).toBe(false);
    });

    it('has null error', () => {
      expect(useUploadStore.getState().error).toBeNull();
    });
  });

  // ── setSelectedFile ───────────────────────────────────────────────────

  describe('setSelectedFile', () => {
    it('updates selectedFile with the provided value', () => {
      act(() => useUploadStore.getState().setSelectedFile(selectedFileFix));
      expect(useUploadStore.getState().selectedFile).toEqual(selectedFileFix);
    });

    it('sets selectedFile to null when called with null', () => {
      act(() => {
        useUploadStore.getState().setSelectedFile(selectedFileFix);
        useUploadStore.getState().setSelectedFile(null);
      });
      expect(useUploadStore.getState().selectedFile).toBeNull();
    });

    it('preserves other state fields when setting selectedFile', () => {
      act(() => {
        useUploadStore.getState().setStep('FILE_SELECTED');
        useUploadStore.getState().setSelectedFile(selectedFileFix);
      });
      expect(useUploadStore.getState().currentStep).toBe('FILE_SELECTED');
    });
  });

  // ── setRawFile ────────────────────────────────────────────────────────

  describe('setRawFile', () => {
    it('stores the raw File object', () => {
      act(() => useUploadStore.getState().setRawFile(rawFileFix));
      expect(useUploadStore.getState().rawFile).toBe(rawFileFix);
    });

    it('clears rawFile when called with null', () => {
      act(() => {
        useUploadStore.getState().setRawFile(rawFileFix);
        useUploadStore.getState().setRawFile(null);
      });
      expect(useUploadStore.getState().rawFile).toBeNull();
    });
  });

  // ── setPreview ────────────────────────────────────────────────────────

  describe('setPreview', () => {
    it('stores preview data correctly', () => {
      act(() => useUploadStore.getState().setPreview(previewFix));
      expect(useUploadStore.getState().preview).toEqual(previewFix);
    });

    it('stores headers and rows correctly', () => {
      act(() => useUploadStore.getState().setPreview(previewFix));
      const { preview } = useUploadStore.getState();
      expect(preview?.headers).toEqual(['name', 'email']);
      expect(preview?.rows).toHaveLength(1);
    });

    it('clears preview when called with null', () => {
      act(() => {
        useUploadStore.getState().setPreview(previewFix);
        useUploadStore.getState().setPreview(null);
      });
      expect(useUploadStore.getState().preview).toBeNull();
    });
  });

  // ── setProgress ───────────────────────────────────────────────────────

  describe('setProgress', () => {
    it('stores import progress data', () => {
      act(() => useUploadStore.getState().setProgress(progressFix));
      expect(useUploadStore.getState().progress).toEqual(progressFix);
    });

    it('updates percentage correctly', () => {
      act(() => useUploadStore.getState().setProgress({ ...progressFix, percentage: 80 }));
      expect(useUploadStore.getState().progress?.percentage).toBe(80);
    });

    it('clears progress when called with null', () => {
      act(() => {
        useUploadStore.getState().setProgress(progressFix);
        useUploadStore.getState().setProgress(null);
      });
      expect(useUploadStore.getState().progress).toBeNull();
    });
  });

  // ── setStep ───────────────────────────────────────────────────────────

  describe('setStep', () => {
    const steps = [
      'IDLE',
      'FILE_SELECTED',
      'PREVIEW_READY',
      'IMPORTING',
      'COMPLETED',
      'ERROR',
    ] as const;

    steps.forEach((step) => {
      it(`can set step to ${step}`, () => {
        act(() => useUploadStore.getState().setStep(step));
        expect(useUploadStore.getState().currentStep).toBe(step);
      });
    });
  });

  // ── setLoading ────────────────────────────────────────────────────────

  describe('setLoading', () => {
    it('sets loading to true', () => {
      act(() => useUploadStore.getState().setLoading(true));
      expect(useUploadStore.getState().loading).toBe(true);
    });

    it('sets loading to false', () => {
      act(() => {
        useUploadStore.getState().setLoading(true);
        useUploadStore.getState().setLoading(false);
      });
      expect(useUploadStore.getState().loading).toBe(false);
    });
  });

  // ── setError ──────────────────────────────────────────────────────────

  describe('setError', () => {
    it('stores an error message', () => {
      act(() => useUploadStore.getState().setError('File too large'));
      expect(useUploadStore.getState().error).toBe('File too large');
    });

    it('clears the error when called with null', () => {
      act(() => {
        useUploadStore.getState().setError('Some error');
        useUploadStore.getState().setError(null);
      });
      expect(useUploadStore.getState().error).toBeNull();
    });
  });

  // ── reset ─────────────────────────────────────────────────────────────

  describe('reset', () => {
    it('resets all state to initial values', () => {
      act(() => {
        useUploadStore.getState().setSelectedFile(selectedFileFix);
        useUploadStore.getState().setRawFile(rawFileFix);
        useUploadStore.getState().setPreview(previewFix);
        useUploadStore.getState().setProgress(progressFix);
        useUploadStore.getState().setStep('COMPLETED');
        useUploadStore.getState().setLoading(true);
        useUploadStore.getState().setError('Some error');
        useUploadStore.getState().reset();
      });

      const state = useUploadStore.getState();
      expect(state.selectedFile).toBeNull();
      expect(state.rawFile).toBeNull();
      expect(state.preview).toBeNull();
      expect(state.progress).toBeNull();
      expect(state.currentStep).toBe('IDLE');
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
    });

    it('preserves the action methods after reset', () => {
      act(() => useUploadStore.getState().reset());
      expect(typeof useUploadStore.getState().setSelectedFile).toBe('function');
      expect(typeof useUploadStore.getState().setStep).toBe('function');
    });
  });

  // ── Immutability ──────────────────────────────────────────────────────

  describe('immutability', () => {
    it('each state update produces a new state reference', () => {
      const state1 = useUploadStore.getState();
      act(() => useUploadStore.getState().setStep('FILE_SELECTED'));
      const state2 = useUploadStore.getState();
      // Zustand creates a new state object on each set()
      expect(state1).not.toBe(state2);
    });

    it('unrelated fields are not mutated by a targeted setter', () => {
      act(() => useUploadStore.getState().setLoading(true));
      expect(useUploadStore.getState().error).toBeNull();
      expect(useUploadStore.getState().currentStep).toBe('IDLE');
    });
  });

  // ── Selectors ─────────────────────────────────────────────────────────

  describe('selectors (derived state via getState)', () => {
    it('selectedFile selector returns correct value after update', () => {
      act(() => useUploadStore.getState().setSelectedFile(selectedFileFix));
      const { selectedFile } = useUploadStore.getState();
      expect(selectedFile?.name).toBe('leads.csv');
      expect(selectedFile?.size).toBe(4096);
    });

    it('preview selector returns correct rowCount', () => {
      act(() => useUploadStore.getState().setPreview(previewFix));
      const { preview } = useUploadStore.getState();
      expect(preview?.rowCount).toBe(1);
      expect(preview?.columnCount).toBe(2);
    });

    it('progress selector returns correct percentage', () => {
      act(() => useUploadStore.getState().setProgress(progressFix));
      const { progress } = useUploadStore.getState();
      expect(progress?.percentage).toBe(40);
      expect(progress?.completedBatches).toBe(2);
    });
  });
});
