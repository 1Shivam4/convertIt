"use client";

import { useMemo, useEffect, useState } from "react";
import {
  RotateCcw,
  CheckCircle2,
  Download,
  AlertCircle,
  Loader2,
  XCircle,
  FileText,
  Sparkles,
  Link as LinkIcon,
  Layers,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { usePDFConversionStore } from "@/app/store/usePDFConversionStore";
import { formatFileSize } from "@/app/lib/plans";
import { PDF_FORMAT_OPTIONS } from "@/app/utils/vars";

export default function PDFOutputColumn() {
  const {
    stage,
    file,
    files,
    selectedFormatId,
    outputFile,
    outputBlobUrl,
    outputFileName,
    outputSize,
    error,
    jobStatus,
    jobId,
    progress,
    resetConversion,
    resetAll,
    startConversion,
  } = usePDFConversionStore();

  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  const selectedFormatDef = useMemo(() => {
    return (
      PDF_FORMAT_OPTIONS.find((f) => f.id === selectedFormatId) ||
      PDF_FORMAT_OPTIONS[0]
    );
  }, [selectedFormatId]);

  const activeFile = file || files[0] || null;

  useEffect(() => {
    if (!outputFile) {
      setDownloadUrl(null);
      return;
    }
    const url = URL.createObjectURL(outputFile);
    setDownloadUrl(url);
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [outputFile]);

  const outputName = useMemo(() => {
    if (outputFileName) return outputFileName;
    const base = activeFile?.name.substring(0, activeFile.name.lastIndexOf(".")) || "converted";
    return `${base}${selectedFormatDef.extension}`;
  }, [outputFileName, activeFile, selectedFormatDef]);

  const handleDownload = () => {
    if (!downloadUrl) return;
    const a = document.createElement("a");
    a.href = downloadUrl;
    a.download = outputName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success(`Downloaded ${outputName}`);
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success("Studio link copied to clipboard!");
    } catch {
      toast.error("Failed to copy link");
    }
  };

  // Original vs Converted size comparison
  const totalOriginalBytes = files.reduce((acc, f) => acc + f.size, 0) || activeFile?.size || 0;
  const convertedBytes = outputSize || 0;
  const hasSavings =
    totalOriginalBytes > 0 &&
    convertedBytes > 0 &&
    convertedBytes < totalOriginalBytes;
  const savingsPct = hasSavings
    ? Math.round(((totalOriginalBytes - convertedBytes) / totalOriginalBytes) * 100)
    : 0;

  return (
    <section className="h-full flex flex-col min-h-0 studio-card p-4 sm:p-5 overflow-hidden">
      {/* ── Header ────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 shrink-0 pb-3 sm:pb-4 border-b border-white/8">
        <div className="studio-badge-step">
          <RotateCcw className="w-4 h-4" />
        </div>
        <div>
          <h2 className="studio-step-title">3. Output</h2>
          <p className="studio-step-subtitle">Your converted document will appear here</p>
        </div>
      </div>

      {/* ── Scrollable Body ────────────────────────────────────────────── */}
      <div className="flex-1 min-h-0 overflow-y-auto studio-scrollbar pt-3 space-y-4">
        {/* State: CONVERTING / PROCESSING */}
        {stage === "converting" && (
          <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10 text-center space-y-4 animate-in fade-in">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-red-600/20 border border-red-500/40 flex items-center justify-center text-red-500 animate-pulse">
              <Loader2 className="w-7 h-7 animate-spin" />
            </div>

            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-semibold mb-2">
                <span>
                  ⚡ {jobStatus ? `BullMQ Queue: ${jobStatus}` : "High-Speed Engine"}
                </span>
                {jobId && <span className="font-mono text-slate-400">({jobId.slice(0, 8)})</span>}
              </div>

              <h4 className="text-base font-bold text-white">
                {jobStatus === "QUEUED"
                  ? "Queued in BullMQ worker..."
                  : jobStatus === "PROCESSING"
                  ? "Worker processing document..."
                  : "Converting document..."}
              </h4>

              <p className="text-xs text-slate-400 mt-1">
                Target: {selectedFormatDef.name} ({selectedFormatDef.extension})
              </p>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-red-600 to-rose-400 h-full transition-all duration-300 rounded-full"
                style={{ width: `${Math.max(15, progress || 60)}%` }}
              />
            </div>

            {progress > 0 && (
              <p className="text-[11px] font-mono text-slate-400">{progress}% complete</p>
            )}

            <button
              type="button"
              onClick={resetConversion}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-500/10 hover:bg-red-500/20 text-red-300 border border-red-500/30 transition-colors"
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>Cancel Conversion</span>
            </button>
          </div>
        )}

        {/* State: COMPLETED */}
        {stage === "completed" && outputFile && (
          <div className="p-5 rounded-2xl bg-green-500/10 border border-green-500/30 space-y-4 animate-in fade-in">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-green-500/20 border border-green-500/40 flex items-center justify-center text-green-400 shrink-0">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-wider text-green-400 bg-green-500/20 px-2 py-0.5 rounded border border-green-500/30">
                  Ready for Download
                </span>
                <h4 className="text-sm font-bold text-white truncate mt-1" title={outputName}>
                  {outputName}
                </h4>
                <p className="text-xs text-slate-300 mt-0.5">
                  Size: {formatFileSize(convertedBytes)}
                </p>
              </div>
            </div>

            {/* Compression savings pill */}
            {hasSavings && (
              <div className="p-2.5 rounded-xl bg-green-500/10 border border-green-500/20 text-xs text-green-300 flex items-center justify-between">
                <span>Optimized Size:</span>
                <span className="font-bold text-green-400">-{savingsPct}% smaller</span>
              </div>
            )}

            {/* Action buttons */}
            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={handleDownload}
                className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-bold py-3 px-4 rounded-xl shadow-lg shadow-green-600/30 transition-all text-sm"
              >
                <Download className="w-4 h-4" />
                <span>Download Converted File</span>
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={resetConversion}
                  className="py-2 px-3 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-semibold text-slate-300 hover:text-white border border-white/10 transition-colors flex items-center justify-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Convert Another</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="py-2 px-3 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-semibold text-slate-300 hover:text-white border border-white/10 transition-colors flex items-center justify-center gap-1.5"
                >
                  <LinkIcon className="w-3.5 h-3.5" />
                  <span>Share Studio</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* State: ERROR */}
        {stage === "error" && (
          <div className="p-5 rounded-2xl bg-red-500/10 border border-red-500/30 space-y-3 animate-in fade-in">
            <div className="flex items-center gap-3 text-red-400">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <h4 className="text-sm font-bold text-white">Conversion Failed</h4>
            </div>
            <p className="text-xs text-red-200 leading-relaxed">
              {error || "An error occurred during conversion. Please check your options and retry."}
            </p>
            <button
              type="button"
              onClick={resetConversion}
              className="w-full py-2 px-3 rounded-lg bg-red-600 hover:bg-red-500 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Retry Conversion</span>
            </button>
          </div>
        )}

        {/* State: IDLE / READY (Awaiting conversion) */}
        {(stage === "idle" || stage === "ready") && (
          <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/8 text-center space-y-3.5">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400">
              <FileText className="w-6 h-6" />
            </div>

            <div>
              <h4 className="text-sm font-bold text-white">
                {activeFile ? "Ready to Convert" : "Awaiting Document"}
              </h4>
              <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                {activeFile
                  ? `Selected operation: ${selectedFormatDef.name}. Click convert when ready.`
                  : "Upload a document in column 1 to start converting."}
              </p>
            </div>

            {activeFile && (
              <div className="p-3 rounded-xl bg-black/40 border border-white/5 text-left text-xs space-y-1.5">
                <div className="flex items-center justify-between text-slate-400 text-[11px]">
                  <span>Input:</span>
                  <span className="text-white truncate max-w-[140px]">{activeFile.name}</span>
                </div>
                <div className="flex items-center justify-between text-slate-400 text-[11px]">
                  <span>Format:</span>
                  <span className="text-red-400 font-semibold">{selectedFormatDef.name}</span>
                </div>
                <div className="flex items-center justify-between text-slate-400 text-[11px]">
                  <span>Output Name:</span>
                  <span className="font-mono text-slate-300 truncate max-w-[140px]">{outputName}</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Studio Security & Engine Guarantee */}
        <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 space-y-1.5 text-[11px] text-slate-400">
          <div className="flex items-center gap-1.5 text-slate-300 font-semibold">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Private &amp; Secure Processing</span>
          </div>
          <p className="text-[10px] text-slate-500 leading-normal">
            Documents are transformed in isolated containers and automatically removed.
          </p>
        </div>
      </div>
    </section>
  );
}
