"use client";

import { useState } from "react";
import { ChevronDown, Sliders, Sparkles, Crop } from "lucide-react";
import ImageDropzone from "@/components/image-converter/ImageDropzone";
import ImageFormatSelector from "@/components/image-converter/ImageFormatSelector";
import ImageToolOptions from "@/components/image-converter/ImageToolOptions";
import ImageConvertButton from "@/components/image-converter/ImageConvertButton";
import ImageCropTool from "@/components/image-converter/ImageCropTool";
import { useConverterStore } from "@/app/store/useFileDetectionStore";

export default function ImageToConvertor() {
  const { files } = useConverterStore();
  const hasFiles = files.length > 0;

  const [mode, setMode] = useState<"convert" | "crop">("convert");
  const [activeCategory, setActiveCategory] = useState<
    "all" | "raster" | "tools"
  >("all");
  const [showAdvanced, setShowAdvanced] = useState(false);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-6">
      {/* ── STEP 1 — Upload ──────────────────────────────────────── */}
      <ImageDropzone />

      {/* ── Mode Switcher ─────────────────────────────────────────── */}
      {hasFiles && (
        <div className="flex items-center gap-2 p-1 bg-white/5 border border-white/10 rounded-xl w-fit">
          <button
            type="button"
            onClick={() => setMode("convert")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              mode === "convert"
                ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Convert
          </button>
          <button
            type="button"
            onClick={() => setMode("crop")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              mode === "crop"
                ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Crop className="w-3.5 h-3.5" />
            Crop
          </button>
        </div>
      )}

      {/* ── CROP MODE ─────────────────────────────────────────────── */}
      {hasFiles && mode === "crop" && (
        <ImageCropTool file={files[0]} onClose={() => setMode("convert")} />
      )}

      {/* ── CONVERT MODE ─────────────────────────────────────────── */}
      {mode === "convert" && (
        <>
          {/* STEP 2 — Format + Options */}
          <div
            className={`transition-opacity duration-200 ${
              !hasFiles ? "opacity-40 pointer-events-none select-none" : ""
            }`}
          >
            <div className="bg-white/[0.03] border border-white/10 rounded-2xl overflow-hidden">
              {/* Section header */}
              <div className="px-5 py-4 border-b border-white/8 flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-[11px] font-bold text-white shrink-0">
                  2
                </div>
                <span className="text-sm font-semibold text-white">
                  Choose Output Format
                </span>
              </div>

              {/* Format Selector */}
              <div className="p-4">
                <ImageFormatSelector
                  activeCategory={activeCategory}
                  onCategoryChange={setActiveCategory}
                  disabled={!hasFiles}
                />
              </div>

              {/* Advanced Options (collapsible) */}
              <div className="border-t border-white/8">
                <button
                  type="button"
                  onClick={() => setShowAdvanced((v) => !v)}
                  className="w-full flex items-center justify-between px-5 py-3 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <Sliders className="w-3.5 h-3.5" />
                    Advanced Options — Quality, Resize, Rotation &amp; Filters
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 transition-transform duration-200 ${
                      showAdvanced ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {showAdvanced && (
                  <div className="pb-2">
                    <ImageToolOptions disabled={!hasFiles} />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* STEP 3 — Convert Button */}
          <div
            className={`transition-opacity duration-200 ${
              !hasFiles ? "opacity-40 pointer-events-none select-none" : ""
            }`}
          >
            <ImageConvertButton />
          </div>
        </>
      )}
    </div>
  );
}
