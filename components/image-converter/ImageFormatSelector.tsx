"use client";

import { useMemo } from "react";
import { Image as ImageIcon, Zap, Film, Layers, Grid, Sparkles } from "lucide-react";
import { IMAGE_FORMAT_OPTIONS, IMAGE_CATEGORIES } from "@/app/utils/vars";
import { useImageConversionStore } from "@/app/store/useImageConversionStore";

// ─── Format accent colours ────────────────────────────────────────────────────
const FORMAT_COLORS: Record<string, string> = {
  jpg:             "bg-orange-500/20 text-orange-400 border-orange-500/40",
  png:             "bg-blue-500/20   text-blue-400   border-blue-500/40",
  webp:            "bg-emerald-500/20 text-emerald-400 border-emerald-500/40",
  avif:            "bg-purple-500/20 text-purple-400 border-purple-500/40",
  gif:             "bg-pink-500/20   text-pink-400   border-pink-500/40",
  tiff:            "bg-cyan-500/20   text-cyan-400   border-cyan-500/40",
  bmp:             "bg-yellow-500/20 text-yellow-400 border-yellow-500/40",
  ico:             "bg-indigo-500/20 text-indigo-400 border-indigo-500/40",
  "compress-image":"bg-red-500/20    text-red-400    border-red-500/40",
};

const ICON_MAP: Record<string, React.ElementType> = {
  Image: ImageIcon,
  Zap,
  Film,
  Layers,
  Grid,
  Sparkles,
};

interface ImageFormatSelectorProps {
  activeCategory: "all" | "raster" | "tools";
  disabled?: boolean;
  onCategoryChange: (category: "all" | "raster" | "tools") => void;
}

export default function ImageFormatSelector({
  activeCategory,
  disabled = false,
  onCategoryChange,
}: ImageFormatSelectorProps) {
  const { selectedFormatId, setSelectedFormatId } = useImageConversionStore();

  const filteredFormats = useMemo(() => {
    if (activeCategory === "all") return IMAGE_FORMAT_OPTIONS;
    return IMAGE_FORMAT_OPTIONS.filter((f) => f.category === activeCategory);
  }, [activeCategory]);

  const selectedOption = IMAGE_FORMAT_OPTIONS.find((f) => f.id === selectedFormatId);

  return (
    <div className="space-y-4">

      {/* Category Tabs */}
      <div className="flex items-center gap-2">
        {IMAGE_CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            type="button"
            disabled={disabled}
            onClick={() => onCategoryChange(cat.id as any)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeCategory === cat.id
                ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                : "bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Format Pill Grid */}
      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
        {filteredFormats.map((fmt) => {
          const isSelected = fmt.id === selectedFormatId;
          const IconComponent = ICON_MAP[fmt.iconName] || ImageIcon;
          const colorClass = FORMAT_COLORS[fmt.id] || "bg-white/10 text-slate-300 border-white/10";

          return (
            <button
              key={fmt.id}
              type="button"
              disabled={disabled}
              onClick={() => setSelectedFormatId(fmt.id)}
              className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border text-center transition-all duration-150 ${
                isSelected
                  ? `${colorClass} ring-2 ring-current ring-offset-1 ring-offset-[#0b0d11]`
                  : "bg-white/[0.03] border-white/10 text-slate-400 hover:bg-white/[0.07] hover:text-white hover:border-white/20"
              }`}
            >
              <IconComponent className="w-4 h-4" />
              <span className="text-[11px] font-bold uppercase tracking-wider">
                {fmt.id === "compress-image" ? "Compress" : fmt.id}
              </span>
            </button>
          );
        })}
      </div>

      {/* Selected format description */}
      {selectedOption && (
        <div className="px-3 py-2 rounded-lg bg-white/5 border border-white/8 text-xs text-slate-400">
          <span className="text-white font-semibold">{selectedOption.name}</span>
          &nbsp;—&nbsp;{selectedOption.description}
        </div>
      )}
    </div>
  );
}
