"use client";

import { useMemo, useCallback } from "react";
import {
  FileText,
  FileType as FileTypeIcon,
  FileCode,
  Presentation,
  FileSpreadsheet,
  Zap,
  Shield,
  RotateCw,
  Layers,
  Lock,
  LockOpen,
  Scissors,
  Stamp,
  Image as ImageIcon,
  Search,
  X,
} from "lucide-react";
import { useState } from "react";
import {
  PDF_FORMAT_OPTIONS,
  PDF_CATEGORIES,
  PDFFormatOption,
} from "@/app/utils/vars";

const ICON_MAP: Record<string, React.ElementType> = {
  FileText,
  FileType: FileTypeIcon,
  FileCode,
  Presentation,
  FileSpreadsheet,
  Zap,
  Shield,
  RotateCw,
  Layers,
  Lock,
  LockOpen,
  Scissors,
  Stamp,
  Image: ImageIcon,
};

interface FormatSelectorProps {
  selectedFormatId: string;
  activeCategory: "all" | "document" | "tools";
  disabled?: boolean;
  onSelectFormat: (id: string) => void;
  onCategoryChange: (category: "all" | "document" | "tools") => void;
}

export default function FormatSelector({
  selectedFormatId,
  activeCategory,
  disabled = false,
  onSelectFormat,
  onCategoryChange,
}: FormatSelectorProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredFormats = useMemo(() => {
    return PDF_FORMAT_OPTIONS.filter((fmt) => {
      const matchesCategory =
        activeCategory === "all" || fmt.category === activeCategory;
      if (!matchesCategory) return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        fmt.name.toLowerCase().includes(q) ||
        fmt.extension.toLowerCase().includes(q) ||
        fmt.description.toLowerCase().includes(q) ||
        fmt.id.toLowerCase().includes(q)
      );
    });
  }, [activeCategory, searchQuery]);

  const handleSelectChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      onSelectFormat(e.target.value);
    },
    [onSelectFormat]
  );

  return (
    <div className="space-y-4">
      {/* Category Filter Tabs */}
      <div className="flex items-center gap-2">
        {PDF_CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => onCategoryChange(cat.id as any)}
            disabled={disabled}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeCategory === cat.id
                ? "bg-red-600 text-white shadow-md shadow-red-600/30"
                : "bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Search Target Format Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          disabled={disabled}
          placeholder="Search format (e.g., Word, PNG, Split, Compress)..."
          className="w-full bg-[#0b0d11] border border-white/15 focus:border-red-500 rounded-xl pl-10 pr-9 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500/20 transition-all"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Styled Dropdown */}
      <div>
        <label className="block text-xs font-medium text-slate-400 mb-1.5">
          Select Target Conversion Format
        </label>
        <select
          value={selectedFormatId}
          onChange={handleSelectChange}
          disabled={disabled}
          className="w-full bg-[#0b0d11] border border-white/15 focus:border-red-500 rounded-xl px-4 py-3 text-sm text-white font-medium focus:outline-none focus:ring-2 focus:ring-red-500/20 transition-colors"
        >
          {filteredFormats.map((fmt) => (
            <option
              key={fmt.id}
              value={fmt.id}
              className="bg-[#131722] text-white"
            >
              {fmt.name} ({fmt.extension}) — {fmt.description}
            </option>
          ))}
        </select>
      </div>

      {/* Visual Format Tile Grid */}
      <div className="grid grid-cols-2 gap-2.5 max-h-[220px] overflow-y-auto pr-1 custom-scrollbar">
        {filteredFormats.length === 0 ? (
          <div className="col-span-2 text-center py-6 border border-dashed border-white/10 rounded-xl bg-white/5 text-xs text-slate-400">
            No conversion formats found matching &quot;{searchQuery}&quot;
          </div>
        ) : (
          filteredFormats.map((fmt) => {
            const IconComponent = ICON_MAP[fmt.iconName] || FileText;
            const isSelected = fmt.id === selectedFormatId;
            return (
              <button
                key={fmt.id}
                type="button"
                onClick={() => onSelectFormat(fmt.id)}
                disabled={disabled}
                className={`flex items-start gap-3 p-3 rounded-xl border text-left transition-all duration-200 group ${
                  isSelected
                    ? "bg-red-600/15 border-red-500 text-white shadow-lg shadow-red-600/10"
                    : "bg-white/5 hover:bg-white/10 border-white/10 text-slate-300"
                }`}
              >
                <div
                  className={`p-2 rounded-lg shrink-0 transition-colors ${
                    isSelected
                      ? "bg-red-600 text-white"
                      : "bg-white/10 text-slate-300 group-hover:text-white"
                  }`}
                >
                  <IconComponent className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold truncate">
                      {fmt.name}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400 ml-1">
                      {fmt.extension}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 truncate mt-0.5">
                    {fmt.description}
                  </p>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
