"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { usePDFConversionStore } from "@/app/store/usePDFConversionStore";
import { PDF_FORMAT_OPTIONS } from "@/app/utils/vars";
import { rotatePDFPages, deletePDFPages, extractPDFPages, mergePDFDocuments } from "@/app/lib/pdf/pdfLibUtils";
import { renderPdfPagesToImages, extractPdfText } from "@/app/lib/pdf/pdfToImageUtils";
import { PDFConverterFormValues } from "@/app/lib/schemas/pdfConverterSchema";

interface ActiveJob {
  jobId: string;
  fileName: string;
}

type ConversionResult =
  | { mode: "sync"; blob: Blob; fileName: string }
  | { mode: "async"; jobId: string; fileName: string };

export function usePDFConversion() {
  const {
    file,
    files,
    stage,
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
    resetConversion,
  } = usePDFConversionStore();

  const [activeJob, setActiveJob] = useState<ActiveJob | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // ── 1. TanStack Query: Background Job Status Poller ────────────────────────
  const { data: jobStatusData } = useQuery({
    queryKey: ["pdf-job-status", activeJob?.jobId],
    queryFn: async ({ signal }) => {
      if (!activeJob?.jobId) return null;
      const res = await fetch(`/api/jobs/${activeJob.jobId}/status`, { signal });
      if (!res.ok) {
        throw new Error("Failed to retrieve background conversion status.");
      }
      return res.json();
    },
    enabled: Boolean(activeJob?.jobId),
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (status === "COMPLETED" || status === "FAILED") return false;
      return 1200; // Poll every 1.2s while QUEUED or PROCESSING
    },
    refetchIntervalInBackground: true,
  });

  // Handle updates from background query polling
  useEffect(() => {
    if (!jobStatusData || !activeJob) return;

    setJobStatus(jobStatusData.status);

    if (jobStatusData.progress) {
      setProgress(jobStatusData.progress);
    } else if (jobStatusData.status === "PROCESSING") {
      setProgress(60);
    }

    if (jobStatusData.status === "COMPLETED") {
      const downloadUrl = jobStatusData.downloadUrl || `/api/jobs/${activeJob.jobId}/download`;
      fetch(downloadUrl)
        .then((res) => {
          if (!res.ok) throw new Error("Failed to download converted document.");
          return res.blob();
        })
        .then((blob) => {
          setProgress(100);
          completeConversion(blob, activeJob.fileName);
          toast.success("Conversion completed!");
          setActiveJob(null);
        })
        .catch((err) => {
          setError(err?.message || "Error retrieving converted file.");
          toast.error(err?.message || "Download failed.");
          setActiveJob(null);
        });
    } else if (jobStatusData.status === "FAILED") {
      const errMsg = jobStatusData.error || "Background conversion job failed.";
      setError(errMsg);
      toast.error(errMsg);
      setActiveJob(null);
    }
  }, [jobStatusData, activeJob, setJobStatus, setProgress, completeConversion, setError]);

  // ── 2. TanStack Query: Conversion Mutation ─────────────────────────────────
  const mutation = useMutation<ConversionResult, Error, PDFConverterFormValues>({
    mutationFn: async (values: PDFConverterFormValues) => {
      const activeFile = file || files[0];
      if (!activeFile && values.selectedFormatId !== "html-to-pdf" && values.selectedFormatId !== "markdown-to-pdf") {
        throw new Error("Please upload a PDF document first.");
      }

      startConversion();
      abortControllerRef.current = new AbortController();
      const controller = abortControllerRef.current;

      const formatDef =
        PDF_FORMAT_OPTIONS.find((f) => f.id === values.selectedFormatId) || PDF_FORMAT_OPTIONS[0];

      // Step A: Client-Side Interactive Rotations & Deletions
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

      // Step B: Client-Side Page Split / Extraction
      if (values.selectedFormatId === "split" && workingFile) {
        let targetPages: number[] = [];
        if (selectedPages.length > 0) {
          targetPages = selectedPages;
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
          return { mode: "sync", blob, fileName: `${baseName}_split.pdf` };
        }
      }

      // Step C: Client-Side PDF Merge
      if (values.selectedFormatId === "merge" && files.length > 1) {
        const buffers = await Promise.all(files.map((f) => f.arrayBuffer()));
        const mergedBytes = await mergePDFDocuments(buffers);
        const blob = new Blob([mergedBytes.buffer as ArrayBuffer], { type: "application/pdf" });
        const baseName = activeFile?.name.substring(0, activeFile.name.lastIndexOf(".")) || "merged";
        return { mode: "sync", blob, fileName: `${baseName}_merged.pdf` };
      }

      // Step D: Client-Side PDF to PNG / JPG
      if ((values.selectedFormatId === "png" || values.selectedFormatId === "jpg") && workingFile) {
        const format = values.selectedFormatId === "jpg" ? "jpeg" : "png";
        const buf = await workingFile.arrayBuffer();
        const { blob, isZip } = await renderPdfPagesToImages(buf, format);
        const baseName = workingFile.name.substring(0, workingFile.name.lastIndexOf(".")) || "doc";
        const ext = isZip ? "zip" : format === "jpeg" ? "jpg" : "png";
        return { mode: "sync", blob, fileName: `${baseName}_images.${ext}` };
      }

      // Step E: Client-Side Plain Text (TXT) extraction
      if (values.selectedFormatId === "txt" && workingFile) {
        const buf = await workingFile.arrayBuffer();
        const textBlob = await extractPdfText(buf);
        const baseName = workingFile.name.substring(0, workingFile.name.lastIndexOf(".")) || "doc";
        return { mode: "sync", blob: textBlob, fileName: `${baseName}.txt` };
      }

      // Step F: HTML to PDF
      if (values.selectedFormatId === "html-to-pdf") {
        if (!values.htmlContent?.trim()) {
          throw new Error("Please enter HTML content.");
        }
        const htmlBlob = new Blob([values.htmlContent], { type: "text/html" });
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
        return { mode: "sync", blob: await res.blob(), fileName: "converted.pdf" };
      }

      // Step G: Markdown to PDF
      if (values.selectedFormatId === "markdown-to-pdf") {
        if (!values.markdownContent?.trim()) {
          throw new Error("Please enter Markdown content.");
        }
        const htmlWrap = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>body{font-family:sans-serif;max-width:800px;margin:40px auto;padding:0 24px;line-height:1.6}pre{background:#f4f4f4;padding:12px;border-radius:6px;overflow-x:auto}</style></head><body></body></html>`;
        const formData = new FormData();
        formData.append("files", new File([new Blob([htmlWrap])], "index.html", { type: "text/html" }));
        formData.append("files", new File([new Blob([values.markdownContent])], "document.md", { type: "text/markdown" }));

        const res = await fetch("/api/pdf/markdown-to-pdf", {
          method: "POST",
          body: formData,
          signal: controller.signal,
        });
        if (!res.ok) {
          const errText = await res.text().catch(() => "Markdown to PDF failed");
          throw new Error(errText);
        }
        return { mode: "sync", blob: await res.blob(), fileName: "converted.pdf" };
      }

      // Step H: Multi-File Batch Mode with Concurrency Limiter
      if (files.length > 1 && values.selectedFormatId !== "merge") {
        const JSZip = (await import("jszip")).default;
        const zip = new JSZip();
        const total = files.length;
        let completed = 0;
        const isServerGotenberg = formatDef.endpoint.startsWith("/api/pdf");
        const limit = isServerGotenberg ? 1 : Math.max(1, Math.min(5, concurrency || 3));
        let nextIdx = 0;

        setJobStatus("PROCESSING");
        setProgress(10);

        async function batchWorker() {
          while (nextIdx < total && !controller.signal.aborted) {
            const i = nextIdx++;
            const curFile = files[i];
            let blob: Blob;

            if (values.selectedFormatId === "png" || values.selectedFormatId === "jpg") {
              const format = values.selectedFormatId === "jpg" ? "jpeg" : "png";
              const buf = await curFile.arrayBuffer();
              const result = await renderPdfPagesToImages(buf, format);
              blob = result.blob;
            } else if (values.selectedFormatId === "txt") {
              const buf = await curFile.arrayBuffer();
              blob = await extractPdfText(buf);
            } else {
              const batchFormData = new FormData();
              batchFormData.append("files", curFile, curFile.name);

              if (values.selectedFormatId === "rotate") {
                batchFormData.append("rotateAngle", values.rotateAngle);
              } else if (values.selectedFormatId === "encrypt") {
                batchFormData.append("userPassword", values.password);
                batchFormData.append("ownerPassword", values.password);
              } else if (values.selectedFormatId === "decrypt") {
                batchFormData.append("password", values.password);
              } else if (values.selectedFormatId === "pdfa") {
                batchFormData.append("pdfa", values.pdfaVersion);
              } else if (values.selectedFormatId === "watermark" && values.watermarkText) {
                batchFormData.append("watermarkText", values.watermarkText);
              }

              const batchRes = await fetch(formatDef.endpoint, {
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
                  if (errBody && errBody.length < 250) detail = errBody;
                }
                throw new Error(`Failed to convert "${curFile.name}": ${detail}`);
              }

              blob = await batchRes.blob();
            }

            const base = curFile.name.substring(0, curFile.name.lastIndexOf(".")) || curFile.name;
            const ext =
              values.selectedFormatId === "txt"
                ? ".txt"
                : values.selectedFormatId === "png" || values.selectedFormatId === "jpg"
                  ? blob.type === "application/zip"
                    ? ".zip"
                    : formatDef.extension
                  : formatDef.extension;

            zip.file(`${base}${ext}`, blob);
            completed++;
            setProgress(Math.round((completed / total) * 100));
          }
        }

        await Promise.all(Array.from({ length: Math.min(limit, total) }, () => batchWorker()));
        const zipBlob = await zip.generateAsync({ type: "blob" });
        const baseName = activeFile?.name.substring(0, activeFile.name.lastIndexOf(".")) || "batch";
        return { mode: "sync", blob: zipBlob, fileName: `${baseName}_converted_batch.zip` };
      }

      // Step I: Standard Single Document Request
      if (!workingFile) throw new Error("No file available for conversion.");
      const formData = new FormData();
      formData.append("files", workingFile, workingFile.name);

      if (values.selectedFormatId === "rotate") {
        formData.append("rotateAngle", values.rotateAngle);
      } else if (values.selectedFormatId === "encrypt") {
        formData.append("userPassword", values.password);
        formData.append("ownerPassword", values.password);
      } else if (values.selectedFormatId === "decrypt") {
        formData.append("password", values.password);
      } else if (values.selectedFormatId === "pdfa") {
        formData.append("pdfa", values.pdfaVersion);
      } else if (values.selectedFormatId === "watermark" && values.watermarkText) {
        formData.append("watermarkText", values.watermarkText);
      }

      let requestUrl = formatDef.endpoint;
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
          if (errText && errText.length < 250) msg = errText;
        }
        throw new Error(msg || `Server error (status ${res.status})`);
      }

      const baseName = workingFile.name.substring(0, workingFile.name.lastIndexOf(".")) || workingFile.name;
      const finalFileName = `${baseName}${formatDef.extension}`;

      // Handle BullMQ async response
      const contentType = res.headers.get("content-type") || "";
      if (res.status === 202 || contentType.includes("application/json")) {
        const json = await res.json();
        if (json.mode === "async" && json.jobId) {
          return { mode: "async", jobId: json.jobId, fileName: finalFileName };
        }
      }

      // Synchronous stream response
      const resultBlob = await res.blob();
      return { mode: "sync", blob: resultBlob, fileName: finalFileName };
    },
    onSuccess: (result) => {
      if (result.mode === "sync") {
        completeConversion(result.blob, result.fileName);
        toast.success("Conversion completed!");
      } else if (result.mode === "async") {
        setJobId(result.jobId);
        setJobStatus("QUEUED");
        setProgress(15);
        setActiveJob({ jobId: result.jobId, fileName: result.fileName });
      }
    },
    onError: (err: any) => {
      if (err.name === "AbortError") {
        console.warn("Conversion cancelled by user.");
        return;
      }
      console.error("PDF conversion error:", err);
      setError(err?.message || "Failed to convert document.");
      toast.error(err?.message || "Conversion failed.");
    },
    onSettled: () => {
      abortControllerRef.current = null;
    },
  });

  const cancel = useCallback(() => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    setActiveJob(null);
    resetConversion();
    toast.info("Conversion cancelled.");
  }, [resetConversion]);

  return {
    convertDocument: mutation.mutate,
    convertDocumentAsync: mutation.mutateAsync,
    isPending: mutation.isPending || Boolean(activeJob) || stage === "converting",
    error: mutation.error,
    cancel,
  };
}
