"use client";

import { useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  FileText,
  SlidersHorizontal,
  Wrench,
  Zap,
  Loader2,
  Check,
  CornerDownLeft,
} from "lucide-react";
import { usePDFConversionStore } from "@/app/store/usePDFConversionStore";
import { PDF_FORMAT_OPTIONS } from "@/app/utils/vars";
import {
  pdfConverterSchema,
  PDFConverterFormValues,
} from "@/app/lib/schemas/pdfConverterSchema";
import { usePDFConversion } from "@/app/hooks/usePDFConversion";

export default function PDFTypeSelectionColumn() {
  const {
    files,
    file,
    stage,
    selectedPages,
    activeCategory,
    setSelectedFormatId,
    setActiveCategory,
    setRotateAngle,
    setPdfaVersion,
  } = usePDFConversionStore();

  const searchParams = useSearchParams();
  const toolParam = searchParams.get("tool");

  const activeFile = file || files[0];
  const fileExt = activeFile?.name.split(".").pop()?.toLowerCase();
  const isPdf = Boolean(fileExt === "pdf" || activeFile?.type === "application/pdf");
  const isDocument = Boolean(
    fileExt &&
    [
      "doc",
      "docx",
      "xls",
      "xlsx",
      "ppt",
      "pptx",
      "odt",
      "ods",
      "odp",
      "rtf",
      "txt",
      "md",
      "html",
      "epub",
      "csv",
    ].includes(fileExt),
  );

  // ── 1. React Hook Form with Zod Resolver ───────────────────────────────────
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<PDFConverterFormValues>({
    resolver: zodResolver(pdfConverterSchema),
    defaultValues: {
      selectedFormatId:
        toolParam && PDF_FORMAT_OPTIONS.some((f) => f.id === toolParam)
          ? toolParam
          : "compress",
      rotateAngle: "90",
      pdfaVersion: "PDF/A-1b",
      password: "",
      splitSpan: "",
      watermarkText: "CONFIDENTIAL",
      htmlContent: "",
      markdownContent: "",
    },
  });

  const selectedFormatId = watch("selectedFormatId");
  const rotateAngle = watch("rotateAngle");
  const pdfaVersion = watch("pdfaVersion");

  // ── 2. TanStack Query Conversion Hook ──────────────────────────────────────
  const { convertDocument, isPending } = usePDFConversion();

  const onSubmit = (values: PDFConverterFormValues) => {
    convertDocument(values);
  };

  // Sync format when URL query param changes
  useEffect(() => {
    if (toolParam && PDF_FORMAT_OPTIONS.some((f) => f.id === toolParam)) {
      setValue("selectedFormatId", toolParam, { shouldValidate: true });
      setSelectedFormatId(toolParam);
      const target = PDF_FORMAT_OPTIONS.find((f) => f.id === toolParam);
      if (target) {
        setActiveCategory(target.category as any);
      }
    }
  }, [toolParam, setValue, setSelectedFormatId, setActiveCategory]);

  // Sync visual page selections with splitSpan form field
  useEffect(() => {
    if (selectedPages.length > 0 && selectedFormatId === "split") {
      setValue("splitSpan", selectedPages.map((p) => p + 1).join(", "), {
        shouldValidate: true,
      });
    }
  }, [selectedPages, selectedFormatId, setValue]);

  // Automatically switch format based on uploaded file type
  useEffect(() => {
    if (!activeFile) return;

    if (!isPdf && isDocument) {
      if (selectedFormatId !== "pdf") {
        setValue("selectedFormatId", "pdf", { shouldValidate: true });
        setSelectedFormatId("pdf");
        setActiveCategory("document");
      }
    } else if (isPdf) {
      if (selectedFormatId === "pdf") {
        const fallback =
          toolParam && PDF_FORMAT_OPTIONS.some((f) => f.id === toolParam && f.id !== "pdf")
            ? toolParam
            : "compress";
        setValue("selectedFormatId", fallback, { shouldValidate: true });
        setSelectedFormatId(fallback);
        setActiveCategory("tools");
      }
    }
  }, [activeFile?.name, isPdf, isDocument, selectedFormatId, toolParam, setValue, setSelectedFormatId, setActiveCategory]);

  const selectedFormatDef = useMemo(() => {
    return PDF_FORMAT_OPTIONS.find((f) => f.id === selectedFormatId) || PDF_FORMAT_OPTIONS[0];
  }, [selectedFormatId]);

  // Filter formats dynamically by active input file and tab
  const visibleFormats = useMemo(() => {
    if (activeFile && !isPdf && isDocument) {
      return PDF_FORMAT_OPTIONS.filter((f) => f.id === "pdf");
    }

    let list = PDF_FORMAT_OPTIONS;
    if (activeFile && isPdf) {
      list = PDF_FORMAT_OPTIONS.filter((f) => f.id !== "pdf");
    }

    if (activeCategory === "all") return list;
    if (activeCategory === "document") {
      return list.filter((f) => f.category === "document");
    }
    return list.filter((f) => f.category === "tools");
  }, [activeCategory, activeFile, isPdf, isDocument]);

  const handleSelectFormat = (fmtId: string) => {
    setValue("selectedFormatId", fmtId, { shouldValidate: true });
    setSelectedFormatId(fmtId);
  };

  const handleSelectAngle = (angle: "90" | "180" | "270") => {
    setValue("rotateAngle", angle, { shouldValidate: true });
    setRotateAngle(angle);
  };

  const handleSelectPdfa = (ver: "PDF/A-1b" | "PDF/A-2b" | "PDF/A-3b") => {
    setValue("pdfaVersion", ver, { shouldValidate: true });
    setPdfaVersion(ver);
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="h-full flex flex-col min-h-0 studio-card p-4 sm:p-5 overflow-hidden"
    >
      {/* ── Header ────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between shrink-0 pb-3 sm:pb-4 border-b border-white/8">
        <div className="flex items-center gap-3">
          <div className="studio-badge-step">
            <SlidersHorizontal className="w-4 h-4" />
          </div>
          <div>
            <h2 className="studio-step-title">2. Operations &amp; Format</h2>
            <p className="studio-step-subtitle">Choose conversion target or PDF tool</p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-400 bg-white/5 px-2 py-1 rounded-lg border border-white/10">
          <CornerDownLeft className="w-3 h-3 text-slate-400" />
          <span>Press </span>
          <kbd className="px-1 py-0.2 bg-white/10 rounded font-mono text-[9px] text-white">Enter</kbd>
        </div>
      </div>

      {/* ── Tabs Navigation ────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-white/[0.03] border border-white/8 shrink-0 my-3">
        {[
          { id: "all", label: "All Tools", icon: Zap },
          { id: "document", label: "Convert", icon: FileText },
          { id: "tools", label: "PDF Tools", icon: Wrench },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeCategory === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveCategory(tab.id as any)}
              className={`py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                isActive ? "bg-red-600 text-white shadow-sm" : "text-slate-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ── Scrollable Body ────────────────────────────────────────────── */}
      <div className="flex-1 min-h-0 overflow-y-auto studio-scrollbar space-y-4 pr-1">
        {/* Contextual Direction Badge */}
        {activeFile && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.03] border border-white/10 text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0 animate-pulse" />
            <span className="text-slate-300">
              {isPdf ? (
                <>
                  <strong className="text-white">PDF Document Active:</strong> Choose a PDF operation below (Compress,
                  Images, Protect, Rotate, Split)
                </>
              ) : isDocument ? (
                <>
                  <strong className="text-white">{fileExt?.toUpperCase()} Document Active:</strong> Converting directly
                  to standard PDF format
                </>
              ) : (
                <>
                  <strong className="text-white">File Active:</strong> Choose your target conversion format
                </>
              )}
            </span>
          </div>
        )}

        {/* Format Tiles Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {visibleFormats.map((fmt) => {
            const isSelected = fmt.id === selectedFormatId;
            return (
              <button
                key={fmt.id}
                type="button"
                onClick={() => handleSelectFormat(fmt.id)}
                disabled={isPending}
                className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all ${
                  isSelected
                    ? "bg-red-500/10 border-red-500 text-white shadow-md shadow-red-600/10"
                    : "bg-white/[0.02] border-white/8 text-slate-300 hover:border-white/20 hover:bg-white/[0.04]"
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1.5">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-red-400 font-bold bg-red-500/10 px-1.5 py-0.5 rounded border border-red-500/20">
                    {fmt.extension || "PDF"}
                  </span>
                  {isSelected && (
                    <div className="w-4 h-4 rounded-full bg-red-600 flex items-center justify-center text-white">
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    </div>
                  )}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white leading-tight">{fmt.name}</h4>
                  <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">{fmt.description}</p>
                </div>
              </button>
            );
          })}
        </div>
        {errors.selectedFormatId && (
          <p className="text-xs text-red-400 mt-1">{errors.selectedFormatId.message}</p>
        )}

        {/* Selected Tool Options Panel */}
        <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-white/5">
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <span>Configuration:</span>
              <span className="text-red-400">{selectedFormatDef.name}</span>
            </span>
            <span className="text-[10px] font-mono text-slate-400">{selectedFormatDef.category}</span>
          </div>

          {/* Rotate Options */}
          {selectedFormatId === "rotate" && (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Rotation Angle</label>
              <div className="grid grid-cols-3 gap-2">
                {(["90", "180", "270"] as const).map((angle) => (
                  <button
                    key={angle}
                    type="button"
                    onClick={() => handleSelectAngle(angle)}
                    className={`py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                      rotateAngle === angle
                        ? "bg-red-600 text-white border-red-500"
                        : "bg-white/5 text-slate-300 border-white/10 hover:text-white"
                    }`}
                  >
                    {angle}°
                  </button>
                ))}
              </div>
              {errors.rotateAngle && (
                <p className="text-xs text-red-400">{errors.rotateAngle.message}</p>
              )}
            </div>
          )}

          {/* Split / Extract Options */}
          {selectedFormatId === "split" && (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Page Range</label>
              <input
                type="text"
                {...register("splitSpan")}
                placeholder="e.g. 1-3, 5, 8-10"
                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-500"
              />
              {errors.splitSpan && (
                <p className="text-xs text-red-400">{errors.splitSpan.message}</p>
              )}
              <p className="text-[10px] text-slate-400">
                Or select specific pages in the interactive Pages Grid in column 1.
              </p>
            </div>
          )}

          {/* Watermark Options */}
          {selectedFormatId === "watermark" && (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Watermark Text</label>
              <input
                type="text"
                {...register("watermarkText")}
                placeholder="CONFIDENTIAL"
                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-500"
              />
              {errors.watermarkText && (
                <p className="text-xs text-red-400">{errors.watermarkText.message}</p>
              )}
            </div>
          )}

          {/* Encrypt Password */}
          {selectedFormatId === "encrypt" && (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Set Document Password</label>
              <input
                type="password"
                {...register("password")}
                placeholder="Enter password to lock PDF..."
                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-500"
              />
              {errors.password && (
                <p className="text-xs text-red-400">{errors.password.message}</p>
              )}
            </div>
          )}

          {/* Decrypt Password */}
          {selectedFormatId === "decrypt" && (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Current PDF Password</label>
              <input
                type="password"
                {...register("password")}
                placeholder="Enter password to unlock PDF..."
                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-500"
              />
              {errors.password && (
                <p className="text-xs text-red-400">{errors.password.message}</p>
              )}
            </div>
          )}

          {/* PDF/A Standard */}
          {selectedFormatId === "pdfa" && (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Archival Standard</label>
              <div className="grid grid-cols-3 gap-2">
                {(["PDF/A-1b", "PDF/A-2b", "PDF/A-3b"] as const).map((ver) => (
                  <button
                    key={ver}
                    type="button"
                    onClick={() => handleSelectPdfa(ver)}
                    className={`py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                      pdfaVersion === ver
                        ? "bg-red-600 text-white border-red-500"
                        : "bg-white/5 text-slate-300 border-white/10 hover:text-white"
                    }`}
                  >
                    {ver}
                  </button>
                ))}
              </div>
              {errors.pdfaVersion && (
                <p className="text-xs text-red-400">{errors.pdfaVersion.message}</p>
              )}
            </div>
          )}

          {/* HTML to PDF Content */}
          {selectedFormatId === "html-to-pdf" && (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">HTML Source</label>
              <textarea
                {...register("htmlContent")}
                rows={4}
                placeholder="<h1>Hello World</h1><p>Converted via Gotenberg</p>"
                className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-xs text-white font-mono placeholder-slate-500 focus:outline-none focus:border-red-500"
              />
              {errors.htmlContent && (
                <p className="text-xs text-red-400">{errors.htmlContent.message}</p>
              )}
            </div>
          )}

          {/* Markdown to PDF Content */}
          {selectedFormatId === "markdown-to-pdf" && (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Markdown Source</label>
              <textarea
                {...register("markdownContent")}
                rows={4}
                placeholder="# Document Title&#10;&#10;Write markdown content here..."
                className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-xs text-white font-mono placeholder-slate-500 focus:outline-none focus:border-red-500"
              />
              {errors.markdownContent && (
                <p className="text-xs text-red-400">{errors.markdownContent.message}</p>
              )}
            </div>
          )}

          {/* General descriptions if no extra form needed */}
          {!["rotate", "split", "watermark", "encrypt", "decrypt", "pdfa", "html-to-pdf", "markdown-to-pdf"].includes(
            selectedFormatId,
          ) && (
            <p className="text-xs text-slate-400 leading-relaxed">
              {selectedFormatDef.description}. Powered by high-speed serverless conversion engine.
            </p>
          )}
        </div>
      </div>

      {/* ── Convert Submit Button ──────────────────────────────────────── */}
      <div className="shrink-0 pt-3 border-t border-white/8">
        <button
          type="submit"
          disabled={isPending || (!activeFile && selectedFormatId !== "html-to-pdf" && selectedFormatId !== "markdown-to-pdf")}
          className="w-full py-3.5 px-4 rounded-xl font-bold text-sm bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white shadow-lg shadow-red-600/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          {isPending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Converting Document...</span>
            </>
          ) : (
            <>
              <Zap className="w-4 h-4 fill-white" />
              <span>Convert to {selectedFormatDef.name}</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}
