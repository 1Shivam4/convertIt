"use client";

import { useRef, ChangeEvent } from "react";
import {
  FileText,
  Plus,
  ArrowUp,
  ArrowDown,
  Trash2,
  Layers,
} from "lucide-react";
import { useConverterStore } from "@/app/store/useFileDetectionStore";

export default function PDFFileList() {
  const { files, addFiles, removeFile, reorderFiles } = useConverterStore();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const handleAddFiles = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selected = Array.from(e.target.files).filter(
        (f) => f.type === "application/pdf" || f.name.endsWith(".pdf")
      );
      if (selected.length > 0) {
        addFiles(selected);
      }
    }
  };

  if (files.length <= 1) {
    return (
      <div className="p-3 bg-[#0e1117] border border-white/10 rounded-xl flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-slate-300">
          <Layers className="w-4 h-4 text-red-400" />
          <span>Need to merge or convert multiple PDFs?</span>
        </div>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-1 px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-semibold transition-transform active:scale-95 shadow"
        >
          <Plus className="w-3.5 h-3.5" />
          Add More PDFs
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,application/pdf"
          multiple
          onChange={handleAddFiles}
          className="hidden"
        />
      </div>
    );
  }

  return (
    <div className="space-y-3 p-4 bg-[#0e1117] border border-white/10 rounded-2xl">
      {/* Toolbar Header */}
      <div className="flex items-center justify-between pb-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-red-400" />
          <span className="font-bold text-white text-xs">
            Multi-PDF Queue ({files.length} Files)
          </span>
        </div>

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-1 px-2.5 py-1 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-semibold transition-transform active:scale-95 shadow"
        >
          <Plus className="w-3.5 h-3.5" />
          Add File
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,application/pdf"
          multiple
          onChange={handleAddFiles}
          className="hidden"
        />
      </div>

      {/* File List Cards */}
      <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1 custom-scrollbar">
        {files.map((f, idx) => (
          <div
            key={`${f.name}-${idx}`}
            className="flex items-center justify-between p-2.5 bg-white/5 border border-white/10 rounded-xl hover:border-white/20 transition-all text-xs"
          >
            <div className="flex items-center gap-2.5 min-w-0 pr-2">
              <span className="flex-shrink-0 px-2 py-0.5 bg-red-500/20 text-red-400 font-mono text-[10px] font-bold rounded">
                #{idx + 1}
              </span>
              <FileText className="w-4 h-4 text-slate-400 flex-shrink-0" />
              <div className="min-w-0">
                <p className="font-semibold text-white truncate max-w-[200px] sm:max-w-[280px]">
                  {f.name}
                </p>
                <p className="text-[10px] text-slate-400">
                  {formatFileSize(f.size)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 flex-shrink-0">
              <button
                type="button"
                disabled={idx === 0}
                onClick={() => reorderFiles(idx, idx - 1)}
                className="p-1 bg-white/5 hover:bg-white/10 disabled:opacity-30 text-slate-300 rounded transition-colors"
                title="Move Up in Merge Order"
              >
                <ArrowUp className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                disabled={idx === files.length - 1}
                onClick={() => reorderFiles(idx, idx + 1)}
                className="p-1 bg-white/5 hover:bg-white/10 disabled:opacity-30 text-slate-300 rounded transition-colors"
                title="Move Down in Merge Order"
              >
                <ArrowDown className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => removeFile(idx)}
                className="p-1 bg-red-950/80 hover:bg-red-900 border border-red-500/30 text-red-300 rounded transition-colors"
                title="Remove File"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
