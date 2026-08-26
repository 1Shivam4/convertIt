"use client";

import React, { useRef, useState, useEffect } from "react";
import { Upload, Film, Music, Trash2, FileAudio, FileVideo, Headphones, Tv2 } from "lucide-react";

interface MediaDropzoneProps {
  file: File | null;
  onFileSelect: (file: File) => void;
  onRemoveFile: () => void;
  disabled?: boolean;
  isAudioOnly?: boolean;
}

export function MediaDropzone({
  file,
  onFileSelect,
  onRemoveFile,
  disabled = false,
  isAudioOnly = false,
}: MediaDropzoneProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    if (disabled) return;
    if (e.dataTransfer.files?.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.type.startsWith("video/") || droppedFile.type.startsWith("audio/")) {
        onFileSelect(droppedFile);
      }
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!disabled) setIsDragOver(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) onFileSelect(e.target.files[0]);
  };

  const formatFileSize = (bytes: number) => {
    if (!bytes) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / k ** i).toFixed(1))} ${sizes[i]}`;
  };

  const isVideo = file?.type.startsWith("video/");
  const isAudio = file?.type.startsWith("audio/") ||
    /\.(mp3|wav|aac|flac|ogg|m4a|wma|opus)$/i.test(file?.name ?? "");

  /* ── Empty state ─────────────────────────────────────────────── */
  if (!file) {
    return (
      <div className="bg-white/[0.03] border border-white/10 rounded-2xl overflow-hidden">
        {/* Section header */}
        <div className="px-5 py-4 border-b border-white/8 flex items-center gap-3">
          <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center text-[11px] font-bold text-white shrink-0">
            1
          </div>
          <span className="text-sm font-semibold text-white">Upload Media File</span>
        </div>

        {/* Drop zone */}
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={() => setIsDragOver(false)}
          onClick={() => !disabled && fileInputRef.current?.click()}
          className={`m-4 border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all duration-200 select-none ${
            isDragOver
              ? "border-indigo-500 bg-indigo-500/10"
              : "border-white/15 hover:border-white/30 hover:bg-white/[0.02]"
          } ${disabled ? "opacity-40 cursor-not-allowed" : ""}`}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="video/*,audio/*"
            className="hidden"
            disabled={disabled}
          />

          <div className="flex flex-col items-center gap-4">
            {/* Icon cluster */}
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400">
                <FileVideo className="w-5 h-5" />
              </div>
              <div className="w-13 h-13 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 w-14 h-14">
                <Upload className="w-6 h-6" />
              </div>
              <div className="w-11 h-11 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400">
                <FileAudio className="w-5 h-5" />
              </div>
            </div>

            <div>
              <p className="text-[15px] font-semibold text-white mb-1">
                Drop your media file here
              </p>
              <p className="text-sm text-slate-500">
                MP4, WEBM, MOV, AVI, MKV, MP3, WAV, AAC, FLAC, OGG — up to 500 MB
              </p>
            </div>

            <button
              type="button"
              disabled={disabled}
              className="mt-1 px-5 py-2 text-sm font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-colors shadow-lg shadow-indigo-600/20"
            >
              Browse Files
            </button>
          </div>
        </div>

        {/* Format chips */}
        <div className="px-5 pb-4 flex flex-wrap gap-2">
          {["MP4", "WEBM", "MOV", "AVI", "MP3", "WAV", "AAC", "FLAC", "OGG"].map((f) => (
            <span
              key={f}
              className="px-2.5 py-0.5 text-[10px] font-semibold tracking-wide rounded-full bg-white/5 text-slate-400 border border-white/8"
            >
              {f}
            </span>
          ))}
        </div>
      </div>
    );
  }

  /* ── Loaded state ────────────────────────────────────────────── */
  return (
    <div className="bg-white/[0.03] border border-white/10 rounded-2xl overflow-hidden">
      {/* Section header */}
      <div className="px-5 py-4 border-b border-white/8 flex items-center gap-3">
        <div className="w-6 h-6 rounded-full bg-green-600 flex items-center justify-center text-[11px] font-bold text-white shrink-0">
          ✓
        </div>
        <span className="text-sm font-semibold text-white">File Ready</span>
        <div className="ml-auto">
          <button
            type="button"
            onClick={onRemoveFile}
            disabled={disabled}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-red-400 hover:bg-red-500/10 border border-white/8 hover:border-red-500/20 transition-all"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Remove
          </button>
        </div>
      </div>

      {/* File info row */}
      <div className="px-5 py-3 flex items-center gap-3 border-b border-white/6 bg-white/[0.015]">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
          isVideo ? "bg-violet-500/15 text-violet-400" : "bg-cyan-500/15 text-cyan-400"
        }`}>
          {isVideo ? <Tv2 className="w-4.5 h-4.5" /> : <Headphones className="w-4.5 h-4.5" />}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white truncate">{file.name}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs text-slate-500">{formatFileSize(file.size)}</span>
            <span className="text-slate-600">·</span>
            <span className={`text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-full ${
              isVideo ? "bg-violet-500/15 text-violet-400" : "bg-cyan-500/15 text-cyan-400"
            }`}>
              {isVideo ? "Video" : "Audio"}
            </span>
          </div>
        </div>
      </div>

      {/* Media player */}
      {previewUrl && (
        <div className="bg-black/40">
          {isVideo ? (
            <video
              src={previewUrl}
              controls
              className="w-full max-h-64 object-contain"
            />
          ) : (
            <div className="px-5 py-4 flex flex-col items-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-cyan-500/15 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                <Music className="w-7 h-7" />
              </div>
              <audio src={previewUrl} controls className="w-full max-w-sm h-10" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
