import { create } from "zustand";
import { ConverterState } from "../utils/typeDefinitions";

export const useConverterStore = create<ConverterState>((set) => ({
  stage: "idle",

  file: null,
  sourceType: null,
  targetFormat: null,

  outputFile: null,
  error: null,

  setFile: (file) =>
    set({
      file,
      stage: "detecting",
      error: null,
      outputFile: null,
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

  completeConversion: (output) =>
    set({
      stage: "completed",
      outputFile: output,
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
      sourceType: null,
      targetFormat: null,
      outputFile: null,
      error: null,
    }),
}));
