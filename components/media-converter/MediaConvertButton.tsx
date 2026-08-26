"use client";

import React, { useState, useRef } from "react";
import { useMediaConversionStore } from "@/app/store/useMediaConversionStore";
import { MEDIA_FORMAT_OPTIONS } from "@/app/utils/vars";
import { Download, CheckCircle2, ArrowRight, X } from "lucide-react";
import { toast } from "sonner";

interface MediaConvertButtonProps {
  file: File | null;
  onSuccess?: () => void;
}

interface ProgressState {
  percent: number;
  fps: string;
  speed: string;
  stage: string;
}

export function MediaConvertButton({ file, onSuccess }: MediaConvertButtonProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [progress, setProgress] = useState<ProgressState | null>(null);
  const [downloadBlob, setDownloadBlob] = useState<Blob | null>(null);
  const [downloadFileName, setDownloadFileName] = useState<string>("");
  const abortRef = useRef<AbortController | null>(null);

  const {
    selectedFormatId, resolution, videoBitrate,
    audioBitrate, fps, startTime, endTime, muteAudio, speedFactor,
  } = useMediaConversionStore();

  const targetFormat = MEDIA_FORMAT_OPTIONS.find(
    (f) => f.id.toLowerCase() === selectedFormatId.toLowerCase()
  );

  const handleConvert = async () => {
    if (!file) { toast.error("Please upload a media file first"); return; }

    setIsProcessing(true);
    setIsDone(false);
    setProgress({ percent: 0, fps: "—", speed: "—", stage: "Preparing…" });

    const abort = new AbortController();
    abortRef.current = abort;

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("options", JSON.stringify({
        selectedFormatId, resolution, videoBitrate,
        audioBitrate, fps, startTime, endTime, muteAudio, speedFactor,
      }));

      const response = await fetch(targetFormat?.endpoint ?? "/api/media/convert", {
        method: "POST",
        body: formData,
        signal: abort.signal,
      });

      if (!response.body) throw new Error("No response body");

      const reader = response.body.getReader();
      const dec = new TextDecoder();
      let buf = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        const parts = buf.split("\n\n");
        buf = parts.pop() ?? "";

        for (const part of parts) {
          const line = part.trim();
          if (!line.startsWith("data:")) continue;
          try {
            const event = JSON.parse(line.slice(5).trim());

            if (event.type === "progress") {
              setProgress({
                percent: event.percent ?? 0,
                fps: event.fps ?? "—",
                speed: event.speed ?? "—",
                stage: event.stage ?? "Processing…",
              });
            } else if (event.type === "done") {
              setProgress({ percent: 100, fps: "—", speed: "—", stage: "Done!" });

              // Decode base64 and store blob
              const binary = atob(event.base64);
              const bytes = new Uint8Array(binary.length);
              for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
              const blob = new Blob([bytes], { type: event.mimeType });

              setDownloadBlob(blob);
              setDownloadFileName(event.filename);

              // Auto-trigger download
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url; a.download = event.filename;
              document.body.appendChild(a); a.click();
              document.body.removeChild(a);
              URL.revokeObjectURL(url);

              setIsDone(true);
              toast.success("Conversion complete — file downloaded!");
              onSuccess?.();
            } else if (event.type === "error") {
              throw new Error(event.message);
            }
          } catch (parseErr: any) {
            if (parseErr?.message && !parseErr.message.includes("JSON")) throw parseErr;
          }
        }
      }
    } catch (err: any) {
      if (err?.name === "AbortError") return;
      console.error("Media conversion error:", err);
      toast.error(err?.message ?? "An error occurred during conversion");
      setProgress(null);
    } finally {
      setIsProcessing(false);
      abortRef.current = null;
    }
  };

  const handleCancel = () => {
    abortRef.current?.abort();
    setIsProcessing(false);
    setProgress(null);
    toast.info("Conversion cancelled");
  };

  const handleManualDownload = () => {
    if (!downloadBlob || !downloadFileName) return;
    const url = URL.createObjectURL(downloadBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = downloadFileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Download started!");
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
            {progress.fps !== "—" && <span>FPS: <span className="text-slate-400">{progress.fps}</span></span>}
            {progress.speed !== "—" && <span>Speed: <span className="text-slate-400">{progress.speed}</span></span>}
            <span className="ml-auto">Processing {file?.name.slice(0, 30)}{(file?.name.length ?? 0) > 30 ? "…" : ""}</span>
          </div>
        </div>

        {/* Cancel */}
        <button
          type="button"
          onClick={handleCancel}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-red-400 bg-white/[0.03] hover:bg-red-500/8 border border-white/8 hover:border-red-500/20 transition-all"
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
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white bg-green-600 hover:bg-green-500 transition-all shadow-lg shadow-green-600/20"
          >
            <Download className="w-4 h-4" />
            Download File
          </button>
          <button
            type="button"
            onClick={() => { setIsDone(false); setProgress(null); setDownloadBlob(null); }}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-slate-300 hover:text-white bg-white/[0.05] hover:bg-white/10 border border-white/10 transition-all"
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
            <span className="font-semibold text-slate-300">{targetFormat?.name ?? selectedFormatId.toUpperCase()}</span>
            {targetFormat?.extension && <span className="ml-1 font-mono text-indigo-400">{targetFormat.extension}</span>}
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
        className={`w-full flex items-center justify-center gap-2.5 py-3.5 rounded-xl font-semibold text-sm transition-all duration-200 ${
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
