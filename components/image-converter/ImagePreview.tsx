"use client";

import { useMemo } from "react";
import { Image as ImageIcon, ArrowRight, Zap, CheckCircle2 } from "lucide-react";

interface ImagePreviewProps {
  file: File;
  targetFormat: string;
  convertedSize?: number | null;
  onRemove?: () => void;
}

export default function ImagePreview({
  file,
  targetFormat,
  convertedSize,
}: ImagePreviewProps) {
  const objectUrl = useMemo(() => {
    try {
      return URL.createObjectURL(file);
    } catch {
      return null;
    }
  }, [file]);

  const originalSizeFormatted = useMemo(() => {
    const kb = file.size / 1024;
    return kb > 1024 ? `${(kb / 1024).toFixed(2)} MB` : `${kb.toFixed(1)} KB`;
  }, [file.size]);

  const convertedSizeFormatted = useMemo(() => {
    if (!convertedSize) return null;
    const kb = convertedSize / 1024;
    return kb > 1024 ? `${(kb / 1024).toFixed(2)} MB` : `${kb.toFixed(1)} KB`;
  }, [convertedSize]);

  const savingsPercentage = useMemo(() => {
    if (!convertedSize || convertedSize >= file.size) return null;
    const diff = file.size - convertedSize;
    return Math.round((diff / file.size) * 100);
  }, [file.size, convertedSize]);

  return (
    <div className="flex items-center justify-between p-3.5 bg-white/5 border border-white/10 rounded-xl">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-12 h-12 rounded-lg bg-[#0b0d11] border border-white/10 overflow-hidden relative shrink-0 flex items-center justify-center">
          {objectUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={objectUrl}
              alt={file.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <ImageIcon className="w-5 h-5 text-slate-500" />
          )}
        </div>
        <div className="min-w-0">
          <h4 className="text-xs font-semibold text-white truncate max-w-[200px]">
            {file.name}
          </h4>
          <div className="flex items-center gap-2 mt-1 text-[11px]">
            <span className="font-mono text-slate-400">{originalSizeFormatted}</span>
            <ArrowRight className="w-3 h-3 text-slate-500" />
            <span className="font-mono uppercase font-bold text-blue-400">
              .{targetFormat}
            </span>
            {convertedSizeFormatted && (
              <span className="font-mono text-emerald-400 font-bold ml-1">
                ({convertedSizeFormatted})
              </span>
            )}
          </div>
        </div>
      </div>

      {savingsPercentage !== null && (
        <div className="flex items-center gap-1 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 px-2.5 py-1 rounded-full text-[11px] font-bold">
          <Zap className="w-3 h-3 fill-emerald-400" />
          <span>-{savingsPercentage}% Smaller</span>
        </div>
      )}

      {convertedSize && savingsPercentage === null && (
        <div className="flex items-center gap-1 bg-blue-500/15 border border-blue-500/30 text-blue-400 px-2.5 py-1 rounded-full text-[11px] font-bold">
          <CheckCircle2 className="w-3 h-3" />
          <span>Converted</span>
        </div>
      )}
    </div>
  );
}
