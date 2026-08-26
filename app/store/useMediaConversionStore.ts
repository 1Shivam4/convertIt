import { create } from "zustand";

export interface MediaConversionState {
  selectedFormatId: string;
  resolution: "original" | "1080p" | "720p" | "480p" | "360p";
  videoBitrate: "auto" | "1m" | "2.5m" | "5m" | "8m";
  audioBitrate: "auto" | "128k" | "192k" | "320k";
  fps: number;
  startTime: string;
  endTime: string;
  muteAudio: boolean;
  speedFactor: number;

  // Actions
  setSelectedFormatId: (id: string) => void;
  setResolution: (res: "original" | "1080p" | "720p" | "480p" | "360p") => void;
  setVideoBitrate: (bitrate: "auto" | "1m" | "2.5m" | "5m" | "8m") => void;
  setAudioBitrate: (bitrate: "auto" | "128k" | "192k" | "320k") => void;
  setFps: (fps: number) => void;
  setStartTime: (time: string) => void;
  setEndTime: (time: string) => void;
  setMuteAudio: (mute: boolean) => void;
  setSpeedFactor: (speed: number) => void;
  resetOptions: () => void;
}

const defaultOptions = {
  selectedFormatId: "mp4",
  resolution: "original" as const,
  videoBitrate: "auto" as const,
  audioBitrate: "auto" as const,
  fps: 0,
  startTime: "",
  endTime: "",
  muteAudio: false,
  speedFactor: 1.0,
};

export const useMediaConversionStore = create<MediaConversionState>((set) => ({
  ...defaultOptions,

  setSelectedFormatId: (selectedFormatId) => set({ selectedFormatId }),
  setResolution: (resolution) => set({ resolution }),
  setVideoBitrate: (videoBitrate) => set({ videoBitrate }),
  setAudioBitrate: (audioBitrate) => set({ audioBitrate }),
  setFps: (fps) => set({ fps }),
  setStartTime: (startTime) => set({ startTime }),
  setEndTime: (endTime) => set({ endTime }),
  setMuteAudio: (muteAudio) => set({ muteAudio }),
  setSpeedFactor: (speedFactor) => set({ speedFactor }),
  resetOptions: () => set({ ...defaultOptions }),
}));
