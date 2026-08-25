import { create } from "zustand";

export interface ImageConversionState {
  selectedFormatId: string;
  quality: number;
  width: number | null;
  height: number | null;
  fitMode: "cover" | "contain" | "fill" | "inside" | "outside";
  rotateAngle: "0" | "90" | "180" | "270";
  flipHorizontal: boolean;
  flipVertical: boolean;
  grayscale: boolean;
  stripExif: boolean;
  backgroundColor: string;

  setSelectedFormatId: (id: string) => void;
  setQuality: (quality: number) => void;
  setDimensions: (width: number | null, height: number | null) => void;
  setFitMode: (fitMode: "cover" | "contain" | "fill" | "inside" | "outside") => void;
  setRotateAngle: (angle: "0" | "90" | "180" | "270") => void;
  toggleFlipHorizontal: () => void;
  toggleFlipVertical: () => void;
  toggleGrayscale: () => void;
  toggleStripExif: () => void;
  setBackgroundColor: (color: string) => void;
  resetOptions: () => void;
}

const defaultState = {
  selectedFormatId: "jpg",
  quality: 85,
  width: null,
  height: null,
  fitMode: "cover" as const,
  rotateAngle: "0" as const,
  flipHorizontal: false,
  flipVertical: false,
  grayscale: false,
  stripExif: true,
  backgroundColor: "#ffffff",
};

export const useImageConversionStore = create<ImageConversionState>((set) => ({
  ...defaultState,

  setSelectedFormatId: (selectedFormatId) => set({ selectedFormatId }),
  setQuality: (quality) => set({ quality }),
  setDimensions: (width, height) => set({ width, height }),
  setFitMode: (fitMode) => set({ fitMode }),
  setRotateAngle: (rotateAngle) => set({ rotateAngle }),
  toggleFlipHorizontal: () =>
    set((state) => ({ flipHorizontal: !state.flipHorizontal })),
  toggleFlipVertical: () =>
    set((state) => ({ flipVertical: !state.flipVertical })),
  toggleGrayscale: () => set((state) => ({ grayscale: !state.grayscale })),
  toggleStripExif: () => set((state) => ({ stripExif: !state.stripExif })),
  setBackgroundColor: (backgroundColor) => set({ backgroundColor }),
  resetOptions: () => set(defaultState),
}));
