import { create } from 'zustand';
import {
  UploadStep,
  SelectedFile,
  PreviewData,
  ImportProgress,
  UploadState,
} from '../types/upload';
import { ImportResult } from '../types/import';

export interface UploadStore extends UploadState {
  readonly setSelectedFile: (file: SelectedFile | null) => void;
  readonly setRawFile: (file: File | null) => void;
  readonly setPreview: (preview: PreviewData | null) => void;
  readonly setProgress: (progress: ImportProgress | null) => void;
  readonly setLoading: (loading: boolean) => void;
  readonly setError: (error: string | null) => void;
  readonly setStep: (step: UploadStep) => void;
  readonly setImportResult: (result: ImportResult | null) => void;
  readonly reset: () => void;
}

const initialState: UploadState = {
  selectedFile: null,
  rawFile: null,
  preview: null,
  progress: null,
  currentStep: 'IDLE',
  loading: false,
  error: null,
  importResult: null,
};

export const useUploadStore = create<UploadStore>((set) => ({
  ...initialState,
  setSelectedFile: (selectedFile) => set({ selectedFile }),
  setRawFile: (rawFile) => set({ rawFile }),
  setPreview: (preview) => set({ preview }),
  setProgress: (progress) => set({ progress }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  setStep: (currentStep) => set({ currentStep }),
  setImportResult: (importResult) => set({ importResult }),
  reset: () => set(initialState),
}));
