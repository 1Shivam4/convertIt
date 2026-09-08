"use client";

import { useMemo, useEffect, useState } from "react";
import {
  FileText,
  FileSpreadsheet,
  Presentation,
  Maximize2,
  Sparkles,
  Loader2,
  X,
  FileCode,
} from "lucide-react";

interface PDFPreviewProps {
  file: File;
  onReset: () => void;
}

/** Derive a friendly label + icon for office document types */
function getOfficeDocMeta(
  file: File,
): { label: string; Icon: React.ElementType; color: string } | null {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  const mime = file.type;

  if (
    ["docx", "doc", "odt", "rtf"].includes(ext) ||
    mime.includes("wordprocessingml") ||
    mime === "application/msword"
  ) {
    return { label: "Word Document", Icon: FileText, color: "text-blue-400" };
  }
  if (
    ["xlsx", "xls", "ods", "csv"].includes(ext) ||
    mime.includes("spreadsheetml") ||
    mime === "application/vnd.ms-excel"
  ) {
    return {
      label: "Spreadsheet",
      Icon: FileSpreadsheet,
      color: "text-green-400",
    };
  }
  if (
    ["pptx", "ppt", "odp"].includes(ext) ||
    mime.includes("presentationml") ||
    mime === "application/vnd.ms-powerpoint"
  ) {
    return {
      label: "Presentation",
      Icon: Presentation,
      color: "text-orange-400",
    };
  }
  if (["epub"].includes(ext) || mime === "application/epub+zip") {
    return { label: "EPUB Document", Icon: FileCode, color: "text-purple-400" };
  }
  if (["txt"].includes(ext) || mime === "text/plain") {
    return { label: "Text File", Icon: FileText, color: "text-slate-400" };
  }
  return null;
}

export default function PDFPreview({ file, onReset }: PDFPreviewProps) {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);

  const isPDF =
    file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");

  useEffect(() => {
    if (!file || !isPDF) {
      setObjectUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setObjectUrl(url);
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [file, isPDF]);

  const fileSizeMB = useMemo(() => {
    return (file.size / (1024 * 1024)).toFixed(2);
  }, [file.size]);

  // ── Office document — show info card instead of PDF viewer ────────────────
  const officeMeta = getOfficeDocMeta(file);
  if (!isPDF && officeMeta) {
    const { label, Icon, color } = officeMeta;
    return (
      <div className="flex flex-col gap-4">
        {/* Top Header File Info Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 bg-[#131722]/80 backdrop-blur-md p-4 rounded-xl border border-white/10 shadow-lg">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-lg bg-white/10 border border-white/15 flex items-center justify-center shrink-0 ${color}`}
            >
              <Icon className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-semibold text-white truncate max-w-xs md:max-w-md">
                {file.name}
              </h2>
              <p className="text-xs text-slate-400">
                {fileSizeMB} MB · {label}
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

        {/* Office doc preview placeholder */}
        <div className="bg-[#131722]/90 backdrop-blur-md rounded-2xl border border-white/10 overflow-hidden shadow-2xl">
          <div className="p-4 bg-white/5 border-b border-white/10 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-red-400" />
            <span className="text-sm font-semibold text-slate-200">
              Document Ready
            </span>
          </div>
          <div className="flex flex-col items-center justify-center gap-5 py-16 px-6 text-center">
            <div
              className={`w-16 h-16 rounded-2xl bg-white/8 border border-white/10 flex items-center justify-center ${color}`}
            >
              <Icon className="w-8 h-8" />
            </div>
            <div>
              <p className="text-white font-semibold text-base">{file.name}</p>
              <p className="text-slate-400 text-sm mt-1">
                {label} · {fileSizeMB} MB
              </p>
            </div>
            <div className="px-4 py-2.5 bg-red-500/10 border border-red-500/20 rounded-xl max-w-sm">
              <p className="text-xs text-red-300 leading-relaxed">
                Preview not available for office documents. Select a target
                format on the right and click{" "}
                <span className="font-semibold text-white">Convert</span> —
                Gotenberg will process it server-side.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── PDF file — full browser viewer ────────────────────────────────────────
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
