import { create } from "zustand";

export interface ImageMeta {
  width: number;
  height: number;
}

export interface ImageConversionState {
  // ── 1. Upload & File Batch Management ─────────────────────────────────────
  files: File[];
  selectedIndex: number;
  imageMetaMap: Record<number, ImageMeta>;
  addFiles: (newFiles: File[]) => void;
  removeFile: (index: number) => void;
  setSelectedIndex: (index: number) => void;
  setImageMeta: (index: number, meta: ImageMeta) => void;
  clearFiles: () => void;

  // ── 2. Conversion Configuration ───────────────────────────────────────────
  activeTab: "format" | "tools" | "adjustments";
  setActiveTab: (tab: "format" | "tools" | "adjustments") => void;
  selectedFormatId: string;
  setSelectedFormatId: (id: string) => void;

  showAdvanced: boolean;
  setShowAdvanced: (val: boolean) => void;
  toggleShowAdvanced: () => void;

  quality: number;
  setQuality: (quality: number) => void;

  width: number | null;
  height: number | null;
  setDimensions: (width: number | null, height: number | null) => void;

  fitMode: "cover" | "contain" | "fill" | "inside" | "outside";
  setFitMode: (fitMode: "cover" | "contain" | "fill" | "inside" | "outside") => void;

  rotateAngle: "0" | "90" | "180" | "270";
  setRotateAngle: (angle: "0" | "90" | "180" | "270") => void;
  cycleRotateAngle: () => void;

  flipHorizontal: boolean;
  toggleFlipHorizontal: () => void;

  flipVertical: boolean;
  toggleFlipVertical: () => void;

  grayscale: boolean;
  toggleGrayscale: () => void;

  stripExif: boolean;
  toggleStripExif: () => void;

  useBackgroundColor: boolean;
  setUseBackgroundColor: (val: boolean) => void;
  backgroundColor: string;
  setBackgroundColor: (color: string) => void;

  // ── 3. Conversion Output State ────────────────────────────────────────────
  isConverting: boolean;
  setIsConverting: (val: boolean) => void;

  outputBlobUrl: string | null;
  outputFileName: string | null;
  outputSize: number | null;
  outputMeta: ImageMeta | null;
  isBatchZip: boolean;

  showDetails: boolean;
  setShowDetails: (val: boolean) => void;
  toggleShowDetails: () => void;

  setOutput: (data: {
    blobUrl: string;
    fileName: string;
    size: number;
    meta: ImageMeta | null;
    isZip: boolean;
  }) => void;
  clearOutput: () => void;

  // ── 4. Global Reset ───────────────────────────────────────────────────────
  resetOptions: () => void;
  resetAll: () => void;
}

const defaultOptions = {
  activeTab: "format" as const,
  selectedFormatId: "jpg",
  showAdvanced: true,
  quality: 85,
  width: null,
  height: null,
  fitMode: "cover" as const,
  rotateAngle: "0" as const,
  flipHorizontal: false,
  flipVertical: false,
  grayscale: false,
  stripExif: true,
  useBackgroundColor: false,
  backgroundColor: "#ffffff",
};

const defaultOutput = {
  isConverting: false,
  outputBlobUrl: null,
  outputFileName: null,
  outputSize: null,
  outputMeta: null,
  isBatchZip: false,
  showDetails: true,
};

export const useImageConversionStore = create<ImageConversionState>((set) => ({
  // Upload State
  files: [],
  selectedIndex: 0,
  imageMetaMap: {},

  addFiles: (newFiles) =>
    set((state) => {
      const merged = [...state.files, ...newFiles];
      return {
        files: merged,
        selectedIndex: state.files.length === 0 ? 0 : state.selectedIndex,
      };
    }),

  removeFile: (index) =>
    set((state) => {
      const filtered = state.files.filter((_, i) => i !== index);
      const newIndex =
        state.selectedIndex >= filtered.length
          ? Math.max(0, filtered.length - 1)
          : state.selectedIndex;
      return {
        files: filtered,
        selectedIndex: newIndex,
      };
    }),

  setSelectedIndex: (selectedIndex) => set({ selectedIndex }),

  setImageMeta: (index, meta) =>
    set((state) => ({
      imageMetaMap: { ...state.imageMetaMap, [index]: meta },
    })),

  clearFiles: () =>
    set({
      files: [],
      selectedIndex: 0,
      imageMetaMap: {},
    }),

  // Options State
  ...defaultOptions,

  setActiveTab: (activeTab) => set({ activeTab }),
  setSelectedFormatId: (selectedFormatId) => set({ selectedFormatId }),
  setShowAdvanced: (showAdvanced) => set({ showAdvanced }),
  toggleShowAdvanced: () => set((state) => ({ showAdvanced: !state.showAdvanced })),

  setQuality: (quality) => set({ quality }),
  setDimensions: (width, height) => set({ width, height }),
  setFitMode: (fitMode) => set({ fitMode }),
  setRotateAngle: (rotateAngle) => set({ rotateAngle }),
  cycleRotateAngle: () =>
    set((state) => {
      const angles: ("0" | "90" | "180" | "270")[] = ["0", "90", "180", "270"];
      const nextIndex = (angles.indexOf(state.rotateAngle) + 1) % angles.length;
      return { rotateAngle: angles[nextIndex] };
    }),

  toggleFlipHorizontal: () =>
    set((state) => ({ flipHorizontal: !state.flipHorizontal })),
  toggleFlipVertical: () =>
    set((state) => ({ flipVertical: !state.flipVertical })),
  toggleGrayscale: () =>
    set((state) => ({ grayscale: !state.grayscale })),
  toggleStripExif: () =>
    set((state) => ({ stripExif: !state.stripExif })),
  setUseBackgroundColor: (useBackgroundColor) =>
    set({ useBackgroundColor }),
  setBackgroundColor: (backgroundColor) => set({ backgroundColor }),

  // Output State
  ...defaultOutput,

  setIsConverting: (isConverting) => set({ isConverting }),

  setShowDetails: (showDetails) => set({ showDetails }),
  toggleShowDetails: () => set((state) => ({ showDetails: !state.showDetails })),

  setOutput: ({ blobUrl, fileName, size, meta, isZip }) =>
    set({
      outputBlobUrl: blobUrl,
      outputFileName: fileName,
      outputSize: size,
      outputMeta: meta,
      isBatchZip: isZip,
      isConverting: false,
    }),

  clearOutput: () => set(defaultOutput),

  resetOptions: () => set(defaultOptions),

  resetAll: () =>
    set({
      files: [],
      selectedIndex: 0,
      imageMetaMap: {},
      ...defaultOptions,
      ...defaultOutput,
    }),
}));
