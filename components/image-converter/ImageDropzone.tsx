"use client";

import { useRef, useState } from "react";
import { Upload, X } from "lucide-react";
import { useConverterStore } from "@/app/store/useFileDetectionStore";

function formatBytes(bytes: number): string {
  const kb = bytes / 1024;
  return kb > 1024 ? `${(kb / 1024).toFixed(2)} MB` : `${kb.toFixed(1)} KB`;
}

export default function ImageDropzone() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const { files, addFiles, removeFile } = useConverterStore();
  const totalSize = files.reduce((a, f) => a + f.size, 0);

  const handleIncoming = (incoming: FileList | File[]) => {
    const valid = Array.from(incoming).filter((f) => f.type.startsWith("image/"));
    if (valid.length > 0) addFiles(valid);
  };

  return (
    <div className="bg-white/[0.03] border border-white/10 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-white/8 flex items-center gap-3">
        <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-[11px] font-bold text-white shrink-0">
          1
        </div>
        <span className="text-sm font-semibold text-white">Upload Images</span>
        {files.length > 0 && (
          <span className="ml-auto text-xs text-slate-400">
            {files.length} file{files.length > 1 ? "s" : ""} · {formatBytes(totalSize)}
          </span>
        )}
      </div>

      {/* Drop Zone */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*"
        className="hidden"
        onChange={(e) => e.target.files && handleIncoming(e.target.files)}
      />
      <div
        className={`m-4 border-2 border-dashed rounded-xl transition-all cursor-pointer ${
          isDragging
            ? "border-blue-500 bg-blue-500/10"
            : "border-white/15 hover:border-white/30 bg-white/[0.02] hover:bg-white/[0.04]"
        }`}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          handleIncoming(e.dataTransfer.files);
        }}
        onClick={() => fileInputRef.current?.click()}
      >
        <div className="flex flex-col items-center justify-center py-10 px-4 gap-3 select-none">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${isDragging ? "bg-blue-600" : "bg-white/8"}`}>
            <Upload className="w-5 h-5 text-slate-300" />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-white">Drop images here or click to browse</p>
            <p className="text-xs text-slate-500 mt-1">PNG, JPG, WebP, AVIF, GIF, TIFF, BMP, HEIC</p>
          </div>
        </div>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="px-4 pb-4 space-y-2">
          {files.map((file, idx) => (
            <div
              key={`${file.name}-${idx}`}
              className="flex items-center gap-3 px-3 py-2.5 bg-white/5 rounded-xl border border-white/8"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={URL.createObjectURL(file)}
                alt=""
                className="w-9 h-9 rounded-lg object-cover border border-white/10 shrink-0"
              />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-white truncate">{file.name}</p>
                <p className="text-[11px] text-slate-500">{formatBytes(file.size)}</p>
              </div>
              <button
                type="button"
                onClick={() => removeFile(idx)}
                className="p-1 text-slate-500 hover:text-red-400 transition-colors shrink-0"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
