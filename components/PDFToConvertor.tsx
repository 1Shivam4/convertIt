"use client";

import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CornerDownLeft } from "lucide-react";

import { useConverterStore } from "@/app/store/useFileDetectionStore";
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
  const {
    file,
    files,
    stage,
    outputFile,
    outputFileName,
    error,
    startConversion,
    completeConversion,
    setError,
    reset,
    resetConversion,
  } = useConverterStore();

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

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<PDFConverterFormValues>({
    resolver: zodResolver(pdfConverterSchema),
    defaultValues: {
      selectedFormatId: "docx",
      rotateAngle: "90",
      pdfaVersion: "PDF/A-1b",
      password: "",
    },
  });

  const selectedFormatId = watch("selectedFormatId");
  const watchRotateAngle = watch("rotateAngle");
  const watchPdfaVersion = watch("pdfaVersion");

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

        const response = await fetch(url, {
          method: "POST",
          body: formData,
          signal: controller.signal,
        });

        if (!response.ok) {
          const errText = await response
            .text()
            .catch(() => "Conversion failed");
          throw new Error(
            errText || `Server responded with status ${response.status}`,
          );
        }

        const resultBlob = await response.blob();

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
              />
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
