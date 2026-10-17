"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useSearchParams } from "next/navigation";
import {
  FileText,
  SlidersHorizontal,
  Wrench,
  Shield,
  Zap,
  Cpu,
  Loader2,
  Lock,
  Unlock,
  RotateCw,
  FileArchive,
  Minimize2,
  FileCheck,
  Split,
  Layers,
  Image as ImageIcon,
  Code,
  FileCode,
  Check,
  CornerDownLeft,
} from "lucide-react";
import { toast } from "sonner";
import { usePDFConversionStore } from "@/app/store/usePDFConversionStore";
import { PDF_FORMAT_OPTIONS } from "@/app/utils/vars";
import {
  rotatePDFPages,
  deletePDFPages,
  extractPDFPages,
  mergePDFDocuments,
} from "@/app/lib/pdf/pdfLibUtils";
import {
  renderPdfPagesToImages,
  extractPdfText,
} from "@/app/lib/pdf/pdfToImageUtils";

export default function PDFTypeSelectionColumn() {
  const {
    files,
    file,
    stage,
    selectedFormatId,
    activeCategory,
    rotateAngle,
    pdfaVersion,
    password,
    splitSpan,
    watermarkText,
    htmlContent,
    markdownContent,
    pageRotations,
    deletedPages,
    selectedPages,
    concurrency,
    useQueue,
    setSelectedFormatId,
    setActiveCategory,
    setRotateAngle,
    setPdfaVersion,
    setPassword,
    setSplitSpan,
    setWatermarkText,
    setHtmlContent,
    setMarkdownContent,
    setConcurrency,
    setUseQueue,
    setJobId,
    setJobStatus,
    setProgress,
    startConversion,
    completeConversion,
    setError,
    resetConversion,
  } = usePDFConversionStore();

  const abortControllerRef = useRef<AbortController | null>(null);

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
    ].includes(fileExt)
  );

  // Sync when toolParam is present in URL (e.g. /pdf?tool=merge)
  useEffect(() => {
    if (toolParam && PDF_FORMAT_OPTIONS.some((f) => f.id === toolParam)) {
      setSelectedFormatId(toolParam);
      const target = PDF_FORMAT_OPTIONS.find((f) => f.id === toolParam);
      if (target) {
        setActiveCategory(target.category as any);
      }
    }
  }, [toolParam, setSelectedFormatId, setActiveCategory]);

  // Automatically switch format based on uploaded file type
  useEffect(() => {
    if (!activeFile) return;

    if (!isPdf && isDocument) {
      if (selectedFormatId !== "pdf") {
        setSelectedFormatId("pdf");
        setActiveCategory("document");
      }
    } else if (isPdf) {
      if (selectedFormatId === "pdf") {
        const fallback =
          toolParam &&
          PDF_FORMAT_OPTIONS.some((f) => f.id === toolParam && f.id !== "pdf")
            ? toolParam
            : "compress";
        setSelectedFormatId(fallback);
        setActiveCategory("tools");
      }
    }
  }, [
    activeFile?.name,
    isPdf,
    isDocument,
    selectedFormatId,
    toolParam,
    setSelectedFormatId,
    setActiveCategory,
  ]);

  const selectedFormatDef = useMemo(() => {
    return (
      PDF_FORMAT_OPTIONS.find((f) => f.id === selectedFormatId) ||
      PDF_FORMAT_OPTIONS[0]
    );
  }, [selectedFormatId]);

  // Filter formats dynamically by active input file and tab
  const visibleFormats = useMemo(() => {
    // If an Office document is uploaded, the only relevant action is Convert to PDF
    if (activeFile && !isPdf && isDocument) {
      return PDF_FORMAT_OPTIONS.filter((f) => f.id === "pdf");
    }

    // If a PDF is uploaded, remove "Convert to PDF"
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

  // Core conversion execution logic
  const handleConvert = useCallback(async () => {
    const activeFile = file || files[0];
    if (!activeFile && selectedFormatId !== "html-to-pdf" && selectedFormatId !== "markdown-to-pdf") {
      toast.error("Please upload a PDF document first.");
      return;
    }

    startConversion();
    abortControllerRef.current = new AbortController();
    const controller = abortControllerRef.current;

    try {
      // 1. Client-Side Interactive Rotations & Deletions via pdf-lib
      let workingFile = activeFile;
      const hasRotations = Object.keys(pageRotations).length > 0;
      const hasDeletions = deletedPages.length > 0;

      if (workingFile && (hasRotations || hasDeletions)) {
        let currentBytes: Uint8Array = new Uint8Array(await workingFile.arrayBuffer());
        if (hasRotations) {
          currentBytes = await rotatePDFPages(currentBytes.buffer as ArrayBuffer, pageRotations);
        }
        if (hasDeletions) {
          currentBytes = await deletePDFPages(currentBytes.buffer as ArrayBuffer, deletedPages);
        }
        workingFile = new File([currentBytes.buffer as ArrayBuffer], workingFile.name, {
          type: "application/pdf",
        });
      }

      // 2. Client-Side Page Split / Extraction via pdf-lib
      if (selectedFormatId === "split" && workingFile) {
        let targetPages: number[] = [];
        if (selectedPages.length > 0) {
          targetPages = selectedPages;
        } else if (splitSpan) {
          const parts = splitSpan.split(",");
          parts.forEach((p) => {
            const range = p.trim().split("-");
            if (range.length === 2) {
              const start = parseInt(range[0], 10) - 1;
              const end = parseInt(range[1], 10) - 1;
              for (let i = start; i <= end; i++) {
                if (!isNaN(i)) targetPages.push(i);
              }
            } else if (range.length === 1) {
              const num = parseInt(range[0], 10) - 1;
              if (!isNaN(num)) targetPages.push(num);
            }
          });
        }

        if (targetPages.length > 0) {
          const buf = await workingFile.arrayBuffer();
          const extracted = await extractPDFPages(buf, targetPages);
          const blob = new Blob([extracted.buffer as ArrayBuffer], { type: "application/pdf" });
          const baseName = workingFile.name.substring(0, workingFile.name.lastIndexOf(".")) || "doc";
          completeConversion(blob, `${baseName}_split.pdf`);
          return;
        }
      }

      // 3. Client-Side PDF Merge via pdf-lib
      if (selectedFormatId === "merge" && files.length > 1) {
        const buffers = await Promise.all(files.map((f) => f.arrayBuffer()));
        const mergedBytes = await mergePDFDocuments(buffers);
        const blob = new Blob([mergedBytes.buffer as ArrayBuffer], { type: "application/pdf" });
        const baseName = activeFile?.name.substring(0, activeFile.name.lastIndexOf(".")) || "merged";
        completeConversion(blob, `${baseName}_merged.pdf`);
        return;
      }

      // 4. Client-Side PDF to PNG / JPG export
      if ((selectedFormatId === "png" || selectedFormatId === "jpg") && workingFile) {
        const format = selectedFormatId === "jpg" ? "jpeg" : "png";
        const buf = await workingFile.arrayBuffer();
        const { blob, isZip } = await renderPdfPagesToImages(buf, format);
        const baseName = workingFile.name.substring(0, workingFile.name.lastIndexOf(".")) || "doc";
        const ext = isZip ? "zip" : format === "jpeg" ? "jpg" : "png";
        completeConversion(blob, `${baseName}_images.${ext}`);
        return;
      }

      // 4.5. Client-Side Plain Text (TXT) extraction
      if (selectedFormatId === "txt" && workingFile) {
        const buf = await workingFile.arrayBuffer();
        const textBlob = await extractPdfText(buf);
        const baseName = workingFile.name.substring(0, workingFile.name.lastIndexOf(".")) || "doc";
        completeConversion(textBlob, `${baseName}.txt`);
        return;
      }

      // 5. HTML to PDF
      if (selectedFormatId === "html-to-pdf") {
        if (!htmlContent.trim()) {
          throw new Error("Please enter HTML content.");
        }
        const htmlBlob = new Blob([htmlContent], { type: "text/html" });
        const htmlFile = new File([htmlBlob], "index.html", { type: "text/html" });
        const formData = new FormData();
        formData.append("files", htmlFile, "index.html");

        const res = await fetch("/api/pdf/html-to-pdf", {
          method: "POST",
          body: formData,
          signal: controller.signal,
        });
        if (!res.ok) {
          const errText = await res.text().catch(() => "HTML to PDF failed");
          throw new Error(errText);
        }
        completeConversion(await res.blob(), "converted.pdf");
        return;
      }

      // 6. Markdown to PDF
      if (selectedFormatId === "markdown-to-pdf") {
        if (!markdownContent.trim()) {
          throw new Error("Please enter Markdown content.");
        }
        const htmlWrap = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>body{font-family:sans-serif;max-width:800px;margin:40px auto;padding:0 24px;line-height:1.6}pre{background:#f4f4f4;padding:12px;border-radius:6px;overflow-x:auto}</style></head><body></body></html>`;
        const formData = new FormData();
        formData.append("files", new File([new Blob([htmlWrap])], "index.html", { type: "text/html" }));
        formData.append("files", new File([new Blob([markdownContent])], "document.md", { type: "text/markdown" }));

        const res = await fetch("/api/pdf/markdown-to-pdf", {
          method: "POST",
          body: formData,
          signal: controller.signal,
        });
        if (!res.ok) {
          const errText = await res.text().catch(() => "Markdown to PDF failed");
          throw new Error(errText);
        }
        completeConversion(await res.blob(), "converted.pdf");
        return;
      }

      // 7. Multi-File Batch Mode with Concurrency Pool
      if (files.length > 1 && selectedFormatId !== "merge") {
        const JSZip = (await import("jszip")).default;
        const zip = new JSZip();
        const total = files.length;
        let completed = 0;
        // Gotenberg endpoints have max concurrency 1; enforce sequential execution to avoid 503
        const isServerGotenberg = selectedFormatDef.endpoint.startsWith("/api/pdf");
        const limit = isServerGotenberg ? 1 : Math.max(1, Math.min(5, concurrency || 3));
        let nextIdx = 0;

        setJobStatus("PROCESSING");
        setProgress(10);

        async function batchWorker() {
          while (nextIdx < total && !controller.signal.aborted) {
            const i = nextIdx++;
            const curFile = files[i];

            let blob: Blob;

            // Handle client-side exports (PNG, JPG, TXT) directly
            if (selectedFormatId === "png" || selectedFormatId === "jpg") {
              const format = selectedFormatId === "jpg" ? "jpeg" : "png";
              const buf = await curFile.arrayBuffer();
              const result = await renderPdfPagesToImages(buf, format);
              blob = result.blob;
            } else if (selectedFormatId === "txt") {
              const buf = await curFile.arrayBuffer();
              blob = await extractPdfText(buf);
            } else {
              // Server-side conversion via Gotenberg or native routes
              const batchFormData = new FormData();
              batchFormData.append("files", curFile, curFile.name);

              if (selectedFormatId === "rotate") {
                batchFormData.append("rotateAngle", rotateAngle);
              } else if (selectedFormatId === "encrypt") {
                batchFormData.append("userPassword", password);
                batchFormData.append("ownerPassword", password);
              } else if (selectedFormatId === "decrypt") {
                batchFormData.append("password", password);
              } else if (selectedFormatId === "pdfa") {
                batchFormData.append("pdfa", pdfaVersion);
              } else if (selectedFormatId === "watermark") {
                batchFormData.append("watermarkText", watermarkText);
              }

              const batchRes = await fetch(selectedFormatDef.endpoint, {
                method: "POST",
                body: batchFormData,
                signal: controller.signal,
              });

              if (!batchRes.ok) {
                const errBody = await batchRes.text().catch(() => "");
                let detail = `status ${batchRes.status}`;
                try {
                  const parsed = JSON.parse(errBody);
                  if (parsed.error) detail = parsed.error;
                  else if (parsed.message) detail = parsed.message;
                } catch {
                  if (errBody && errBody.length < 250) {
                    detail = errBody;
                  }
                }
                throw new Error(`Failed to convert "${curFile.name}": ${detail}`);
              }

              blob = await batchRes.blob();
            }

            const base = curFile.name.substring(0, curFile.name.lastIndexOf(".")) || curFile.name;
            const ext =
              selectedFormatId === "txt"
                ? ".txt"
                : selectedFormatId === "png" || selectedFormatId === "jpg"
                ? blob.type === "application/zip"
                  ? ".zip"
                  : selectedFormatDef.extension
                : selectedFormatDef.extension;

            zip.file(`${base}${ext}`, blob);

            completed++;
            setProgress(Math.round((completed / total) * 100));
          }
        }

        await Promise.all(Array.from({ length: Math.min(limit, total) }, () => batchWorker()));
        const zipBlob = await zip.generateAsync({ type: "blob" });
        const baseName = activeFile?.name.substring(0, activeFile.name.lastIndexOf(".")) || "batch";
        completeConversion(zipBlob, `${baseName}_converted_batch.zip`);
        return;
      }

      // 8. Standard Single Document API Request
      if (!workingFile) throw new Error("No file available for conversion.");
      const formData = new FormData();
      formData.append("files", workingFile, workingFile.name);

      if (selectedFormatId === "rotate") {
        formData.append("rotateAngle", rotateAngle);
      } else if (selectedFormatId === "encrypt") {
        formData.append("userPassword", password);
        formData.append("ownerPassword", password);
      } else if (selectedFormatId === "decrypt") {
        formData.append("password", password);
      } else if (selectedFormatId === "pdfa") {
        formData.append("pdfa", pdfaVersion);
      } else if (selectedFormatId === "watermark") {
        formData.append("watermarkText", watermarkText);
      }

      let requestUrl = selectedFormatDef.endpoint;
      if (useQueue) {
        requestUrl += (requestUrl.includes("?") ? "&" : "?") + "forceAsync=true";
        formData.append("forceAsync", "true");
      }

      const res = await fetch(requestUrl, {
        method: "POST",
        body: formData,
        signal: controller.signal,
      });

      if (!res.ok && res.status !== 202) {
        const errText = await res.text().catch(() => "Conversion failed");
        let msg = errText;
        try {
          const parsed = JSON.parse(errText);
          if (parsed.error) msg = parsed.error;
          else if (parsed.message) msg = parsed.message;
        } catch {
          if (errText && errText.length < 250) {
            msg = errText;
          }
        }
        throw new Error(msg || `Server error (status ${res.status})`);
      }

      const baseName = workingFile.name.substring(0, workingFile.name.lastIndexOf(".")) || workingFile.name;
      const finalFileName = `${baseName}${selectedFormatDef.extension}`;

      // Check if response is a BullMQ asynchronous job
      const contentType = res.headers.get("content-type") || "";
      if (res.status === 202 || contentType.includes("application/json")) {
        const json = await res.json();
        if (json.mode === "async" && json.jobId) {
          setJobId(json.jobId);
          setJobStatus("QUEUED");
          setProgress(15);

          // Poll job status
          let finished = false;
          while (!finished && !controller.signal.aborted) {
            await new Promise((r) => setTimeout(r, 1200));
            if (controller.signal.aborted) break;

            const pollRes = await fetch(`/api/jobs/${json.jobId}/status`, {
              signal: controller.signal,
            });
            if (pollRes.ok) {
              const pollData = await pollRes.json();
              setJobStatus(pollData.status);
              if (pollData.progress) {
                setProgress(pollData.progress);
              } else if (pollData.status === "PROCESSING") {
                setProgress(60);
              }

              if (pollData.status === "COMPLETED") {
                const downloadUrl = pollData.downloadUrl || `/api/jobs/${json.jobId}/download`;
                const fileRes = await fetch(downloadUrl, { signal: controller.signal });
                const blob = await fileRes.blob();
                setProgress(100);
                completeConversion(blob, finalFileName);
                finished = true;
                return;
              } else if (pollData.status === "FAILED") {
                throw new Error(pollData.error || "Background BullMQ conversion job failed");
              }
            }
          }
          return;
        }
      }

      // Fast-path synchronous stream
      const resultBlob = await res.blob();
      completeConversion(resultBlob, finalFileName);
    } catch (err: any) {
      if (err.name === "AbortError") {
        console.warn("Conversion cancelled by user.");
        return;
      }
      console.error("PDF conversion error:", err);
      setError(err?.message || "Failed to convert document.");
      toast.error(err?.message || "Conversion failed.");
    } finally {
      abortControllerRef.current = null;
    }
  }, [
    file,
    files,
    selectedFormatId,
    selectedFormatDef,
    rotateAngle,
    pdfaVersion,
    password,
    splitSpan,
    watermarkText,
    htmlContent,
    markdownContent,
    pageRotations,
    deletedPages,
    selectedPages,
    concurrency,
    useQueue,
    startConversion,
    completeConversion,
    setError,
    setJobId,
    setJobStatus,
    setProgress,
  ]);

  // Global Enter Key Listener to trigger conversion
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter" && stage !== "converting") {
        const activeElem = document.activeElement;
        const isTextInput =
          activeElem?.tagName === "INPUT" ||
          activeElem?.tagName === "TEXTAREA";
        if (!isTextInput) {
          e.preventDefault();
          handleConvert();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [stage, handleConvert]);

  return (
    <section className="h-full flex flex-col min-h-0 studio-card p-4 sm:p-5 overflow-hidden">
      {/* ── Header ────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between shrink-0 pb-3 sm:pb-4 border-b border-white/8">
        <div className="flex items-center gap-3">
          <div className="studio-badge-step">
            <SlidersHorizontal className="w-4 h-4" />
          </div>
          <div>
            <h2 className="studio-step-title">2. Operations &amp; Format</h2>
            <p className="studio-step-subtitle">
              Choose conversion target or PDF tool
            </p>
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
                isActive
                  ? "bg-red-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
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
                  <strong className="text-white">PDF Document Active:</strong> Choose a PDF operation below (Compress, Images, Protect, Rotate, Split)
                </>
              ) : isDocument ? (
                <>
                  <strong className="text-white">{fileExt?.toUpperCase()} Document Active:</strong> Converting directly to standard PDF format
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
                onClick={() => setSelectedFormatId(fmt.id)}
                disabled={stage === "converting"}
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
                  <h4 className="text-xs font-bold text-white leading-tight">
                    {fmt.name}
                  </h4>
                  <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">
                    {fmt.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Selected Tool Options Panel */}
        <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-white/5">
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <span>Configuration:</span>
              <span className="text-red-400">{selectedFormatDef.name}</span>
            </span>
            <span className="text-[10px] font-mono text-slate-400">
              {selectedFormatDef.category}
            </span>
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
                    onClick={() => setRotateAngle(angle)}
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
            </div>
          )}

          {/* Split / Extract Options */}
          {selectedFormatId === "split" && (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Page Range</label>
              <input
                type="text"
                value={splitSpan}
                onChange={(e) => setSplitSpan(e.target.value)}
                placeholder="e.g. 1-3, 5, 8-10"
                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-500"
              />
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
                value={watermarkText}
                onChange={(e) => setWatermarkText(e.target.value)}
                placeholder="CONFIDENTIAL"
                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-500"
              />
            </div>
          )}

          {/* Encrypt Password */}
          {selectedFormatId === "encrypt" && (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Set Document Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password to lock PDF..."
                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-500"
              />
            </div>
          )}

          {/* Decrypt Password */}
          {selectedFormatId === "decrypt" && (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Current PDF Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password to unlock PDF..."
                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-500"
              />
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
                    onClick={() => setPdfaVersion(ver)}
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
            </div>
          )}

          {/* General descriptions if no extra form needed */}
          {!["rotate", "split", "watermark", "encrypt", "decrypt", "pdfa"].includes(selectedFormatId) && (
            <p className="text-xs text-slate-400 leading-relaxed">
              {selectedFormatDef.description}. Powered by high-speed serverless conversion engine.
            </p>
          )}
        </div>

        {/* ── BullMQ Queue & Concurrency Controller ──────────────────────── */}
        <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 text-slate-300 font-medium">
              <Cpu className="w-3.5 h-3.5 text-red-400" />
              <span>Concurrency:</span>
            </div>
            <div className="inline-flex rounded-lg bg-black/40 p-0.5 border border-white/10">
              {[
                { val: 1, label: "1x" },
                { val: 3, label: "3x" },
                { val: 5, label: "5x Turbo" },
              ].map((opt) => (
                <button
                  key={opt.val}
                  type="button"
                  onClick={() => setConcurrency(opt.val)}
                  disabled={stage === "converting"}
                  className={`px-2 py-0.5 rounded-md text-[11px] font-semibold transition-all ${
                    concurrency === opt.val
                      ? "bg-red-600 text-white shadow-sm"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-400 text-[11px]">Async Queue:</span>
            <button
              type="button"
              onClick={() => setUseQueue(!useQueue)}
              disabled={stage === "converting"}
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                useQueue ? "bg-red-600" : "bg-white/10"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                  useQueue ? "translate-x-4" : "translate-x-0"
                }`}
              />
            </button>
            <span
              className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${
                useQueue
                  ? "bg-red-500/10 text-red-400 border-red-500/30"
                  : "bg-white/5 text-slate-400 border-white/10"
              }`}
            >
              {useQueue ? "BullMQ" : "Direct"}
            </span>
          </div>
        </div>
      </div>

      {/* ── Convert Submit Button ──────────────────────────────────────── */}
      <div className="shrink-0 pt-3 border-t border-white/8">
        <button
          type="button"
          onClick={handleConvert}
          disabled={stage === "converting" || (!file && files.length === 0)}
          className="w-full py-3.5 px-4 rounded-xl font-bold text-sm bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white shadow-lg shadow-red-600/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
        >
          {stage === "converting" ? (
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
    </section>
  );
}
