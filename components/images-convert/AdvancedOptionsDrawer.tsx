"use client";

import { ChevronDown, Settings, RotateCw } from "lucide-react";
import { useImageConversionStore } from "@/app/store/useImageConversionStore";
import { IMAGE_FIT_MODES } from "@/app/utils/vars";

export default function AdvancedOptionsDrawer() {
  const {
    showAdvanced,
    toggleShowAdvanced,
    quality,
    setQuality,
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
    grayscale,
    toggleGrayscale,
    stripExif,
    toggleStripExif,
    useBackgroundColor,
    setUseBackgroundColor,
    backgroundColor,
    setBackgroundColor,
  } = useImageConversionStore();

  return (
    <div className="border border-white/8 rounded-xl overflow-hidden bg-white/[0.015]">
      <button
        type="button"
        onClick={toggleShowAdvanced}
        className="w-full flex items-center justify-between px-4 py-3 text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/[0.02] transition-colors cursor-pointer"
      >
        <span className="flex items-center gap-2">
          <Settings className="w-3.5 h-3.5 text-red-400" />
          Advanced Options
        </span>
        <ChevronDown
          className={`w-4 h-4 transition-transform duration-200 ${
            showAdvanced ? "rotate-180" : ""
          }`}
        />
      </button>

      {showAdvanced && (
        <div className="p-4 pt-1 border-t border-white/8 space-y-4">
          {/* Quality Slider with DaisyUI Range */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300">Quality (1% - 100%)</span>
              <span className="badge badge-outline badge-error badge-sm font-mono font-bold">
                {quality}%
              </span>
            </div>
            <input
              type="range"
              min="1"
              max="100"
              value={quality}
              onChange={(e) => setQuality(parseInt(e.target.value, 10))}
              className="range range-error range-xs w-full cursor-pointer"
            />
          </div>

          {/* Resize Options with DaisyUI Select */}
          <div className="space-y-1.5">
            <span className="text-xs text-slate-300">Resize (optional)</span>
            <div className="grid grid-cols-3 gap-2">
              <input
                type="number"
                placeholder="Width"
                value={width ?? ""}
                onChange={(e) =>
                  setDimensions(
                    e.target.value ? parseInt(e.target.value, 10) : null,
                    height
                  )
                }
                className="input input-bordered input-xs w-full bg-black/50 border-white/10 text-white placeholder-slate-500 focus:border-red-500"
              />
              <input
                type="number"
                placeholder="Height"
                value={height ?? ""}
                onChange={(e) =>
                  setDimensions(
                    width,
                    e.target.value ? parseInt(e.target.value, 10) : null
                  )
                }
                className="input input-bordered input-xs w-full bg-black/50 border-white/10 text-white placeholder-slate-500 focus:border-red-500"
              />
              <select
                value={fitMode}
                onChange={(e) => setFitMode(e.target.value as any)}
                className="select select-bordered select-xs w-full bg-black/50 border-white/10 text-white focus:border-red-500 cursor-pointer"
              >
                {IMAGE_FIT_MODES.map((mode) => (
                  <option key={mode.id} value={mode.id} className="bg-[#0d1117]">
                    {mode.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Transformations with DaisyUI Toggles & Tooltips */}
          <div className="space-y-2 pt-1 border-t border-white/8">
            <span className="text-xs text-slate-300 block">Transformations</span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {/* Rotate */}
              <div className="flex items-center justify-between p-2 rounded-lg bg-black/30 border border-white/5">
                <span className="text-slate-400">Rotate ({rotateAngle}°)</span>
                <button
                  type="button"
                  onClick={cycleRotateAngle}
                  className="btn btn-ghost btn-xs p-1 text-white hover:bg-white/10"
                  title="Cycle rotation"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Grayscale with DaisyUI Toggle */}
              <label className="flex items-center justify-between p-2 rounded-lg bg-black/30 border border-white/5 cursor-pointer hover:bg-white/[0.02] transition-colors">
                <span className="text-slate-400">Grayscale</span>
                <input
                  type="checkbox"
                  checked={grayscale}
                  onChange={toggleGrayscale}
                  className="toggle toggle-error toggle-xs"
                />
              </label>

              {/* Horizontal Flip with DaisyUI Toggle */}
              <label className="flex items-center justify-between p-2 rounded-lg bg-black/30 border border-white/5 cursor-pointer hover:bg-white/[0.02] transition-colors">
                <span className="text-slate-400">Horizontal Flip</span>
                <input
                  type="checkbox"
                  checked={flipHorizontal}
                  onChange={toggleFlipHorizontal}
                  className="toggle toggle-error toggle-xs"
                />
              </label>

              {/* Strip EXIF with DaisyUI Toggle */}
              <label className="flex items-center justify-between p-2 rounded-lg bg-black/30 border border-white/5 cursor-pointer hover:bg-white/[0.02] transition-colors">
                <div className="tooltip tooltip-right" data-tip="Remove private GPS & camera metadata">
                  <span className="text-slate-400">Strip EXIF</span>
                </div>
                <input
                  type="checkbox"
                  checked={stripExif}
                  onChange={toggleStripExif}
                  className="toggle toggle-error toggle-xs"
                />
              </label>

              {/* Vertical Flip with DaisyUI Toggle */}
              <label className="flex items-center justify-between p-2 rounded-lg bg-black/30 border border-white/5 cursor-pointer hover:bg-white/[0.02] transition-colors">
                <span className="text-slate-400">Vertical Flip</span>
                <input
                  type="checkbox"
                  checked={flipVertical}
                  onChange={toggleFlipVertical}
                  className="toggle toggle-error toggle-xs"
                />
              </label>

              {/* Background Color with DaisyUI Toggle */}
              <div className="flex items-center justify-between p-2 rounded-lg bg-black/30 border border-white/5">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={useBackgroundColor}
                    onChange={(e) => setUseBackgroundColor(e.target.checked)}
                    className="toggle toggle-error toggle-xs"
                  />
                  <span className="text-slate-400 text-[11px]">BG Color</span>
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="color"
                    value={backgroundColor}
                    onChange={(e) => setBackgroundColor(e.target.value)}
                    disabled={!useBackgroundColor}
                    className="w-5 h-5 rounded cursor-pointer border-none bg-transparent"
                  />
                  <span className="badge badge-ghost badge-xs font-mono">{backgroundColor}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
