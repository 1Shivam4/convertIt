"use client";

import React from "react";
import { useMediaConversionStore } from "@/app/store/useMediaConversionStore";
import { MEDIA_FORMAT_OPTIONS } from "@/app/utils/vars";
import { Download, CheckCircle2, ArrowRight, X } from "lucide-react";
import { useMediaConversion } from "@/app/hooks/useMediaConversion";

interface MediaConvertButtonProps {
  file: File | null;
  onSuccess?: () => void;
}

export function MediaConvertButton({ file, onSuccess }: MediaConvertButtonProps) {
  const { selectedFormatId } = useMediaConversionStore();

  const {
    convertMedia,
    isProcessing,
    isDone,
    progress,
    downloadFileName,
    handleManualDownload,
    cancel,
  } = useMediaConversion(onSuccess);

  const targetFormat = MEDIA_FORMAT_OPTIONS.find(
    (f) => f.id.toLowerCase() === selectedFormatId.toLowerCase(),
  );

  const handleConvert = () => {
    if (!file) return;
    convertMedia(file);
  };

  /* ── Processing state ─────────────────────────────────────────────── */
  if (isProcessing && progress) {
    return (
      <div className="space-y-3">
        {/* Progress bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 font-medium">{progress.stage}</span>
            <span className="font-mono font-bold text-indigo-400">{progress.percent}%</span>
          </div>
          <div className="w-full h-2 bg-white/8 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-500 rounded-full transition-all duration-500"
              style={{ width: `${progress.percent}%` }}
            />
          </div>
          <div className="flex items-center gap-4 text-[11px] text-slate-500">
            {progress.fps !== "—" && (
              <span>
                FPS: <span className="text-slate-400">{progress.fps}</span>
              </span>
            )}
            {progress.speed !== "—" && (
              <span>
                Speed: <span className="text-slate-400">{progress.speed}</span>
              </span>
            )}
            <span className="ml-auto">
              Processing {file?.name.slice(0, 30)}
              {(file?.name.length ?? 0) > 30 ? "…" : ""}
            </span>
          </div>
        </div>

        {/* Cancel */}
        <button
          type="button"
          onClick={cancel}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-red-400 bg-white/[0.03] hover:bg-red-500/8 border border-white/8 hover:border-red-500/20 transition-all cursor-pointer"
        >
          <X className="w-4 h-4" /> Cancel
        </button>
      </div>
    );
  }

  /* ── Done state ───────────────────────────────────────────────────── */
  if (isDone) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-3 p-3.5 rounded-xl bg-green-600/10 border border-green-500/20">
          <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate">Conversion complete!</p>
            <p className="text-xs text-slate-400 mt-0.5 truncate">{downloadFileName}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleManualDownload}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white bg-green-600 hover:bg-green-500 transition-all shadow-lg shadow-green-600/20 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            Download File
          </button>
          <button
            type="button"
            onClick={() => {
              if (file) convertMedia(file);
            }}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-slate-300 hover:text-white bg-white/[0.05] hover:bg-white/10 border border-white/10 transition-all cursor-pointer"
          >
            Convert again
          </button>
        </div>
      </div>
    );
  }

  /* ── Idle state ───────────────────────────────────────────────────── */
  return (
    <div className="space-y-3">
      {file && (
        <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/8 text-xs text-slate-500">
          <span className="flex-1">
            Converting to{" "}
            <span className="font-semibold text-slate-300">
              {targetFormat?.name ?? selectedFormatId.toUpperCase()}
            </span>
            {targetFormat?.extension && (
              <span className="ml-1 font-mono text-indigo-400">{targetFormat.extension}</span>
            )}
          </span>
          <span className="text-slate-600">·</span>
          <span className="truncate max-w-[130px] text-slate-400">{file.name}</span>
        </div>
      )}

      <button
        type="button"
        id="media-convert-btn"
        onClick={handleConvert}
        disabled={!file}
        className={`w-full flex items-center justify-center gap-2.5 py-3.5 rounded-xl font-semibold text-sm transition-all duration-200 cursor-pointer ${
          !file
            ? "bg-indigo-600/30 text-indigo-300/40 cursor-not-allowed"
            : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20 hover:scale-[1.01]"
        }`}
      >
        <Download className="w-4 h-4" />
        Convert to {targetFormat?.name ?? selectedFormatId.toUpperCase()}
        <ArrowRight className="w-4 h-4 opacity-60" />
      </button>
    </div>
  );
}
