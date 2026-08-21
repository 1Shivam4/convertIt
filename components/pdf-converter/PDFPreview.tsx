"use client";

import { useMemo, useEffect, useState } from "react";
import { FileText, Maximize2, Sparkles, Loader2, X } from "lucide-react";

interface PDFPreviewProps {
  file: File;
  onReset: () => void;
}

export default function PDFPreview({ file, onReset }: PDFPreviewProps) {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!file) {
      setObjectUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setObjectUrl(url);
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [file]);

  const fileSizeMB = useMemo(() => {
    return (file.size / (1024 * 1024)).toFixed(2);
  }, [file.size]);

  return (
    <div className="flex flex-col gap-4">
      {/* Top Header File Info Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-[#131722]/80 backdrop-blur-md p-4 rounded-xl border border-white/10 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-red-600/20 border border-red-500/30 flex items-center justify-center text-red-500 shrink-0">
            <FileText className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-white truncate max-w-xs md:max-w-md">
              {file.name}
            </h2>
            <p className="text-xs text-slate-400">
              {fileSizeMB} MB • PDF Document
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onReset}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 transition-colors"
        >
          <X className="w-3.5 h-3.5" />
          Change File
        </button>
      </div>

      {/* Main Viewer Card */}
      <div className="bg-[#131722]/90 backdrop-blur-md rounded-2xl border border-white/10 overflow-hidden shadow-2xl flex flex-col h-[600px]">
        <div className="p-4 bg-white/5 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-red-400" />
            <span className="text-sm font-semibold text-slate-200">
              PDF Preview
            </span>
          </div>
          {objectUrl && (
            <a
              href={objectUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-xs text-red-400 hover:text-red-300 font-medium transition-colors"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              Open Fullscreen
            </a>
          )}
        </div>

        <div className="flex-1 bg-[#0b0d11] relative overflow-hidden flex items-center justify-center p-2">
          {objectUrl ? (
            <object
              data={`${objectUrl}#toolbar=1&navpanes=0&scrollbar=1`}
              type="application/pdf"
              className="w-full h-full rounded-lg border border-white/5"
            >
              <iframe
                src={`${objectUrl}#toolbar=1&navpanes=0`}
                className="w-full h-full rounded-lg border border-white/5"
                title="PDF Preview"
              >
                <div className="p-8 text-center text-slate-400">
                  <FileText className="w-12 h-12 mx-auto text-slate-500 mb-2" />
                  <p>Browser preview not supported.</p>
                  <a
                    href={objectUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-red-400 hover:underline text-sm font-medium mt-2 inline-block"
                  >
                    Open PDF in new tab
                  </a>
                </div>
              </iframe>
            </object>
          ) : (
            <div className="text-slate-400 text-sm flex items-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin text-red-500" />
              Loading PDF viewer...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
