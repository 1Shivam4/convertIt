"use client";

import { useState, useRef, ChangeEvent, DragEvent } from "react";
import { CloudUpload, ChevronDown, FileText, CheckCircle, X } from "lucide-react";

export default function FileDropzone() {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const filesArr = Array.from(e.dataTransfer.files);
      setSelectedFiles((prev) => [...prev, ...filesArr]);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArr = Array.from(e.target.files);
      setSelectedFiles((prev) => [...prev, ...filesArr]);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="w-full max-w-3xl mx-auto mt-8 relative z-20">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        multiple
        className="hidden"
      />

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative bg-[#131722]/90 backdrop-blur-md rounded-2xl border-2 transition-all duration-300 p-8 md:p-12 text-center cursor-pointer group shadow-2xl ${
          isDragging
            ? "border-red-500 bg-red-500/10 scale-[1.01]"
            : "border-white/10 hover:border-red-500/40 hover:bg-[#161b28]"
        }`}
      >
        {/* Red Glow Backdrop Effect */}
        <div className="absolute -inset-0.5 bg-gradient-to-r from-red-600/10 via-red-500/20 to-red-600/10 rounded-2xl blur-lg opacity-40 group-hover:opacity-70 transition duration-500 -z-10 pointer-events-none" />

        <div className="flex flex-col items-center justify-center space-y-4">
          {/* Cloud Upload Icon */}
          <div className="w-14 h-14 rounded-2xl bg-red-600/20 border border-red-500/30 flex items-center justify-center text-red-500 group-hover:scale-110 group-hover:bg-red-600/30 transition-all duration-300 shadow-lg shadow-red-600/20">
            <CloudUpload className="w-8 h-8" />
          </div>

          {/* Heading and Subtext */}
          <div className="space-y-1">
            <h3 className="text-xl md:text-2xl font-bold text-white tracking-tight">
              Select your file here to get started
            </h3>
            <p className="text-sm md:text-base text-slate-400">
              or drop your file here.
            </p>
          </div>

          {/* Action Button & Target Dropdown */}
          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            <div className="relative" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-500 text-white font-semibold px-6 py-3 rounded-lg text-base shadow-lg shadow-red-600/30 hover:shadow-red-600/50 transition-all duration-200 active:scale-95"
              >
                <CloudUpload className="w-5 h-5" />
                <span>Select File</span>
                <ChevronDown className="w-4 h-4 ml-1 opacity-80" />
              </button>
            </div>
          </div>
        </div>

        {/* Selected Files Preview List */}
        {selectedFiles.length > 0 && (
          <div
            className="mt-6 pt-6 border-t border-white/10 text-left space-y-2"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>Selected Files ({selectedFiles.length})</span>
              <button
                type="button"
                onClick={() => setSelectedFiles([])}
                className="text-red-400 hover:text-red-300 text-xs lowercase hover:underline"
              >
                clear all
              </button>
            </div>

            <div className="max-h-40 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
              {selectedFiles.map((file, idx) => (
                <div
                  key={`${file.name}-${idx}`}
                  className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10 hover:border-white/20 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <FileText className="w-5 h-5 text-red-400 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-200 truncate">
                        {file.name}
                      </p>
                      <p className="text-xs text-slate-400">
                        {(file.size / (1024 * 1024)).toFixed(2)} MB
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 text-xs bg-red-600/20 text-red-300 px-2.5 py-1 rounded-md border border-red-500/30">
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>Ready</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeFile(idx)}
                      className="text-slate-400 hover:text-red-400 p-1 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
