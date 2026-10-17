"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { useImageConversionStore, ImageMeta } from "@/app/store/useImageConversionStore";
import { ImageConverterFormValues } from "@/app/lib/schemas/imageConverterSchema";

interface ActiveImageJob {
  jobId: string;
  fileName: string;
  isZip: boolean;
}

type ImageConversionResult =
  | {
      mode: "sync";
      blobUrl: string;
      fileName: string;
      size: number;
      meta: ImageMeta | null;
      isZip: boolean;
    }
  | { mode: "async"; jobId: string; fileName: string; isZip: boolean };

export function useImageConversion() {
  const {
    files,
    selectedIndex,
    setIsConverting,
    setOutput,
  } = useImageConversionStore();

  const [activeJob, setActiveJob] = useState<ActiveImageJob | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // ── 1. TanStack Query: Background Job Status Poller ────────────────────────
  const { data: jobStatusData } = useQuery({
    queryKey: ["image-job-status", activeJob?.jobId],
    queryFn: async ({ signal }) => {
      if (!activeJob?.jobId) return null;
      const res = await fetch(`/api/jobs/${activeJob.jobId}/status`, { signal });
      if (!res.ok) {
        throw new Error("Failed to check background conversion status.");
      }
      return res.json();
    },
    enabled: Boolean(activeJob?.jobId),
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (status === "COMPLETED" || status === "FAILED") return false;
      return 1200;
    },
    refetchIntervalInBackground: true,
  });

  // Handle updates from background query polling
  useEffect(() => {
    if (!jobStatusData || !activeJob) return;

    if (jobStatusData.status === "COMPLETED") {
      const downloadUrl = jobStatusData.downloadUrl || `/api/jobs/${activeJob.jobId}/download`;
      fetch(downloadUrl)
        .then((res) => {
          if (!res.ok) throw new Error("Failed to download converted image file.");
          return res.blob();
        })
        .then((blob) => {
          const newBlobUrl = URL.createObjectURL(blob);
          setOutput({
            blobUrl: newBlobUrl,
            fileName: activeJob.fileName,
            size: blob.size,
            meta: null,
            isZip: activeJob.isZip,
          });
          setIsConverting(false);
          setActiveJob(null);
          toast.success("Conversion completed!");
        })
        .catch((err) => {
          setIsConverting(false);
          setActiveJob(null);
          toast.error(err?.message || "Failed to download converted image.");
        });
    } else if (jobStatusData.status === "FAILED") {
      const errMsg = jobStatusData.error || "Background conversion job failed.";
      setIsConverting(false);
      setActiveJob(null);
      toast.error(errMsg);
    }
  }, [jobStatusData, activeJob, setOutput, setIsConverting]);

  // ── 2. TanStack Query: Conversion Mutation ─────────────────────────────────
  const mutation = useMutation<ImageConversionResult, Error, ImageConverterFormValues>({
    mutationFn: async (values: ImageConverterFormValues) => {
      if (files.length === 0) {
        throw new Error("Please upload at least one image first.");
      }

      setIsConverting(true);
      abortControllerRef.current = new AbortController();
      const controller = abortControllerRef.current;

      const activeFile = files[selectedIndex] || files[0] || null;

      const optionsPayload = {
        targetFormat: values.selectedFormatId,
        quality: values.quality,
        width: values.width ?? undefined,
        height: values.height ?? undefined,
        fitMode: values.fitMode,
        rotateAngle: values.rotateAngle,
        flipHorizontal: values.flipHorizontal,
        flipVertical: values.flipVertical,
        grayscale: values.grayscale,
        stripExif: values.stripExif,
        backgroundColor: values.backgroundColor || undefined,
      };

      const formData = new FormData();
      files.forEach((f) => formData.append("files", f));
      formData.append("options", JSON.stringify(optionsPayload));

      const res = await fetch("/api/image/convert", {
        method: "POST",
        body: formData,
        credentials: "include",
        signal: controller.signal,
      });

      if (!res.ok && res.status !== 202) {
        const errorText = await res.text();
        let message = errorText;
        try {
          const parsed = JSON.parse(errorText);
          if (parsed.error) message = parsed.error;
        } catch {
          // not JSON
        }
        throw new Error(message || `Conversion failed with status ${res.status}`);
      }

      const contentType = res.headers.get("content-type") || "";

      // Handle asynchronous BullMQ job
      if (res.status === 202 || contentType.includes("application/json")) {
        const json = await res.json();
        if (json.mode === "async" && json.jobId) {
          const isZip = files.length > 1;
          const finalName = isZip
            ? "converted_images.zip"
            : `converted_${json.jobId}.${values.selectedFormatId}`;
          return { mode: "async", jobId: json.jobId, fileName: finalName, isZip };
        } else if (json.error) {
          throw new Error(json.error);
        }
      }

      // Synchronous stream handling
      const isZip = contentType.includes("zip") || (files.length > 1 && !contentType.includes("image/"));
      const blob = await res.blob();
      const newBlobUrl = URL.createObjectURL(blob);

      const baseName = activeFile
        ? activeFile.name.substring(0, activeFile.name.lastIndexOf("."))
        : "converted";
      const finalName = isZip ? "converted_images.zip" : `${baseName}.${values.selectedFormatId}`;

      // Extract image dimensions safely for non-zip
      let meta: ImageMeta | null = null;
      if (!isZip && typeof window !== "undefined" && !["heic", "heif"].includes(values.selectedFormatId)) {
        try {
          meta = await new Promise<ImageMeta | null>((resolve) => {
            const img = new window.Image();
            img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
            img.onerror = () => resolve(null);
            img.src = newBlobUrl;
          });
        } catch {
          meta = null;
        }
      }

      return {
        mode: "sync",
        blobUrl: newBlobUrl,
        fileName: finalName,
        size: blob.size,
        meta,
        isZip,
      };
    },
    onSuccess: (result) => {
      if (result.mode === "sync") {
        setOutput({
          blobUrl: result.blobUrl,
          fileName: result.fileName,
          size: result.size,
          meta: result.meta,
          isZip: result.isZip,
        });
        setIsConverting(false);
        toast.success("Conversion completed!");
      } else if (result.mode === "async") {
        toast.info("Large job queued. Processing in background...");
        setActiveJob({
          jobId: result.jobId,
          fileName: result.fileName,
          isZip: result.isZip,
        });
      }
    },
    onError: (err: any) => {
      setIsConverting(false);
      if (err.name === "AbortError") {
        console.warn("Image conversion cancelled by user.");
        return;
      }
      console.error("Image conversion error:", err);
      toast.error(err?.message || "Image conversion failed.");
    },
    onSettled: () => {
      abortControllerRef.current = null;
    },
  });

  const cancel = useCallback(() => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    setActiveJob(null);
    setIsConverting(false);
    toast.info("Conversion cancelled.");
  }, [setIsConverting]);

  return {
    convertImages: mutation.mutate,
    convertImagesAsync: mutation.mutateAsync,
    isPending: mutation.isPending || Boolean(activeJob),
    error: mutation.error,
    cancel,
  };
}
