"use client";

import { Sliders, Sparkles } from "lucide-react";
import { useImageConversionStore } from "@/app/store/useImageConversionStore";
import FormatTileGrid from "./FormatTileGrid";

const FORMAT_TIPS: Record<string, { summary: string; tag: string }> = {
  jpg: { summary: "Universal compatibility with adjustable lossy compression.", tag: "Standard Web" },
  jpeg: { summary: "Standard photo format with adjustable JPEG compression.", tag: "Photo Standard" },
  png: { summary: "Lossless compression with full transparent alpha channel support.", tag: "Lossless / Alpha" },
  webp: { summary: "Modern Google format, up to 30% smaller than JPG with transparency.", tag: "Optimized Web" },
  avif: { summary: "Next-gen AV1 compression delivering maximum quality at lowest file size.", tag: "Next-Gen" },
  gif: { summary: "Indexed color format supporting animations and retro graphics.", tag: "Animation" },
  tiff: { summary: "Uncompressed archival format for high-end photography & print.", tag: "Print / Archival" },
  bmp: { summary: "Raw uncompressed bitmap format preserving pixel accuracy.", tag: "Raw Bitmap" },
  ico: { summary: "Windows icon container supporting multi-resolution 16x16–256x256.", tag: "Favicon" },
  svg: { summary: "Scalable vector graphics XML format for icons and logos.", tag: "Vector" },
  heic: { summary: "High Efficiency Image File Format used by modern Apple iOS cameras.", tag: "Apple HEVC" },
  heif: { summary: "High Efficiency Image Container standard for next-gen smartphones.", tag: "Modern Container" },
};

export default function FormatTabContent() {
  const { selectedFormatId, quality, setQuality } = useImageConversionStore();
  const tip = FORMAT_TIPS[selectedFormatId] || { summary: "High quality image conversion.", tag: "Standard" };

  return (
    <div className="space-y-4">
      {/* 1. Format Selection Grid */}
      <FormatTileGrid />

      {/* 2. Format Info & Quality Slider */}
      <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/8 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sliders className="w-3.5 h-3.5 text-red-400" />
            <span className="text-xs font-semibold text-white">Quality &amp; Compression</span>
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

        {/* Quick Quality Presets */}
        <div className="flex items-center justify-between text-[11px] gap-1">
          {[
            { label: "Draft", val: 50 },
            { label: "Standard", val: 75 },
            { label: "High", val: 85 },
            { label: "Max", val: 100 },
          ].map((preset) => (
            <button
              key={preset.label}
              type="button"
              onClick={() => setQuality(preset.val)}
              className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors cursor-pointer ${
                quality === preset.val
                  ? "bg-red-500/20 text-red-400 border border-red-500/30"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              }`}
            >
              {preset.label} ({preset.val}%)
            </button>
          ))}
        </div>
      </div>

      {/* 3. Format Feature Callout */}
      <div className="p-3 rounded-xl bg-red-500/5 border border-red-500/20 flex items-start gap-2.5">
        <Sparkles className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-white uppercase">{selectedFormatId}</span>
            <span className="badge badge-neutral badge-xs font-mono text-[10px] border-white/10 text-slate-300">
              {tip.tag}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">{tip.summary}</p>
        </div>
      </div>
    </div>
  );
}
