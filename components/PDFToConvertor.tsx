"use client";

import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CornerDownLeft, Cpu, Sliders, Zap, Check } from "lucide-react";

import { useConverterStore } from "@/app/store/useFileDetectionStore";
import { usePDFConversionStore } from "@/app/store/usePDFConversionStore";
import { PDF_FORMAT_OPTIONS } from "@/app/utils/vars";
import {
  pdfConverterSchema,
  PDFConverterFormValues,
} from "@/app/lib/schemas/pdfConverterSchema";

import PDFPreview from "./pdf-converter/PDFPreview";
import FormatSelector from "./pdf-converter/FormatSelector";
import ToolOptions from "./pdf-converter/ToolOptions";
import ConversionStatus from "./pdf-converter/ConversionStatus";
import PDFPageGrid from "./pdf-converter/PDFPageGrid";
import PDFFileList from "./pdf-converter/PDFFileList";
import {
  rotatePDFPages,
  deletePDFPages,
  extractPDFPages,
  mergePDFDocuments,
} from "@/app/lib/pdf/pdfLibUtils";
import { renderPdfPagesToImages } from "@/app/lib/pdf/pdfToImageUtils";

export default function PDFToConvertor() {
  const pdfStore = usePDFConversionStore();
  const converterStore = useConverterStore();

  const file = pdfStore.file || converterStore.file;
  const files = pdfStore.files.length > 0 ? pdfStore.files : converterStore.files;
  const stage = pdfStore.stage !== "idle" ? pdfStore.stage : converterStore.stage;
  const outputFile = pdfStore.outputFile || converterStore.outputFile;
  const outputFileName = pdfStore.outputFileName || converterStore.outputFileName;
  const error = pdfStore.error || converterStore.error;

  const startConversion = () => {
    pdfStore.startConversion();
    converterStore.startConversion();
  };

  const completeConversion = (output: Blob, fileName?: string) => {
    pdfStore.completeConversion(output, fileName);
    converterStore.completeConversion(output, fileName);
  };

  const setError = (err: string | null) => {
    pdfStore.setError(err);
    converterStore.setError(err || "");
  };

  const reset = () => {
    pdfStore.resetAll();
    converterStore.reset();
  };

  const resetConversion = () => {
    pdfStore.resetConversion();
    converterStore.resetConversion();
  };

  const [pageManipulations, setPageManipulations] = useState<{
    pageRotations: Record<number, number>;
    deletedPages: number[];
    selectedPages: number[];
  }>({
    pageRotations: {},
    deletedPages: [],
    selectedPages: [],
  });

  const [activeCategory, setActiveCategory] = useState<
    "all" | "document" | "tools"
  >("all");
  const abortControllerRef = useRef<AbortController | null>(null);

  const searchParams = useSearchParams();
  const toolParam = searchParams.get("tool");

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
          : "docx",
      rotateAngle: "90",
      pdfaVersion: "PDF/A-1b",
      password: "",
    },
  });

  const selectedFormatId = watch("selectedFormatId");
  const watchRotateAngle = watch("rotateAngle");
  const watchPdfaVersion = watch("pdfaVersion");

  // Sync when toolParam updates or initial mount
  useEffect(() => {
    if (toolParam && PDF_FORMAT_OPTIONS.some((f) => f.id === toolParam)) {
      setValue("selectedFormatId", toolParam);
      const target = PDF_FORMAT_OPTIONS.find((f) => f.id === toolParam);
      if (target) {
        setActiveCategory(target.category as "all" | "document" | "tools");
      }
    }
  }, [toolParam, setValue]);

  const selectedFormat = useMemo(() => {
    return (
      PDF_FORMAT_OPTIONS.find((f) => f.id === selectedFormatId) ||
      PDF_FORMAT_OPTIONS[0]
    );
  }, [selectedFormatId]);

  const handleCancelRequest = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setError("Conversion canceled by user.");
  }, [setError]);

  const onSubmit = useCallback(
    async (values: PDFConverterFormValues) => {
      if (!file) return;

      startConversion();

      // Setup AbortController for cancel capability
      const controller = new AbortController();
      abortControllerRef.current = controller;

      try {
        // Multi-file Merge handling powered by pdf-lib
        if (values.selectedFormatId === "merge") {
          const filesToMerge = files.length > 0 ? files : [file];
          const buffers = await Promise.all(
            filesToMerge.map((f) => f.arrayBuffer()),
          );
          const mergedBytes = await mergePDFDocuments(buffers);
          const resultBlob = new Blob([mergedBytes.buffer as ArrayBuffer], {
            type: "application/pdf",
          });
          const baseName =
            file.name.substring(0, file.name.lastIndexOf(".")) || "merged";
          completeConversion(resultBlob, `${baseName}_merged.pdf`);
          return;
        }

        // Split / Page Extraction handling powered by pdf-lib
        if (values.selectedFormatId === "split") {
          let targetPages: number[] = [];

          if (pageManipulations.selectedPages.length > 0) {
            targetPages = pageManipulations.selectedPages;
          } else if (values.splitSpan) {
            const parts = values.splitSpan.split(",");
            parts.forEach((p) => {
              const range = p.trim().split("-");
              if (range.length === 2) {
                const start = parseInt(range[0], 10) - 1;
                const end = parseInt(range[1], 10) - 1;
                for (let i = start; i <= end; i++) {
                  if (!isNaN(i)) targetPages.push(i);
                }
              } else if (range.length === 1) {
                const pageNum = parseInt(range[0], 10) - 1;
                if (!isNaN(pageNum)) targetPages.push(pageNum);
              }
            });
          }

          if (targetPages.length > 0) {
            const buffer = await file.arrayBuffer();
            const extractedBytes = await extractPDFPages(buffer, targetPages);
            const resultBlob = new Blob(
              [extractedBytes.buffer as ArrayBuffer],
              { type: "application/pdf" },
            );
            const baseName =
              file.name.substring(0, file.name.lastIndexOf(".")) || "document";
            completeConversion(resultBlob, `${baseName}_split.pdf`);
            return;
          }
        }

        // PDF to PNG / JPG Image export powered by pdfjs-dist & JSZip
        if (
          values.selectedFormatId === "png" ||
          values.selectedFormatId === "jpg"
        ) {
          const format = values.selectedFormatId === "jpg" ? "jpeg" : "png";
          const buffer = await file.arrayBuffer();
          const { blob, isZip } = await renderPdfPagesToImages(buffer, format);
          const baseName =
            file.name.substring(0, file.name.lastIndexOf(".")) || "document";
          const ext = isZip ? "zip" : format === "jpeg" ? "jpg" : "png";
          completeConversion(blob, `${baseName}_images.${ext}`);
          return;
        }

        // HTML → PDF: send htmlContent as index.html file to Gotenberg Chromium
        if (values.selectedFormatId === "html-to-pdf") {
          const html = values.htmlContent?.trim() || "";
          if (!html) {
            setError("Please enter HTML content.");
            return;
          }
          const htmlBlob = new Blob([html], { type: "text/html" });
          const htmlFile = new File([htmlBlob], "index.html", {
            type: "text/html",
          });
          const formData = new FormData();
          formData.append("files", htmlFile, "index.html");
          const response = await fetch("/api/pdf/html-to-pdf", {
            method: "POST",
            body: formData,
            signal: controller.signal,
          });
          if (!response.ok)
            throw new Error(
              await response.text().catch(() => "HTML to PDF failed"),
            );
          completeConversion(await response.blob(), "converted.pdf");
          return;
        }

        // Markdown → PDF: wrap markdown in HTML template, send to Gotenberg Chromium
        if (values.selectedFormatId === "markdown-to-pdf") {
          const md = values.markdownContent?.trim() || "";
          if (!md) {
            setError("Please enter Markdown content.");
            return;
          }
          // Gotenberg's markdown endpoint needs an index.html wrapper + a .md file
          const htmlWrapper = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>body{font-family:sans-serif;max-width:800px;margin:40px auto;padding:0 24px;line-height:1.6}pre{background:#f4f4f4;padding:12px;border-radius:6px;overflow-x:auto}code{background:#f4f4f4;padding:2px 4px;border-radius:3px}</style></head><body></body></html>`;
          const indexBlob = new Blob([htmlWrapper], { type: "text/html" });
          const mdBlob = new Blob([md], { type: "text/markdown" });
          const formData = new FormData();
          formData.append(
            "files",
            new File([indexBlob], "index.html", { type: "text/html" }),
            "index.html",
          );
          formData.append(
            "files",
            new File([mdBlob], "document.md", { type: "text/markdown" }),
            "document.md",
          );
          const response = await fetch("/api/pdf/markdown-to-pdf", {
            method: "POST",
            body: formData,
            signal: controller.signal,
          });
          if (!response.ok)
            throw new Error(
              await response.text().catch(() => "Markdown to PDF failed"),
            );
          completeConversion(await response.blob(), "document.pdf");
          return;
        }

        let processedFile = file;
        const hasRotations =
          Object.keys(pageManipulations.pageRotations).length > 0;
        const hasDeletions = pageManipulations.deletedPages.length > 0;

        if (hasRotations || hasDeletions) {
          let buffer = await file.arrayBuffer();
          if (hasDeletions) {
            buffer = (
              await deletePDFPages(buffer, pageManipulations.deletedPages)
            ).buffer as ArrayBuffer;
          }
          if (hasRotations) {
            buffer = (
              await rotatePDFPages(buffer, pageManipulations.pageRotations)
            ).buffer as ArrayBuffer;
          }
          processedFile = new File([buffer], file.name, {
            type: "application/pdf",
          });
        }

        const formData = new FormData();
        formData.append("files", processedFile, processedFile.name);

        const targetFormatDef =
          PDF_FORMAT_OPTIONS.find((f) => f.id === values.selectedFormatId) ||
          selectedFormat;

        let url = targetFormatDef.endpoint;

        // Custom parameter attachments
        if (values.selectedFormatId === "rotate") {
          formData.append("rotateAngle", values.rotateAngle);
        } else if (values.selectedFormatId === "encrypt") {
          formData.append("userPassword", values.password || "");
          formData.append("ownerPassword", values.password || "");
        } else if (values.selectedFormatId === "decrypt") {
          formData.append("password", values.password || "");
        } else if (values.selectedFormatId === "pdfa") {
          formData.append("pdfa", values.pdfaVersion);
        } else if (values.selectedFormatId === "split") {
          formData.append("mode", "intervals");
          formData.append("span", values.splitSpan || "1");
        } else if (values.selectedFormatId === "watermark") {
          // Generate a simple watermark PDF using pdf-lib and send it as the overlay
          const { PDFDocument, rgb, degrees } = await import("pdf-lib");
          const watermarkText = values.watermarkText || "CONFIDENTIAL";
          const overlayDoc = await PDFDocument.create();
          // A4 page size
          const page = overlayDoc.addPage([595, 842]);
          const { width, height } = page.getSize();
          page.drawText(watermarkText, {
            x: width / 2 - watermarkText.length * 8,
            y: height / 2,
            size: 52,
            color: rgb(0.75, 0.75, 0.75),
            opacity: 0.35,
            rotate: degrees(45),
          });
          const overlayBytes = await overlayDoc.save();
          const overlayFile = new File(
            [overlayBytes.buffer as ArrayBuffer],
            "watermark.pdf",
            { type: "application/pdf" },
          );
          formData.append("files", overlayFile, "watermark.pdf");
        } else if (values.selectedFormatId === "stamp") {
          // Stamp requires a second PDF file uploaded by the user
          const stampInput = document.querySelector<HTMLInputElement>(
            "input[type=file][accept='.pdf,application/pdf']",
          );
          const stampFile = stampInput?.files?.[0];
          if (!stampFile) {
            setError("Please upload a stamp PDF file.");
            return;
          }
          formData.append("files", stampFile, stampFile.name);
        }

        // Batch conversion mode: if multiple files are loaded and operation is not 'merge',
        // convert all files with user-configured concurrency and bundle into a ZIP archive
        if (files.length > 1 && values.selectedFormatId !== "merge") {
          const JSZip = (await import("jszip")).default;
          const zip = new JSZip();
          const total = files.length;
          let completed = 0;
          const limit = Math.max(1, Math.min(5, pdfStore.concurrency || 3));
          let nextIdx = 0;

          pdfStore.setJobStatus("PROCESSING");
          pdfStore.setProgress(10);

          async function worker() {
            while (nextIdx < total && !controller.signal.aborted) {
              const i = nextIdx++;
              const curFile = files[i];
              const batchFormData = new FormData();
              batchFormData.append("files", curFile, curFile.name);

              if (values.selectedFormatId === "rotate") {
                batchFormData.append("rotateAngle", values.rotateAngle);
              } else if (values.selectedFormatId === "encrypt") {
                batchFormData.append("userPassword", values.password || "");
                batchFormData.append("ownerPassword", values.password || "");
              }

              const batchRes = await fetch(url, {
                method: "POST",
                body: batchFormData,
                signal: controller.signal,
              });

              if (!batchRes.ok) {
                throw new Error(`Failed to convert ${curFile.name} (status ${batchRes.status})`);
              }

              const singleBlob = await batchRes.blob();
              const base = curFile.name.substring(0, curFile.name.lastIndexOf(".")) || curFile.name;
              zip.file(`${base}${targetFormatDef.extension}`, singleBlob);

              completed++;
              pdfStore.setProgress(Math.round((completed / total) * 100));
            }
          }

          await Promise.all(Array.from({ length: Math.min(limit, total) }, () => worker()));
          const zipBlob = await zip.generateAsync({ type: "blob" });
          const baseName = file.name.substring(0, file.name.lastIndexOf(".")) || "batch";
          completeConversion(zipBlob, `${baseName}_converted_batch.zip`);
          return;
        }

        if (pdfStore.useQueue) {
          url += (url.includes("?") ? "&" : "?") + "forceAsync=true";
          formData.append("forceAsync", "true");
        }

        const response = await fetch(url, {
          method: "POST",
          body: formData,
          signal: controller.signal,
        });

        if (!response.ok && response.status !== 202) {
          const errText = await response
            .text()
            .catch(() => "Conversion failed");
          let message = errText;
          try {
            const parsed = JSON.parse(errText);
            if (parsed.error) message = parsed.error;
          } catch {
            /* not json */
          }
          throw new Error(
            message || `Server responded with status ${response.status}`,
          );
        }

        const baseName =
          file.name.substring(0, file.name.lastIndexOf(".")) || file.name;
        let outExt = targetFormatDef.extension;
        if (
          [
            "rotate",
            "compress",
            "flatten",
            "encrypt",
            "decrypt",
            "pdfa",
            "split",
            "watermark",
            "stamp",
          ].includes(values.selectedFormatId)
        ) {
          outExt =
            values.selectedFormatId === "split"
              ? "_split.zip"
              : `_${values.selectedFormatId}.pdf`;
        }
        const finalFileName = `${baseName}${outExt}`;

        // ── Check if response is an asynchronous BullMQ background job ─────────
        const contentType = response.headers.get("content-type") || "";
        if (response.status === 202 || contentType.includes("application/json")) {
          const json = await response.json();
          if (json.mode === "async" && json.jobId) {
            pdfStore.setJobId(json.jobId);
            pdfStore.setJobStatus("QUEUED");
            pdfStore.setProgress(15);

            // Poll for completion
            let finished = false;
            while (!finished && !controller.signal.aborted) {
              await new Promise((r) => setTimeout(r, 1200));
              if (controller.signal.aborted) break;

              const pollRes = await fetch(`/api/jobs/${json.jobId}/status`, {
                signal: controller.signal,
              });
              if (pollRes.ok) {
                const pollData = await pollRes.json();
                pdfStore.setJobStatus(pollData.status);
                if (pollData.progress) {
                  pdfStore.setProgress(pollData.progress);
                } else if (pollData.status === "PROCESSING") {
                  pdfStore.setProgress(60);
                }

                if (pollData.status === "COMPLETED") {
                  const downloadUrl =
                    pollData.downloadUrl || `/api/jobs/${json.jobId}/download`;
                  const fileRes = await fetch(downloadUrl, {
                    signal: controller.signal,
                  });
                  const fileBlob = await fileRes.blob();
                  pdfStore.setProgress(100);
                  completeConversion(fileBlob, finalFileName);
                  finished = true;
                  return;
                } else if (pollData.status === "FAILED") {
                  throw new Error(
                    pollData.error || "Background BullMQ conversion job failed",
                  );
                }
              }
            }
            return;
          }
        }

        // Fast-path synchronous stream
        const resultBlob = await response.blob();
        completeConversion(resultBlob, finalFileName);
      } catch (err: any) {
        if (err.name === "AbortError") {
          console.warn("PDF Conversion fetch aborted.");
          return;
        }
        console.error("PDF conversion error:", err);
        setError(
          err?.message || "Failed to convert file. Please check server status.",
        );
      } finally {
        abortControllerRef.current = null;
      }
    },
    [
      file,
      files,
      selectedFormat,
      pageManipulations,
      startConversion,
      completeConversion,
      setError,
    ],
  );

  const handleCategoryChange = useCallback(
    (category: "all" | "document" | "tools") => {
      setActiveCategory(category);
    },
    [],
  );

  const handleSelectFormat = useCallback(
    (id: string) => {
      setValue("selectedFormatId", id);
    },
    [setValue],
  );

  // Global Enter Key Listener to trigger conversion submit
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === "Enter" &&
        (stage === "ready" || stage === "error") &&
        file
      ) {
        const activeElem = document.activeElement;
        const isPasswordInput = activeElem?.getAttribute("type") === "password";
        if (!isPasswordInput) {
          e.preventDefault();
          handleSubmit(onSubmit)();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [stage, file, handleSubmit, onSubmit]);

  if (!file) return null;

  return (
    <div className="w-full max-w-7xl mx-auto mt-6 relative z-20">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: PDF Document Preview, Multi-File List & Visual Page Grid */}
        <div className="lg:col-span-6 space-y-4">
          <PDFPreview file={file} onReset={reset} />
          <PDFFileList />
          <PDFPageGrid
            file={file}
            onPageManipulationsChange={setPageManipulations}
          />
        </div>

        {/* RIGHT COLUMN: Conversion Form Controls */}
        <div className="lg:col-span-6 bg-[#131722]/90 backdrop-blur-md rounded-2xl border border-white/10 p-6 shadow-2xl flex flex-col justify-between min-h-[664px]">
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="flex flex-col justify-between h-full space-y-6"
          >
            <div>
              {/* Header */}
              <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-5">
                <div>
                  <span className="text-xs uppercase tracking-wider font-bold text-red-400 bg-red-500/10 px-2.5 py-1 rounded-md border border-red-500/20">
                    Target Format
                  </span>
                  <h3 className="text-xl font-bold text-white mt-2">
                    Convert PDF Document
                  </h3>
                </div>
                <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-400 bg-white/5 px-2.5 py-1.5 rounded-lg border border-white/10">
                  <CornerDownLeft className="w-3.5 h-3.5 text-slate-300" />
                  <span>Press </span>
                  <kbd className="px-1.5 py-0.5 bg-white/10 rounded font-mono text-[10px] text-white">
                    Enter
                  </kbd>
                  <span> to convert</span>
                </div>
              </div>

              {/* BullMQ Queue & Parallel Concurrency Bar */}
              <div className="mb-4 p-3 rounded-xl bg-white/[0.03] border border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs">
                {/* Concurrency Selector */}
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 text-slate-300 font-medium">
                    <Cpu className="w-3.5 h-3.5 text-red-400" />
                    <span>Concurrency:</span>
                  </div>
                  <div className="inline-flex rounded-lg bg-black/40 p-0.5 border border-white/10">
                    {[
                      { val: 1, label: "1x" },
                      { val: 3, label: "3x Balanced" },
                      { val: 5, label: "5x Turbo" },
                    ].map((opt) => (
                      <button
                        key={opt.val}
                        type="button"
                        onClick={() => pdfStore.setConcurrency(opt.val)}
                        disabled={stage === "converting"}
                        className={`px-2 py-1 rounded-md text-[11px] font-semibold transition-all ${
                          pdfStore.concurrency === opt.val
                            ? "bg-red-600 text-white shadow-sm"
                            : "text-slate-400 hover:text-white"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* BullMQ Async Queue Toggle */}
                <div className="flex items-center gap-2">
                  <span className="text-slate-400 text-[11px]">Async BullMQ:</span>
                  <button
                    type="button"
                    onClick={() => pdfStore.setUseQueue(!pdfStore.useQueue)}
                    disabled={stage === "converting"}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      pdfStore.useQueue ? "bg-red-600" : "bg-white/10"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                        pdfStore.useQueue ? "translate-x-4" : "translate-x-0"
                      }`}
                    />
                  </button>
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${
                      pdfStore.useQueue
                        ? "bg-red-500/10 text-red-400 border-red-500/30"
                        : "bg-white/5 text-slate-400 border-white/10"
                    }`}
                  >
                    {pdfStore.useQueue ? "Redis Queue" : "Direct Stream"}
                  </span>
                </div>
              </div>

              {/* Format Selection Component */}
              <FormatSelector
                selectedFormatId={selectedFormatId}
                activeCategory={activeCategory}
                disabled={stage === "converting"}
                onSelectFormat={handleSelectFormat}
                onCategoryChange={handleCategoryChange}
              />

              {/* Tool Options Component */}
              <div className="mt-4">
                <ToolOptions
                  selectedFormatId={selectedFormatId}
                  register={register}
                  errors={errors}
                  setValue={setValue}
                  watchRotateAngle={watchRotateAngle}
                  watchPdfaVersion={watchPdfaVersion}
                  disabled={stage === "converting"}
                />
              </div>
            </div>

            {/* Conversion Actions & Status Component */}
            <div className="pt-4 border-t border-white/10">
              <ConversionStatus
                stage={stage}
                formatName={selectedFormat.name}
                formatExtension={selectedFormat.extension}
                outputFile={outputFile}
                outputFileName={outputFileName}
                error={error}
                onConvertSubmit={handleSubmit(onSubmit)}
                onCancelRequest={handleCancelRequest}
                onResetConversion={resetConversion}
                jobStatus={pdfStore.jobStatus}
                jobId={pdfStore.jobId}
                progress={pdfStore.progress}
              />
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
