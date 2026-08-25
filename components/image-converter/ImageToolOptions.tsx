"use client";

import { Sliders, RotateCw, FlipHorizontal, FlipVertical, Image as ImageIcon, Shield, Palette } from "lucide-react";
import { IMAGE_FIT_MODES } from "@/app/utils/vars";
import { useImageConversionStore } from "@/app/store/useImageConversionStore";

interface ImageToolOptionsProps {
  disabled?: boolean;
}

export default function ImageToolOptions({ disabled = false }: ImageToolOptionsProps) {
  const {
    selectedFormatId,
    quality,
    width,
    height,
    fitMode,
    rotateAngle,
    flipHorizontal,
    flipVertical,
    grayscale,
    stripExif,
    backgroundColor,
    setQuality,
    setDimensions,
    setFitMode,
    setRotateAngle,
    toggleFlipHorizontal,
    toggleFlipVertical,
    toggleGrayscale,
    toggleStripExif,
    setBackgroundColor,
  } = useImageConversionStore();

  const isJpgOrBmp = selectedFormatId === "jpg" || selectedFormatId === "bmp";
  const supportsQuality = ["jpg", "webp", "avif", "tiff", "compress-image"].includes(selectedFormatId);

  return (
    <div className="space-y-5 bg-white/5 border border-white/10 rounded-xl p-4">
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <Sliders className="w-4 h-4 text-blue-400" />
          Image Transformations & Quality Options
        </h3>
        <span className="text-[11px] text-slate-400 font-mono uppercase">
          Target: {selectedFormatId}
        </span>
      </div>

      {/* Quality Slider */}
      {supportsQuality && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <label className="text-slate-300 font-medium flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-blue-400" />
              Image Quality & Compression
            </label>
            <span className="font-mono text-blue-400 font-bold">{quality}%</span>
          </div>
          <input
            type="range"
            min="1"
            max="100"
            value={quality}
            onChange={(e) => setQuality(parseInt(e.target.value, 10))}
            disabled={disabled}
            className="w-full accent-blue-500 bg-white/10 rounded-lg h-2 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-400 font-mono">
            <span>Small File</span>
            <span>Balanced</span>
            <span>Best Quality</span>
          </div>
        </div>
      )}

      {/* Resize Dimensions */}
      <div className="space-y-2">
        <label className="text-xs text-slate-300 font-medium flex items-center gap-1.5">
          <ImageIcon className="w-3.5 h-3.5 text-blue-400" />
          Resize Dimensions (Optional)
        </label>
        <div className="grid grid-cols-3 gap-2">
          <div>
            <input
              type="number"
              placeholder="Width (px)"
              value={width ?? ""}
              onChange={(e) =>
                setDimensions(
                  e.target.value ? parseInt(e.target.value, 10) : null,
                  height
                )
              }
              disabled={disabled}
              className="w-full bg-[#0b0d11] border border-white/15 focus:border-blue-500 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none"
            />
          </div>
          <div>
            <input
              type="number"
              placeholder="Height (px)"
              value={height ?? ""}
              onChange={(e) =>
                setDimensions(
                  width,
                  e.target.value ? parseInt(e.target.value, 10) : null
                )
              }
              disabled={disabled}
              className="w-full bg-[#0b0d11] border border-white/15 focus:border-blue-500 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none"
            />
          </div>
          <div>
            <select
              value={fitMode}
              onChange={(e) => setFitMode(e.target.value as any)}
              disabled={disabled}
              className="w-full bg-[#0b0d11] border border-white/15 focus:border-blue-500 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none"
            >
              {IMAGE_FIT_MODES.map((mode) => (
                <option key={mode.id} value={mode.id} className="bg-[#131722]">
                  {mode.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Rotation & Flip Controls */}
      <div className="space-y-2">
        <label className="text-xs text-slate-300 font-medium flex items-center gap-1.5">
          <RotateCw className="w-3.5 h-3.5 text-blue-400" />
          Orientation & Flips
        </label>
        <div className="flex items-center gap-2">
          {(["0", "90", "180", "270"] as const).map((angle) => (
            <button
              key={angle}
              type="button"
              onClick={() => setRotateAngle(angle)}
              disabled={disabled}
              className={`flex-1 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                rotateAngle === angle
                  ? "bg-blue-600 border-blue-500 text-white"
                  : "bg-white/5 hover:bg-white/10 border-white/10 text-slate-300"
              }`}
            >
              {angle}°
            </button>
          ))}
          <button
            type="button"
            onClick={toggleFlipHorizontal}
            disabled={disabled}
            className={`p-1.5 rounded-lg border transition-all ${
              flipHorizontal
                ? "bg-blue-600 border-blue-500 text-white"
                : "bg-white/5 hover:bg-white/10 border-white/10 text-slate-300"
            }`}
            title="Flip Horizontal"
          >
            <FlipHorizontal className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={toggleFlipVertical}
            disabled={disabled}
            className={`p-1.5 rounded-lg border transition-all ${
              flipVertical
                ? "bg-blue-600 border-blue-500 text-white"
                : "bg-white/5 hover:bg-white/10 border-white/10 text-slate-300"
            }`}
            title="Flip Vertical"
          >
            <FlipVertical className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filters, EXIF & Background Color */}
      <div className="grid grid-cols-2 gap-3 pt-1">
        {/* Grayscale Toggle */}
        <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300 bg-white/5 hover:bg-white/10 p-2.5 rounded-xl border border-white/10">
          <input
            type="checkbox"
            checked={grayscale}
            onChange={toggleGrayscale}
            disabled={disabled}
            className="rounded border-white/20 bg-[#0b0d11] text-blue-600 focus:ring-blue-500"
          />
          <span>Grayscale Filter</span>
        </label>

        {/* Strip EXIF Toggle */}
        <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300 bg-white/5 hover:bg-white/10 p-2.5 rounded-xl border border-white/10">
          <input
            type="checkbox"
            checked={stripExif}
            onChange={toggleStripExif}
            disabled={disabled}
            className="rounded border-white/20 bg-[#0b0d11] text-blue-600 focus:ring-blue-500"
          />
          <Shield className="w-3.5 h-3.5 text-blue-400" />
          <span>Strip EXIF Data</span>
        </label>
      </div>

      {/* Background Color Fill for JPG/BMP */}
      {isJpgOrBmp && (
        <div className="flex items-center justify-between text-xs pt-1 border-t border-white/10">
          <label className="text-slate-300 font-medium flex items-center gap-1.5">
            <Palette className="w-3.5 h-3.5 text-blue-400" />
            Background Color (For Transparent Alpha Fill)
          </label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={backgroundColor}
              onChange={(e) => setBackgroundColor(e.target.value)}
              disabled={disabled}
              className="w-6 h-6 rounded cursor-pointer border-none bg-transparent"
            />
            <span className="font-mono text-[11px] text-slate-400 uppercase">
              {backgroundColor}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
