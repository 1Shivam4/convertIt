"use client";

import React, { useState } from "react";
import {
  MEDIA_FORMAT_OPTIONS,
  MEDIA_CATEGORIES,
  MediaFormatOption,
} from "@/app/utils/vars";
import { useMediaConversionStore } from "@/app/store/useMediaConversionStore";
import {
  Video, Globe, Film, FileVideo, Layers, Sparkles,
  Music, Volume2, Headphones, Disc, Radio, Zap,
} from "lucide-react";

const iconMap: Record<string, React.ReactNode> = {
  Video: <Video className="w-4 h-4" />,
  Globe: <Globe className="w-4 h-4" />,
  Film: <Film className="w-4 h-4" />,
  FileVideo: <FileVideo className="w-4 h-4" />,
  Layers: <Layers className="w-4 h-4" />,
  Sparkles: <Sparkles className="w-4 h-4" />,
  Music: <Music className="w-4 h-4" />,
  Volume2: <Volume2 className="w-4 h-4" />,
  Headphones: <Headphones className="w-4 h-4" />,
  Disc: <Disc className="w-4 h-4" />,
  Radio: <Radio className="w-4 h-4" />,
  Zap: <Zap className="w-4 h-4" />,
};

interface MediaFormatSelectorProps {
  disabled?: boolean;
  isAudioOnly?: boolean;
}

export function MediaFormatSelector({
  disabled = false,
  isAudioOnly = false,
}: MediaFormatSelectorProps) {
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const { selectedFormatId, setSelectedFormatId } = useMediaConversionStore();

  React.useEffect(() => {
    if (isAudioOnly) {
      const audioIds = ["mp3", "wav", "aac", "flac", "ogg"];
      if (!audioIds.includes(selectedFormatId.toLowerCase())) {
        setSelectedFormatId("mp3");
      }
    }
  }, [isAudioOnly, selectedFormatId, setSelectedFormatId]);

  const categories = isAudioOnly
    ? [{ id: "all", label: "Audio Formats" }]
    : MEDIA_CATEGORIES;

  const filteredFormats = MEDIA_FORMAT_OPTIONS.filter((item) => {
    if (isAudioOnly) return item.category === "audio";
    if (activeCategory === "all") return true;
    return item.category === activeCategory;
  });

  return (
    <div className="space-y-4">
      {/* Category pills */}
      {!isAudioOnly && (
        <div className="flex items-center gap-1.5 flex-wrap">
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActiveCategory(cat.id)}
              disabled={disabled}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-full transition-all whitespace-nowrap ${
                activeCategory === cat.id
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                  : "text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/8"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      )}

      {/* Format grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
        {filteredFormats.map((fmt: MediaFormatOption) => {
          const isSelected = selectedFormatId.toLowerCase() === fmt.id.toLowerCase();
          return (
            <button
              key={fmt.id}
              type="button"
              onClick={() => !disabled && setSelectedFormatId(fmt.id)}
              disabled={disabled}
              className={`relative group flex flex-col items-start p-3.5 rounded-xl border text-left transition-all duration-150 ${
                isSelected
                  ? "border-indigo-500 bg-indigo-500/10 shadow-md shadow-indigo-500/10 ring-1 ring-inset ring-indigo-500/30"
                  : "border-white/8 hover:border-white/20 hover:bg-white/[0.04] bg-white/[0.02]"
              } ${disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}`}
            >
              {/* Extension badge – top right */}
              <span className={`absolute top-2.5 right-2.5 text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md transition-colors ${
                isSelected
                  ? "bg-indigo-500/30 text-indigo-300"
                  : "bg-white/8 text-slate-400 group-hover:bg-white/12"
              }`}>
                {fmt.extension}
              </span>

              {/* Icon */}
              <div className={`mb-2.5 p-1.5 rounded-lg transition-colors ${
                isSelected
                  ? "bg-indigo-500/25 text-indigo-300"
                  : "bg-white/6 text-slate-400 group-hover:text-slate-300"
              }`}>
                {iconMap[fmt.iconName] ?? <Music className="w-4 h-4" />}
              </div>

              {/* Label */}
              <p className={`text-[13px] font-semibold leading-tight ${
                isSelected ? "text-white" : "text-slate-300"
              }`}>
                {fmt.name}
              </p>
              {/* GIF short-clip warning */}
              {fmt.id.toLowerCase() === "gif" && (
                <p className="text-[10px] font-semibold text-amber-400/80 mt-1 flex items-center gap-1">
                  <span>⚠</span> Short clips only (≤ 10s)
                </p>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
