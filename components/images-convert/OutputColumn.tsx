"use client";

import Image from "next/image";
import {
  RotateCcw,
  CheckCircle2,
  Download,
  Link as LinkIcon,
  Info,
  ChevronDown,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { useImageConversionStore } from "@/app/store/useImageConversionStore";
import { formatFileSize } from "@/app/lib/plans";

export default function OutputColumn() {
  const {
    files,
    selectedIndex,
    selectedFormatId,
    quality,
    width,
    height,
    rotateAngle,
    grayscale,
    stripExif,
    outputBlobUrl,
    outputFileName,
    outputSize,
    outputMeta,
    isBatchZip,
    showDetails,
    toggleShowDetails,
    resetAll,
  } = useImageConversionStore();

  const activeFile = files[selectedIndex] || files[0] || null;

  const handleDownload = () => {
    if (!outputBlobUrl || !outputFileName) return;
    const a = document.createElement("a");
    a.href = outputBlobUrl;
    a.download = outputFileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleCopyLink = async () => {
    if (!outputBlobUrl) return;
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success("Studio link copied to clipboard!");
    } catch {
      toast.error("Failed to copy link");
    }
  };

  const handleReset = () => {
    resetAll();
    toast.info("Studio reset to clean state");
  };

  // Savings calculation
  const originalBytes = activeFile?.size || 0;
  const convertedBytes = outputSize || 0;
  const savingsPct =
    originalBytes > 0 && convertedBytes > 0
      ? Math.max(0, Math.round(((originalBytes - convertedBytes) / originalBytes) * 100))
      : 0;

  return (
    <section className="h-full flex flex-col min-h-0 studio-card p-5 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 shrink-0 pb-4 border-b border-white/8">
        <div className="studio-badge-step">
          <RotateCcw className="w-4 h-4" />
        </div>
        <div>
          <h2 className="studio-step-title">3. Output</h2>
          <p className="studio-step-subtitle">Your converted image will appear here</p>
        </div>
      </div>

      {/* Scrollable Column Body */}
      <div className="flex-1 min-h-0 overflow-y-auto studio-scrollbar py-4 space-y-4">
        {outputBlobUrl ? (
          <>
            {/* Converted Output Visual Preview */}
            <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-black/60 border border-white/10 flex items-center justify-center">
              {!isBatchZip ? (
                <Image
                  src={outputBlobUrl}
                  alt={outputFileName || "Converted Output"}
                  fill
                  unoptimized
                  className="object-cover"
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-center p-6 space-y-2">
                  <div className="w-12 h-12 rounded-xl bg-red-600/20 border border-red-500/30 flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6 text-red-500" />
                  </div>
                  <span className="text-sm font-semibold text-white">ZIP Bundle Ready</span>
                  <span className="text-xs text-slate-400">{files.length} images processed &amp; archived</span>
                </div>
              )}
            </div>

            {/* Status Card Pill with DaisyUI Badges */}
            <div className="p-3 bg-white/[0.02] border border-white/8 rounded-xl flex items-center justify-between text-xs">
              <div className="flex items-center gap-2.5 truncate">
                <span className="badge badge-error badge-sm font-mono font-bold shrink-0 text-white">
                  {isBatchZip ? "ZIP" : selectedFormatId.toUpperCase()}
                </span>
                <div className="truncate">
                  <p className="text-slate-200 font-medium truncate max-w-[140px]">{outputFileName}</p>
                  <p className="studio-mono text-[10px] text-slate-400">
                    {outputSize ? formatFileSize(outputSize) : ""}
                    {outputMeta && ` • ${outputMeta.width} × ${outputMeta.height}`}
                    {!isBatchZip && ` • image/${selectedFormatId}`}
                  </p>
                </div>
              </div>
              <div className="badge badge-success badge-sm gap-1 text-white font-medium shrink-0">
                <CheckCircle2 className="w-3 h-3" />
                Done
              </div>
            </div>

            {/* Action Buttons with DaisyUI */}
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={handleDownload}
                className="col-span-1 btn btn-error btn-sm text-white font-semibold flex items-center justify-center gap-1.5 shadow-md shadow-red-600/30 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                Download
              </button>
              <button
                type="button"
                onClick={handleCopyLink}
                className="btn btn-ghost btn-sm bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-slate-300 hover:text-white flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <LinkIcon className="w-3.5 h-3.5" />
                Copy Link
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="btn btn-ghost btn-sm bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-slate-300 hover:text-white flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset
              </button>
            </div>

            {/* Collapsible Image Details */}
            <div className="border border-white/8 rounded-xl overflow-hidden bg-white/[0.015]">
              <button
                type="button"
                onClick={toggleShowDetails}
                className="w-full flex items-center justify-between px-4 py-2.5 text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/[0.02] transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <Info className="w-3.5 h-3.5 text-slate-400" />
                  Image Details
                </span>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${
                    showDetails ? "rotate-180" : ""
                  }`}
                />
              </button>

              {showDetails && (
                <div className="p-3.5 border-t border-white/8 space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-white/5">
                    <span className="text-slate-400">Format</span>
                    <span className="font-semibold text-white uppercase">{selectedFormatId}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-white/5">
                    <span className="text-slate-400">Size</span>
                    <span className="studio-mono font-semibold text-white flex items-center gap-1">
                      {outputSize ? formatFileSize(outputSize) : "—"}
                      {savingsPct > 0 && (
                        <span className="text-emerald-400 font-normal">
                          (↓ {savingsPct}%)
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-white/5">
                    <span className="text-slate-400">Dimensions</span>
                    <span className="studio-mono text-white">
                      {outputMeta
                        ? `${outputMeta.width} × ${outputMeta.height}`
                        : width && height
                        ? `${width} × ${height}`
                        : "Original"}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-white/5">
                    <span className="text-slate-400">Quality</span>
                    <span className="studio-mono text-white">{quality}%</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-400">Transformations</span>
                    <span className="text-slate-300 text-[11px] text-right">
                      {[
                        width || height ? "Resized" : null,
                        stripExif ? "Stripped EXIF" : null,
                        grayscale ? "Grayscale" : null,
                        rotateAngle !== "0" ? `Rotated ${rotateAngle}°` : null,
                      ]
                        .filter(Boolean)
                        .join(" • ") || "None"}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          /* Empty State Placeholder */
          <div className="h-64 rounded-xl border border-dashed border-white/10 flex flex-col items-center justify-center text-center p-6 text-slate-500">
            <Sparkles className="w-8 h-8 mb-2 opacity-30 text-red-400" />
            <p className="text-xs text-slate-400 font-medium">No converted output yet</p>
            <p className="text-[11px] text-slate-500 mt-1 max-w-[200px]">
              Upload images and click &quot;Convert Image&quot; to inspect results here
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
