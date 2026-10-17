import { create } from "zustand";
import { ConverterStage } from "../utils/typeDefinitions";

export interface PDFConversionState {
  // ── 1. Upload & Multi-File Batch Management ───────────────────────────────
  files: File[];
  file: File | null;
  selectedIndex: number;
  stage: ConverterStage;

  setFile: (file: File | null) => void;
  addFiles: (newFiles: File[]) => void;
  removeFile: (index: number) => void;
  reorderFiles: (fromIndex: number, toIndex: number) => void;
  setSelectedIndex: (index: number) => void;
  clearFiles: () => void;

  // ── 2. Conversion Configuration ───────────────────────────────────────────
  selectedFormatId: string;
  setSelectedFormatId: (id: string) => void;

  activeCategory: "all" | "document" | "tools";
  setActiveCategory: (cat: "all" | "document" | "tools") => void;

  rotateAngle: "90" | "180" | "270";
  setRotateAngle: (angle: "90" | "180" | "270") => void;

  pdfaVersion: "PDF/A-1b" | "PDF/A-2b" | "PDF/A-3b";
  setPdfaVersion: (ver: "PDF/A-1b" | "PDF/A-2b" | "PDF/A-3b") => void;

  password: string;
  setPassword: (password: string) => void;

  splitSpan: string;
  setSplitSpan: (span: string) => void;

  watermarkText: string;
  setWatermarkText: (text: string) => void;

  htmlContent: string;
  setHtmlContent: (html: string) => void;

  markdownContent: string;
  setMarkdownContent: (md: string) => void;

  stampFile: File | null;
  setStampFile: (stamp: File | null) => void;

  // ── 3. Page Manipulations (Visual Grid) ────────────────────────────────────
  pageRotations: Record<number, number>;
  deletedPages: number[];
  selectedPages: number[];
  setPageManipulations: (data: {
    pageRotations: Record<number, number>;
    deletedPages: number[];
    selectedPages: number[];
  }) => void;
  resetPageManipulations: () => void;

  // ── 4. BullMQ Queue, Parallelism & Concurrency Settings ───────────────────
  concurrency: number; // Max parallel operations in batch mode (1 to 5)
  setConcurrency: (limit: number) => void;

  useQueue: boolean; // Force asynchronous BullMQ queuing
  setUseQueue: (val: boolean) => void;

  jobId: string | null;
  setJobId: (id: string | null) => void;

  jobStatus: "QUEUED" | "PROCESSING" | "COMPLETED" | "FAILED" | null;
  setJobStatus: (status: "QUEUED" | "PROCESSING" | "COMPLETED" | "FAILED" | null) => void;

  progress: number; // 0 - 100
  setProgress: (percent: number) => void;

  batchProgress: { total: number; completed: number; failed: number };
  setBatchProgress: (prog: { total: number; completed: number; failed: number }) => void;

  // ── 5. Output & Error State ───────────────────────────────────────────────
  outputFile: Blob | null;
  outputBlobUrl: string | null;
  outputFileName: string | null;
  outputSize: number | null;
  error: string | null;

  startConversion: () => void;
  completeConversion: (output: Blob, fileName?: string) => void;
  setError: (err: string | null) => void;
  resetConversion: () => void;
  resetAll: () => void;
}

const defaultOptions = {
  selectedFormatId: "compress",
  activeCategory: "all" as const,
  rotateAngle: "90" as const,
  pdfaVersion: "PDF/A-1b" as const,
  password: "",
  splitSpan: "",
  watermarkText: "CONFIDENTIAL",
  htmlContent: "",
  markdownContent: "",
  stampFile: null,
  pageRotations: {},
  deletedPages: [],
  selectedPages: [],
  concurrency: 3,
  useQueue: false,
  jobId: null,
  jobStatus: null,
  progress: 0,
  batchProgress: { total: 0, completed: 0, failed: 0 },
};

export const usePDFConversionStore = create<PDFConversionState>((set, get) => ({
  files: [],
  file: null,
  selectedIndex: 0,
  stage: "idle",

  ...defaultOptions,

  outputFile: null,
  outputBlobUrl: null,
  outputFileName: null,
  outputSize: null,
  error: null,

  setFile: (file) => {
    if (get().outputBlobUrl) {
      URL.revokeObjectURL(get().outputBlobUrl!);
    }
    set({
      file,
      files: file ? [file] : [],
      selectedIndex: 0,
      stage: file ? "ready" : "idle",
      error: null,
      outputFile: null,
      outputBlobUrl: null,
      outputFileName: null,
      outputSize: null,
    });
  },

  addFiles: (newFiles) => {
    const current = get().files;
    const combined = [...current, ...newFiles];
    set({
      files: combined,
      file: combined[0] || null,
      stage: combined.length > 0 ? "ready" : "idle",
      error: null,
    });
  },

  removeFile: (index) => {
    const updated = get().files.filter((_, i) => i !== index);
    const newIdx = Math.max(0, Math.min(get().selectedIndex, updated.length - 1));
    set({
      files: updated,
      file: updated[newIdx] || null,
      selectedIndex: newIdx,
      stage: updated.length === 0 ? "idle" : get().stage,
    });
  },

  reorderFiles: (fromIndex, toIndex) => {
    const updated = [...get().files];
    const [moved] = updated.splice(fromIndex, 1);
    updated.splice(toIndex, 0, moved);
    set({
      files: updated,
      file: updated[0] || null,
    });
  },

  setSelectedIndex: (index) => {
    const f = get().files[index] || null;
    set({ selectedIndex: index, file: f });
  },

  clearFiles: () => {
    if (get().outputBlobUrl) {
      URL.revokeObjectURL(get().outputBlobUrl!);
    }
    set({
      files: [],
      file: null,
      selectedIndex: 0,
      stage: "idle",
      outputFile: null,
      outputBlobUrl: null,
      outputFileName: null,
      outputSize: null,
      error: null,
    });
  },

  setSelectedFormatId: (id) => set({ selectedFormatId: id }),
  setActiveCategory: (cat) => set({ activeCategory: cat }),
  setRotateAngle: (angle) => set({ rotateAngle: angle }),
  setPdfaVersion: (ver) => set({ pdfaVersion: ver }),
  setPassword: (password) => set({ password }),
  setSplitSpan: (span) => set({ splitSpan: span }),
  setWatermarkText: (text) => set({ watermarkText: text }),
  setHtmlContent: (html) => set({ htmlContent: html }),
  setMarkdownContent: (md) => set({ markdownContent: md }),
  setStampFile: (stamp) => set({ stampFile: stamp }),

  setPageManipulations: (data) =>
    set({
      pageRotations: data.pageRotations,
      deletedPages: data.deletedPages,
      selectedPages: data.selectedPages,
    }),

  resetPageManipulations: () =>
    set({
      pageRotations: {},
      deletedPages: [],
      selectedPages: [],
    }),

  setConcurrency: (limit) => set({ concurrency: Math.max(1, Math.min(5, limit)) }),
  setUseQueue: (val) => set({ useQueue: val }),
  setJobId: (id) => set({ jobId: id }),
  setJobStatus: (status) => set({ jobStatus: status }),
  setProgress: (percent) => set({ progress: percent }),
  setBatchProgress: (prog) => set({ batchProgress: prog }),

  startConversion: () =>
    set({
      stage: "converting",
      error: null,
      progress: 0,
      jobStatus: get().useQueue ? "QUEUED" : null,
    }),

  completeConversion: (output, fileName) => {
    if (get().outputBlobUrl) {
      URL.revokeObjectURL(get().outputBlobUrl!);
    }
    const url = URL.createObjectURL(output);
    set({
      stage: "completed",
      outputFile: output,
      outputBlobUrl: url,
      outputFileName: fileName || null,
      outputSize: output.size,
      error: null,
      progress: 100,
      jobStatus: "COMPLETED",
    });
  },

  setError: (err) =>
    set({
      stage: err ? "error" : get().stage,
      error: err,
      jobStatus: err ? "FAILED" : get().jobStatus,
    }),

  resetConversion: () => {
    if (get().outputBlobUrl) {
      URL.revokeObjectURL(get().outputBlobUrl!);
    }
    set({
      stage: get().file ? "ready" : "idle",
      outputFile: null,
      outputBlobUrl: null,
      outputFileName: null,
      outputSize: null,
      error: null,
      progress: 0,
      jobId: null,
      jobStatus: null,
    });
  },

  resetAll: () => {
    if (get().outputBlobUrl) {
      URL.revokeObjectURL(get().outputBlobUrl!);
    }
    set({
      files: [],
      file: null,
      selectedIndex: 0,
      stage: "idle",
      outputFile: null,
      outputBlobUrl: null,
      outputFileName: null,
      outputSize: null,
      error: null,
      ...defaultOptions,
    });
  },
}));

// Backwards compatibility alias for components referencing useFileConversion
export const useFileConversion = usePDFConversionStore;
