import { create } from "zustand";
import { ConverterState } from "../utils/typeDefinitions";

export const useConverterStore = create<ConverterState>((set) => ({
  stage: "idle",

  file: null,
  files: [],
  sourceType: null,
  targetFormat: null,

  outputFile: null,
  outputFileName: null,
  error: null,

  setFile: (file) =>
    set({
      file,
      files: [file],
      stage: "detecting",
      error: null,
      outputFile: null,
      outputFileName: null,
    }),

  addFiles: (newFiles) =>
    set((state) => {
      const updatedFiles = [...state.files, ...newFiles];
      return {
        files: updatedFiles,
        file: updatedFiles[0] || null,
        stage: state.stage === "idle" ? "ready" : state.stage,
      };
    }),

  removeFile: (index) =>
    set((state) => {
      const updatedFiles = state.files.filter((_, i) => i !== index);
      return {
        files: updatedFiles,
        file: updatedFiles[0] || null,
        stage: updatedFiles.length === 0 ? "idle" : state.stage,
      };
    }),

  reorderFiles: (fromIndex, toIndex) =>
    set((state) => {
      const updatedFiles = [...state.files];
      const [moved] = updatedFiles.splice(fromIndex, 1);
      updatedFiles.splice(toIndex, 0, moved);
      return {
        files: updatedFiles,
        file: updatedFiles[0] || null,
      };
    }),

  setSourceType: (type) =>
    set({
      sourceType: type,
      stage: "ready",
    }),

  setTargetFormat: (format) =>
    set({
      targetFormat: format,
    }),

  startDetection: () =>
    set({
      stage: "detecting",
      error: null,
    }),

  startConversion: () =>
    set({
      stage: "converting",
      error: null,
    }),

  completeConversion: (output, fileName) =>
    set({
      stage: "completed",
      outputFile: output,
      outputFileName: fileName || null,
    }),

  setError: (error) =>
    set({
      stage: "error",
      error,
    }),

  reset: () =>
    set({
      stage: "idle",
      file: null,
      files: [],
      sourceType: null,
      targetFormat: null,
      outputFile: null,
      outputFileName: null,
      error: null,
    }),

  resetConversion: () =>
    set({
      stage: "ready",
      outputFile: null,
      outputFileName: null,
      error: null,
    }),
}));
