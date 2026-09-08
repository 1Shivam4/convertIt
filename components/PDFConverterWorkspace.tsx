"use client";

import { useRef, useState, type ChangeEvent, type DragEvent } from "react";
import { CloudUpload, FileText, Layers, Trash2, X } from "lucide-react";
import { useConverterStore } from "@/app/store/useFileDetectionStore";
import PDFToConvertor from "@/components/PDFToConvertor";

function formatBytes(bytes: number): string {
  if (!bytes) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / k ** i).toFixed(1))} ${sizes[i]}`;
}

export default function PDFConverterWorkspace() {
  const { file, files, stage, setFile, addFiles, setSourceType, reset } =
    useConverterStore();

  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const PDF_SOURCE_TYPE = { extension: "pdf", mimeType: "application/pdf" };

  /** Filter an incoming FileList/array to only valid PDFs */
  const filterPDFs = (incoming: File[]): File[] =>
    incoming.filter(
      (f) =>
        f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf"),
    );

  const handleIncoming = (incoming: File[]) => {
    const valid = filterPDFs(incoming);
    if (valid.length === 0) return;

    if (valid.length === 1) {
      // Single file — use setFile so stage machine runs correctly
      setFile(valid[0]);
      setSourceType(PDF_SOURCE_TYPE);
    } else {
      // Multiple PDFs — load all, skip per-file detection
      addFiles(valid);
      setSourceType(PDF_SOURCE_TYPE);
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    handleIncoming(Array.from(e.dataTransfer.files));
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleIncoming(Array.from(e.target.files));
    }
    e.target.value = "";
  };

  // Once a PDF is loaded, hand off entirely to the existing PDFToConvertor workspace
  if (
    file &&
    (stage === "ready" ||
      stage === "converting" ||
      stage === "completed" ||
      stage === "error")
  ) {
    return <PDFToConvertor />;
  }

  // ── Drop zone UI ──────────────────────────────────────────────────────────
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-6">
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,application/pdf"
        multiple
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Dropzone card */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          setIsDragging(false);
        }}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`
          relative bg-[#131722]/90 backdrop-blur-md rounded-2xl border-2
          transition-all duration-300 p-8 md:p-14 text-center cursor-pointer group shadow-2xl
          ${
            isDragging
              ? "border-red-500 bg-red-500/10 scale-[1.01]"
              : "border-white/10 hover:border-red-500/40 hover:bg-[#161b28]"
          }
        `}
      >
        <div className="flex flex-col items-center gap-5">
          {/* Icon cluster */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400">
              <FileText className="w-5 h-5" />
            </div>
            <div
              className={`w-14 h-14 rounded-2xl border flex items-center justify-center transition-all duration-300 group-hover:scale-110 ${
                isDragging
                  ? "bg-red-600 border-red-500 text-white"
                  : "bg-red-600/20 border-red-500/30 text-red-500"
              }`}
            >
              <CloudUpload className="w-7 h-7" />
            </div>
            <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400">
              <Layers className="w-5 h-5" />
            </div>
          </div>

          {/* Text */}
          <div className="space-y-1.5">
            <h2 className="text-xl md:text-2xl font-bold text-white">
              Drop your PDF here, or click to browse
            </h2>
            <p className="text-sm text-slate-400">
              Drag multiple PDFs to merge them · supports PDF up to 500 MB
            </p>
          </div>

          {/* CTA button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              fileInputRef.current?.click();
            }}
            className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-500 text-white font-semibold px-6 py-3 rounded-lg text-sm shadow-lg shadow-red-600/30 transition-all"
          >
            <CloudUpload className="w-4 h-4" />
            Select PDF File
          </button>

          {/* Format chips */}
          <div className="flex flex-wrap justify-center gap-2 mt-1">
            {[
              "PDF → DOCX",
              "PDF → XLSX",
              "PDF → PPTX",
              "Compress",
              "Merge",
              "Split",
              "Encrypt",
              "Rotate",
            ].map((label) => (
              <span
                key={label}
                className="px-2.5 py-0.5 text-[10px] font-semibold tracking-wide rounded-full bg-white/5 text-slate-400 border border-white/8"
              >
                {label}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Multi-file queue preview — shown when files are detected but stage is still "detecting" */}
      {files.length > 1 && stage === "detecting" && (
        <div className="p-4 bg-[#0e1117] border border-white/10 rounded-2xl space-y-2">
          <div className="flex items-center gap-2 pb-2 border-b border-white/10">
            <Layers className="w-4 h-4 text-red-400" />
            <span className="text-xs font-bold text-white">
              {files.length} PDFs queued for merge
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                reset();
              }}
              className="ml-auto text-slate-500 hover:text-red-400 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          {files.map((f, idx) => (
            <div
              key={`${f.name}-${idx}`}
              className="flex items-center gap-3 px-3 py-2 bg-white/5 rounded-xl border border-white/8"
            >
              <FileText className="w-4 h-4 text-red-400 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-white truncate">
                  {f.name}
                </p>
                <p className="text-[10px] text-slate-500">
                  {formatBytes(f.size)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
