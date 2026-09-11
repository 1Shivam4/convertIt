"use client";

import { useCallback, useRef, useState } from "react";
import {
  ArrowRight,
  RefreshCw,
  CheckCircle2,
  Zap,
  Download,
} from "lucide-react";
import { useConverterStore } from "@/app/store/useFileDetectionStore";
import { useImageConversionStore } from "@/app/store/useImageConversionStore";
import { IMAGE_FORMAT_OPTIONS } from "@/app/utils/vars";
import { toast } from "sonner";

function formatBytes(bytes: number): string {
  const kb = bytes / 1024;
  return kb > 1024 ? `${(kb / 1024).toFixed(2)} MB` : `${kb.toFixed(1)} KB`;
}

export default function ImageConvertButton() {
  const {
    files,
    startConversion,
    completeConversion,
    resetConversion,
    setError,
  } = useConverterStore();

  const store = useImageConversionStore();

  const [downloadBlob, setDownloadBlob] = useState<Blob | null>(null);
  const [downloadFileName, setDownloadFileName] = useState("");
  const [convertedSize, setConvertedSize] = useState<number | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [fakeProgress, setFakeProgress] = useState(0);
  const progressRef = useRef<NodeJS.Timeout | null>(null);

  const totalOriginalSize = files.reduce((a, f) => a + f.size, 0);
  const savingsPct =
    convertedSize && convertedSize < totalOriginalSize
      ? Math.round(
          ((totalOriginalSize - convertedSize) / totalOriginalSize) * 100,
        )
      : null;

  const handleConvert = useCallback(async () => {
    if (files.length === 0) return;

    const selectedOption = IMAGE_FORMAT_OPTIONS.find(
      (f) => f.id === store.selectedFormatId,
    );
    const endpoint = selectedOption?.endpoint || "/api/image/convert";

    setIsProcessing(true);
    setDownloadBlob(null);
    setConvertedSize(null);
    startConversion();

    // Animate fake progress: fast to 80%, then slow until done
    setFakeProgress(0);
    let p = 0;
    progressRef.current = setInterval(() => {
      p = p < 70 ? p + 5 : p < 88 ? p + 1 : p;
      setFakeProgress(p);
    }, 120);

    try {
      const formData = new FormData();
      files.forEach((f) => formData.append("files", f));
      formData.append(
        "options",
        JSON.stringify({
          targetFormat: store.selectedFormatId,
          quality: store.quality,
          width: store.width,
          height: store.height,
          fitMode: store.fitMode,
          rotateAngle: store.rotateAngle,
          flipHorizontal: store.flipHorizontal,
          flipVertical: store.flipVertical,
          grayscale: store.grayscale,
          stripExif: store.stripExif,
          backgroundColor: store.backgroundColor,
        }),
      );
      formData.append("quality", String(store.quality));

      const res = await fetch(endpoint, { method: "POST", body: formData });
      if (!res.ok) {
        const errJson = await res.json().catch(() => null);
        throw new Error(
          errJson?.error || (await res.text()) || "Conversion failed",
        );
      }

      const blob = await res.blob();
      setDownloadBlob(blob);

      const convertedHeader = res.headers.get("X-Converted-Size");
      if (convertedHeader) setConvertedSize(parseInt(convertedHeader, 10));

      const cd = res.headers.get("Content-Disposition");
      let fname = `converted.${store.selectedFormatId}`;
      if (cd) {
        const m = cd.match(/filename="?([^"]+)"?/);
        if (m?.[1]) fname = m[1];
      }
      setDownloadFileName(fname);
      completeConversion(blob, fname);
      toast.success("Conversion complete!");
    } catch (err: any) {
      setError(err?.message || "Conversion failed");
      toast.error(err?.message || "Conversion failed");
    } finally {
      setIsProcessing(false);
      if (progressRef.current) clearInterval(progressRef.current);
      setFakeProgress(100);
      setTimeout(() => setFakeProgress(0), 600);
    }
  }, [files, store, startConversion, completeConversion, setError]);

  const handleDownload = useCallback(() => {
    if (!downloadBlob) return;
    const url = URL.createObjectURL(downloadBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = downloadFileName;
    a.click();
    URL.revokeObjectURL(url);
  }, [downloadBlob, downloadFileName]);

  const handleConvertAgain = () => {
    setDownloadBlob(null);
    setConvertedSize(null);
    resetConversion();
  };

  // ── Success state ──────────────────────────────────────────────────────────
  if (downloadBlob) {
    return (
      <div className="bg-emerald-600/10 border border-emerald-500/30 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="w-11 h-11 rounded-xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center shrink-0">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white">
            Conversion complete!
          </p>
          <p className="text-xs text-slate-400 mt-0.5">
            {formatBytes(totalOriginalSize)} →{" "}
            {convertedSize ? formatBytes(convertedSize) : "ready"}
            {savingsPct !== null && savingsPct > 0 && (
              <span className="ml-2 inline-flex items-center gap-1 text-emerald-400 font-semibold">
                <Zap className="w-3 h-3 fill-emerald-400" />
                {savingsPct}% smaller
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleDownload}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold transition-all shadow-lg shadow-emerald-600/20"
          >
            <Download className="w-4 h-4" />
            Download
          </button>
          <button
            type="button"
            onClick={handleConvertAgain}
            className="px-4 py-2 rounded-xl bg-white/8 hover:bg-white/15 text-slate-300 text-sm font-semibold transition-all"
          >
            Convert Again
          </button>
        </div>
      </div>
    );
  }

  // ── Convert Button ─────────────────────────────────────────────────────────
  return (
    <div className="space-y-3">
      {isProcessing && (
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-slate-400">
              Converting image{files.length > 1 ? `s (${files.length})` : ""}…
            </span>
            <span className="font-mono font-bold text-blue-400">
              {fakeProgress}%
            </span>
          </div>
          <div className="w-full h-1.5 bg-white/8 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full transition-all duration-150"
              style={{ width: `${fakeProgress}%` }}
            />
          </div>
        </div>
      )}
      <button
        type="button"
        onClick={handleConvert}
        disabled={isProcessing || files.length === 0}
        className="w-full py-4 rounded-2xl font-bold text-base text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-blue-600/20 flex items-center justify-center gap-2.5 transition-all active:scale-[0.99]"
      >
        {isProcessing ? (
          <>
            <RefreshCw className="w-4 h-4 animate-spin" />
            Converting {files.length > 1 ? `${files.length} images` : "image"}…
          </>
        ) : (
          <>
            Convert {files.length > 1 ? `${files.length} images` : "image"} to{" "}
            {store.selectedFormatId.toUpperCase()}
            <ArrowRight className="w-4 h-4" />
          </>
        )}
      </button>
    </div>
  );
}
