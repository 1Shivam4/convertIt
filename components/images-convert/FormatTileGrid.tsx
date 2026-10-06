"use client";

import { Check } from "lucide-react";
import { useImageConversionStore } from "@/app/store/useImageConversionStore";

const TARGET_FORMATS = [
  { id: "jpg", label: "JPEG / JPG", badge: "JPG", color: "text-red-400 bg-red-500/20 border-red-500/30" },
  { id: "png", label: "PNG", badge: "PNG", color: "text-purple-400 bg-purple-500/20 border-purple-500/30" },
  { id: "webp", label: "WEBP", badge: "WEBP", color: "text-emerald-400 bg-emerald-500/20 border-emerald-500/30" },
  { id: "avif", label: "AVIF", badge: "AVIF", color: "text-rose-400 bg-rose-500/20 border-rose-500/30" },
  { id: "gif", label: "GIF", badge: "GIF", color: "text-pink-400 bg-pink-500/20 border-pink-500/30" },
  { id: "tiff", label: "TIFF", badge: "TIFF", color: "text-cyan-400 bg-cyan-500/20 border-cyan-500/30" },
  { id: "bmp", label: "BMP", badge: "BMP", color: "text-blue-400 bg-blue-500/20 border-blue-500/30" },
];

export default function FormatTileGrid() {
  const { selectedFormatId, setSelectedFormatId } = useImageConversionStore();

  return (
    <div className="space-y-2.5">
      <label className="studio-label block">Target Format</label>
      <div className="grid grid-cols-4 gap-2">
        {TARGET_FORMATS.map((fmt) => {
          const isSelected = selectedFormatId === fmt.id;
          return (
            <button
              key={fmt.id}
              type="button"
              onClick={() => setSelectedFormatId(fmt.id)}
              className={`studio-format-tile p-2.5 flex flex-col items-center justify-center text-center relative ${
                isSelected ? "selected" : ""
              }`}
            >
              {isSelected && (
                <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-red-600 text-white flex items-center justify-center">
                  <Check className="w-2.5 h-2.5" />
                </span>
              )}
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-1.5 border ${fmt.color}`}>
                <span className="text-[10px] font-bold font-mono">{fmt.badge}</span>
              </div>
              <span className="text-[11px] font-semibold text-slate-200 uppercase tracking-tight">
                {fmt.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
