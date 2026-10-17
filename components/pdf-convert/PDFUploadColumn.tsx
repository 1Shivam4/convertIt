"use client";

import { useRef, useState, useEffect, ChangeEvent, DragEvent } from "react";
import {
  FileText,
  CloudUpload,
  Plus,
  Trash2,
  Layers,
  Sparkles,
  Eye,
  CheckCircle2,
  X,
  FileCode,
  FileSpreadsheet,
} from "lucide-react";
import { toast } from "sonner";
import { usePDFConversionStore } from "@/app/store/usePDFConversionStore";
import { useSession } from "@/app/lib/auth-client";
import { PLAN_LIMITS, formatFileSize, type Plan } from "@/app/lib/plans";
import { isPdfFile, isDocumentForPdf } from "@/app/lib/file/pdf-format-guards";
import PDFPageGrid from "@/components/pdf-converter/PDFPageGrid";

export default function PDFUploadColumn() {
  const { data: session } = useSession();
  const userPlan: Plan = session?.user
    ? (((session.user as any).plan as Plan) ?? "FREE")
    : "GUEST";
  const planLimits = PLAN_LIMITS[userPlan];

  const {
    files,
    file,
    selectedIndex,
    stage,
    setFile,
    addFiles,
    removeFile,
    setSelectedIndex,
    clearFiles,
    setPageManipulations,
    pageRotations,
    deletedPages,
    selectedPages,
  } = usePDFConversionStore();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showPageGrid, setShowPageGrid] = useState(false);
  const [pageCount, setPageCount] = useState<number | null>(null);

  const activeFile = files[selectedIndex] || file || null;

  // Extract page count for PDF using pdf-lib if possible
  useEffect(() => {
    if (!activeFile || !isPdfFile(activeFile)) {
      setPageCount(null);
      return;
    }

    let isMounted = true;
    activeFile.arrayBuffer().then(async (buf) => {
      try {
        const { PDFDocument } = await import("@cantoo/pdf-lib");
        const doc = await PDFDocument.load(buf, { ignoreEncryption: true });
        if (isMounted) setPageCount(doc.getPageCount());
      } catch {
        if (isMounted) setPageCount(null);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [activeFile]);

  const handleIncomingFiles = (incoming: File[]) => {
    const valid = incoming.filter((f) => isPdfFile(f) || isDocumentForPdf(f));

    if (valid.length === 0) {
      toast.error("Please select a PDF or supported document (DOCX, XLSX, PPTX, TXT, MD, HTML).");
      return;
    }

    for (const f of valid) {
      if (f.size > planLimits.maxFileSizeBytes) {
        toast.error(`"${f.name}" exceeds the ${planLimits.label} limit of ${formatFileSize(planLimits.maxFileSizeBytes)}.`);
        return;
      }
    }

    addFiles(valid);
    toast.success(`Loaded ${valid.length} file${valid.length > 1 ? "s" : ""}`);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (stage === "converting") return;
    const dropped = Array.from(e.dataTransfer.files);
    handleIncomingFiles(dropped);
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleIncomingFiles(Array.from(e.target.files));
    }
    e.target.value = "";
  };

  return (
    <section className="h-full flex flex-col min-h-0 studio-card p-4 sm:p-5 overflow-hidden">
      {/* ── Column Header ─────────────────────────────────────────────── */}
      <div className="flex items-center justify-between shrink-0 pb-3 sm:pb-4 border-b border-white/8">
        <div className="flex items-center gap-3">
          <div className="studio-badge-step">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <h2 className="studio-step-title">1. Document &amp; Files</h2>
            <p className="studio-step-subtitle">
              {files.length > 0
                ? `${files.length} document${files.length > 1 ? "s" : ""} in queue`
                : "Upload or drop documents to begin"}
            </p>
          </div>
        </div>

        {files.length > 0 && (
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={stage === "converting"}
              className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 transition-colors flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add</span>
            </button>
            <button
              type="button"
              onClick={clearFiles}
              disabled={stage === "converting"}
              className="p-1 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
              title="Clear all files"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".pdf,.docx,.doc,.xlsx,.xls,.pptx,.ppt,.odt,.rtf,.txt,.html,.md,.csv,.epub,application/pdf"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* ── Scrollable Body ────────────────────────────────────────────── */}
      <div className="flex-1 min-h-0 overflow-y-auto studio-scrollbar pt-3 space-y-4">
        {/* Dropzone Area (Shown if no files, or minimal banner if files exist) */}
        {files.length === 0 ? (
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
            className={`studio-dropzone p-8 text-center cursor-pointer flex flex-col items-center justify-center min-h-[280px] gap-3.5 ${
              isDragging ? "drag-active" : ""
            }`}
          >
            <div className="w-14 h-14 rounded-2xl bg-red-600/10 border border-red-500/20 flex items-center justify-center text-red-500">
              <CloudUpload className="w-7 h-7" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">
                Drag &amp; drop PDF or documents here
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Supports PDF, Word (DOCX), Excel (XLSX), PPTX, Text, and Markdown
              </p>
            </div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs font-medium text-slate-300">
              <span>Browse files from device</span>
            </div>
          </div>
        ) : (
          <>
            {/* Active Document Card Preview */}
            {activeFile && (
              <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-red-600/20 border border-red-500/30 flex items-center justify-center text-red-400 shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-white truncate max-w-[200px]" title={activeFile.name}>
                        {activeFile.name}
                      </h4>
                      <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-400">
                        <span>{formatFileSize(activeFile.size)}</span>
                        {pageCount !== null && (
                          <>
                            <span>•</span>
                            <span className="text-red-400 font-medium">{pageCount} page{pageCount > 1 ? "s" : ""}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {isPdfFile(activeFile) && (
                    <button
                      type="button"
                      onClick={() => setShowPageGrid(!showPageGrid)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all flex items-center gap-1 ${
                        showPageGrid
                          ? "bg-red-600 text-white border-red-500"
                          : "bg-white/5 text-slate-300 hover:text-white border-white/10"
                      }`}
                    >
                      <Layers className="w-3.5 h-3.5" />
                      <span>{showPageGrid ? "Hide Grid" : "Pages Grid"}</span>
                    </button>
                  )}
                </div>

                {/* Page Manipulations Summary Pill */}
                {(Object.keys(pageRotations).length > 0 ||
                  deletedPages.length > 0 ||
                  selectedPages.length > 0) && (
                  <div className="flex flex-wrap gap-1.5 pt-2 border-t border-white/5 text-[10px]">
                    {Object.keys(pageRotations).length > 0 && (
                      <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-300 border border-amber-500/20">
                        {Object.keys(pageRotations).length} rotated
                      </span>
                    )}
                    {deletedPages.length > 0 && (
                      <span className="px-2 py-0.5 rounded-md bg-red-500/10 text-red-300 border border-red-500/20">
                        {deletedPages.length} deleted
                      </span>
                    )}
                    {selectedPages.length > 0 && (
                      <span className="px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-300 border border-blue-500/20">
                        {selectedPages.length} selected for extract
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Visual Page Grid (When toggled open) */}
            {showPageGrid && activeFile && isPdfFile(activeFile) && (
              <div className="p-3 rounded-xl bg-black/40 border border-red-500/20 space-y-2 animate-in fade-in">
                <div className="flex items-center justify-between pb-2 border-b border-white/10 text-xs">
                  <span className="font-semibold text-slate-200">Interactive Page Grid</span>
                  <span className="text-[10px] text-slate-400">Rotate, delete, or pick pages</span>
                </div>
                <PDFPageGrid
                  file={activeFile}
                  onPageManipulationsChange={setPageManipulations}
                />
              </div>
            )}

            {/* Batch Document List */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400 px-1">
                <span>Queue ({files.length})</span>
                <span>Click to view</span>
              </div>

              <div className="space-y-1.5 max-h-[300px] overflow-y-auto studio-scrollbar pr-1">
                {files.map((f, idx) => {
                  const isSelected = idx === selectedIndex;
                  return (
                    <div
                      key={`${f.name}-${idx}`}
                      onClick={() => setSelectedIndex(idx)}
                      className={`p-2.5 rounded-xl border flex items-center justify-between gap-2.5 cursor-pointer transition-all ${
                        isSelected
                          ? "bg-red-500/10 border-red-500/40 text-white"
                          : "bg-white/[0.02] border-white/8 text-slate-300 hover:border-white/20 hover:bg-white/[0.04]"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="text-[11px] font-mono text-slate-500 w-4 text-center shrink-0">
                          {idx + 1}
                        </span>
                        <FileText
                          className={`w-4 h-4 shrink-0 ${
                            isSelected ? "text-red-400" : "text-slate-400"
                          }`}
                        />
                        <div className="min-w-0">
                          <p className="text-xs font-medium truncate max-w-[190px]">
                            {f.name}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            {formatFileSize(f.size)}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFile(idx);
                        }}
                        disabled={stage === "converting"}
                        className="p-1 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors shrink-0"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── Footer Plan Note ───────────────────────────────────────────── */}
      <div className="shrink-0 pt-3 border-t border-white/8 text-[11px] text-slate-400 flex items-center justify-between">
        <span>Tier: <strong className="text-slate-200">{planLimits.label}</strong></span>
        <span>Max file: <strong className="text-slate-200">{formatFileSize(planLimits.maxFileSizeBytes)}</strong></span>
      </div>
    </section>
  );
}
