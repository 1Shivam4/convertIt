"use client";

import { Eye, Palette, SlidersHorizontal, SunMedium } from "lucide-react";
import { useImageConversionStore } from "@/app/store/useImageConversionStore";

const PALETTE_SWATCHES = [
  { label: "White", hex: "#ffffff" },
  { label: "Black", hex: "#000000" },
  { label: "Dark Slate", hex: "#0f172a" },
  { label: "Charcoal", hex: "#1e293b" },
  { label: "Light Gray", hex: "#e2e8f0" },
  { label: "ConvertIt Red", hex: "#dc2626" },
];

export default function AdjustmentsTabContent() {
  const {
    grayscale,
    toggleGrayscale,
    useBackgroundColor,
    setUseBackgroundColor,
    backgroundColor,
    setBackgroundColor,
    quality,
    setQuality,
  } = useImageConversionStore();

  return (
    <div className="space-y-4">
      {/* 1. Monochrome / Grayscale Filter */}
      <div className="p-4 rounded-xl bg-white/[0.02] border border-white/8 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Eye className="w-3.5 h-3.5 text-red-400" />
            <span className="text-xs font-semibold text-white">Monochrome &amp; Grayscale</span>
          </div>
          <input
            type="checkbox"
            checked={grayscale}
            onChange={toggleGrayscale}
            className="toggle toggle-error toggle-xs cursor-pointer"
          />
        </div>
        <p className="text-[11px] text-slate-400 leading-relaxed">
          Transforms color channels into crisp, high-contrast black &amp; white monochrome luminosity.
        </p>
      </div>

      {/* 2. Canvas Background Color */}
      <div className="p-4 rounded-xl bg-white/[0.02] border border-white/8 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Palette className="w-3.5 h-3.5 text-red-400" />
            <span className="text-xs font-semibold text-white">Canvas Background Color</span>
          </div>
          <input
            type="checkbox"
            checked={useBackgroundColor}
            onChange={(e) => setUseBackgroundColor(e.target.checked)}
            className="toggle toggle-error toggle-xs cursor-pointer"
          />
        </div>

        <p className="text-[11px] text-slate-400 leading-relaxed">
          Replaces alpha transparency with a solid backdrop color when converting PNG or SVG into formats without an alpha channel (like JPG or BMP).
        </p>

        {useBackgroundColor && (
          <div className="pt-2 border-t border-white/5 space-y-2.5 animate-in fade-in duration-200">
            <div className="flex items-center justify-between bg-black/40 border border-white/10 rounded-lg p-2">
              <span className="text-xs text-slate-300 font-medium">Selected Color</span>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={backgroundColor}
                  onChange={(e) => setBackgroundColor(e.target.value)}
                  className="w-6 h-6 rounded cursor-pointer border-none bg-transparent"
                />
                <span className="badge badge-neutral badge-sm font-mono text-xs text-white uppercase">
                  {backgroundColor}
                </span>
              </div>
            </div>

            {/* Quick Swatches */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {PALETTE_SWATCHES.map((swatch) => (
                <button
                  key={swatch.hex}
                  type="button"
                  onClick={() => setBackgroundColor(swatch.hex)}
                  className={`px-2 py-1 rounded text-[10px] font-medium border flex items-center gap-1.5 transition-all cursor-pointer ${
                    backgroundColor.toLowerCase() === swatch.hex.toLowerCase()
                      ? "border-red-500 bg-red-500/10 text-white"
                      : "border-white/8 bg-white/[0.02] text-slate-400 hover:text-white"
                  }`}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full border border-white/20 shrink-0"
                    style={{ backgroundColor: swatch.hex }}
                  />
                  {swatch.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 3. Image Clarity & Compression */}
      <div className="p-4 rounded-xl bg-white/[0.02] border border-white/8 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <SunMedium className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-xs font-semibold text-white">Clarity &amp; Fine-Tuning</span>
          </div>
          <span className="badge badge-outline badge-error badge-xs font-mono font-bold">
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

        <div className="flex justify-between text-[10px] text-slate-500">
          <span>Max Compression (Smallest File)</span>
          <span>Maximum Fidelity</span>
        </div>
      </div>
    </div>
  );
}
