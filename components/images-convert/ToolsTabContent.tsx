"use client";

import { Scaling, RotateCw, FlipHorizontal, FlipVertical, ShieldCheck, Undo2 } from "lucide-react";
import { useImageConversionStore } from "@/app/store/useImageConversionStore";
import { IMAGE_FIT_MODES } from "@/app/utils/vars";

export default function ToolsTabContent() {
  const {
    width,
    height,
    setDimensions,
    fitMode,
    setFitMode,
    rotateAngle,
    cycleRotateAngle,
    flipHorizontal,
    toggleFlipHorizontal,
    flipVertical,
    toggleFlipVertical,
    stripExif,
    toggleStripExif,
  } = useImageConversionStore();

  const handleApplyPreset = (w: number | null, h: number | null) => {
    setDimensions(w, h);
  };

  return (
    <div className="space-y-4">
      {/* 1. Resize & Aspect Ratio Control */}
      <div className="p-4 rounded-xl bg-white/[0.02] border border-white/8 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Scaling className="w-3.5 h-3.5 text-red-400" />
            <span className="text-xs font-semibold text-white">Resize &amp; Dimensions</span>
          </div>
          {(width || height) && (
            <button
              type="button"
              onClick={() => handleApplyPreset(null, null)}
              className="text-[11px] text-slate-400 hover:text-red-400 flex items-center gap-1 cursor-pointer transition-colors"
            >
              <Undo2 className="w-3 h-3" />
              Reset size
            </button>
          )}
        </div>

        {/* Width, Height & Fit Mode Inputs */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[10px] text-slate-400 block mb-1">Width (px)</label>
            <input
              type="number"
              placeholder="Auto width"
              value={width ?? ""}
              onChange={(e) =>
                setDimensions(
                  e.target.value ? parseInt(e.target.value, 10) : null,
                  height
                )
              }
              className="input input-bordered input-sm w-full bg-black/40 border-white/10 text-white placeholder-slate-500 focus:border-red-500 text-xs font-mono"
            />
          </div>
          <div>
            <label className="text-[10px] text-slate-400 block mb-1">Height (px)</label>
            <input
              type="number"
              placeholder="Auto height"
              value={height ?? ""}
              onChange={(e) =>
                setDimensions(
                  width,
                  e.target.value ? parseInt(e.target.value, 10) : null
                )
              }
              className="input input-bordered input-sm w-full bg-black/40 border-white/10 text-white placeholder-slate-500 focus:border-red-500 text-xs font-mono"
            />
          </div>
        </div>

        {/* Fit Mode Selector with Contain as default */}
        <div>
          <label className="text-[10px] text-slate-400 block mb-1">Fit Behavior</label>
          <select
            value={fitMode}
            onChange={(e) => setFitMode(e.target.value as any)}
            className="select select-bordered select-sm w-full bg-black/40 border-white/10 text-white focus:border-red-500 text-xs cursor-pointer"
          >
            {IMAGE_FIT_MODES.map((mode) => (
              <option key={mode.id} value={mode.id} className="bg-[#0d1117]">
                {mode.label}
              </option>
            ))}
          </select>
        </div>

        {/* Quick Resolution Presets */}
        <div className="pt-1 border-t border-white/5">
          <span className="text-[10px] text-slate-500 block mb-1.5 font-medium">Quick Presets</span>
          <div className="flex flex-wrap gap-1.5">
            {[
              { label: "1080p (FHD)", w: 1920, h: 1080 },
              { label: "720p (HD)", w: 1280, h: 720 },
              { label: "Square (1:1)", w: 1080, h: 1080 },
              { label: "Avatar (512px)", w: 512, h: 512 },
            ].map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => handleApplyPreset(preset.w, preset.h)}
                className={`px-2 py-1 rounded text-[10px] font-medium border transition-colors cursor-pointer ${
                  width === preset.w && height === preset.h
                    ? "bg-red-500/20 text-red-400 border-red-500/40 font-semibold"
                    : "bg-white/[0.02] border-white/8 text-slate-300 hover:text-white hover:bg-white/5"
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 2. Orientation & Transformations */}
      <div className="p-4 rounded-xl bg-white/[0.02] border border-white/8 space-y-3">
        <div className="flex items-center gap-2">
          <RotateCw className="w-3.5 h-3.5 text-red-400" />
          <span className="text-xs font-semibold text-white">Orientation &amp; Flipping</span>
        </div>

        <div className="grid grid-cols-3 gap-2 text-xs">
          {/* Rotate Button */}
          <button
            type="button"
            onClick={cycleRotateAngle}
            className={`p-2.5 rounded-lg border flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
              rotateAngle !== "0"
                ? "bg-red-500/15 border-red-500/40 text-red-400"
                : "bg-black/30 border-white/5 text-slate-300 hover:text-white hover:bg-white/5"
            }`}
          >
            <RotateCw className="w-4 h-4" />
            <span className="text-[11px] font-medium">Rotate {rotateAngle}°</span>
          </button>

          {/* Flip Horizontal */}
          <button
            type="button"
            onClick={toggleFlipHorizontal}
            className={`p-2.5 rounded-lg border flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
              flipHorizontal
                ? "bg-red-500/15 border-red-500/40 text-red-400"
                : "bg-black/30 border-white/5 text-slate-300 hover:text-white hover:bg-white/5"
            }`}
          >
            <FlipHorizontal className="w-4 h-4" />
            <span className="text-[11px] font-medium">Flip H</span>
          </button>

          {/* Flip Vertical */}
          <button
            type="button"
            onClick={toggleFlipVertical}
            className={`p-2.5 rounded-lg border flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
              flipVertical
                ? "bg-red-500/15 border-red-500/40 text-red-400"
                : "bg-black/30 border-white/5 text-slate-300 hover:text-white hover:bg-white/5"
            }`}
          >
            <FlipVertical className="w-4 h-4" />
            <span className="text-[11px] font-medium">Flip V</span>
          </button>
        </div>
      </div>

      {/* 3. Metadata & Privacy */}
      <div className="p-4 rounded-xl bg-white/[0.02] border border-white/8 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-xs font-semibold text-white">Privacy &amp; Metadata</span>
          </div>
          <input
            type="checkbox"
            checked={stripExif}
            onChange={toggleStripExif}
            className="toggle toggle-error toggle-xs cursor-pointer"
          />
        </div>
        <p className="text-[11px] text-slate-400 leading-relaxed">
          Strip sensitive EXIF metadata (camera model, GPS coordinates, exposure time, device serials).
        </p>
      </div>
    </div>
  );
}
