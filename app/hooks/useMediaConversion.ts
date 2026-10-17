"use client";

import { useState, useRef, useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { useMediaConversionStore } from "@/app/store/useMediaConversionStore";
import { MEDIA_FORMAT_OPTIONS } from "@/app/utils/vars";
import { triggerBrowserDownload } from "@/app/lib/utils/download";
import { MediaConverterInput } from "@/app/lib/schemas/mediaConverterSchema";

export interface MediaProgressState {
  percent: number;
  fps: string;
  speed: string;
  stage: string;
}

export function useMediaConversion(onSuccess?: () => void) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [progress, setProgress] = useState<MediaProgressState | null>(null);
  const [downloadBlob, setDownloadBlob] = useState<Blob | null>(null);
  const [downloadFileName, setDownloadFileName] = useState<string>("");
  const abortRef = useRef<AbortController | null>(null);

  const {
    selectedFormatId,
    resolution,
    videoBitrate,
    audioBitrate,
    fps,
    startTime,
    endTime,
    muteAudio,
    speedFactor,
  } = useMediaConversionStore();

  const targetFormat = MEDIA_FORMAT_OPTIONS.find(
    (f) => f.id.toLowerCase() === selectedFormatId.toLowerCase(),
  );

  const mutation = useMutation<void, Error, { file: File; options?: Partial<MediaConverterInput> }>({
    mutationFn: async ({ file, options }) => {
      setIsProcessing(true);
      setIsDone(false);
      setProgress({ percent: 0, fps: "—", speed: "—", stage: "Preparing…" });

      const abort = new AbortController();
      abortRef.current = abort;

      const mergedOptions = {
        selectedFormatId,
        resolution,
        videoBitrate,
        audioBitrate,
        fps,
        startTime,
        endTime,
        muteAudio,
        speedFactor,
        ...options,
      };

      const formData = new FormData();
      formData.append("file", file);
      formData.append("options", JSON.stringify(mergedOptions));

      const response = await fetch(targetFormat?.endpoint ?? "/api/media/convert", {
        method: "POST",
        body: formData,
        signal: abort.signal,
      });

      if (!response.body) throw new Error("No response stream available.");

      const reader = response.body.getReader();
      const dec = new TextDecoder();
      let buf = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        const parts = buf.split("\n\n");
        buf = parts.pop() ?? "";

        for (const part of parts) {
          const line = part.trim();
          if (!line.startsWith("data:")) continue;
          try {
            const event = JSON.parse(line.slice(5).trim());

            if (event.type === "progress") {
              setProgress({
                percent: event.percent ?? 0,
                fps: event.fps ?? "—",
                speed: event.speed ?? "—",
                stage: event.stage ?? "Processing…",
              });
            } else if (event.type === "done") {
              setProgress({ percent: 100, fps: "—", speed: "—", stage: "Done!" });

              // Decode base64 payload to binary blob
              const binary = atob(event.base64);
              const bytes = new Uint8Array(binary.length);
              for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
              const blob = new Blob([bytes], { type: event.mimeType });

              setDownloadBlob(blob);
              setDownloadFileName(event.filename);

              // Auto-trigger browser download cleanly without DOM leakage
              triggerBrowserDownload(blob, event.filename);

              setIsDone(true);
              toast.success("Conversion complete — file downloaded!");
              onSuccess?.();
            } else if (event.type === "error") {
              throw new Error(event.message);
            }
          } catch (parseErr: any) {
            if (parseErr?.message && !parseErr.message.includes("JSON")) throw parseErr;
          }
        }
      }
    },
    onError: (err: any) => {
      if (err?.name === "AbortError") return;
      console.error("Media conversion error:", err);
      toast.error(err?.message ?? "An error occurred during media conversion");
      setProgress(null);
    },
    onSettled: () => {
      setIsProcessing(false);
      abortRef.current = null;
    },
  });

  const cancel = useCallback(() => {
    abortRef.current?.abort();
    setIsProcessing(false);
    setProgress(null);
    toast.info("Conversion cancelled");
  }, []);

  const handleManualDownload = useCallback(() => {
    if (!downloadBlob || !downloadFileName) return;
    triggerBrowserDownload(downloadBlob, downloadFileName);
    toast.success("Download started!");
  }, [downloadBlob, downloadFileName]);

  return {
    convertMedia: (file: File, options?: Partial<MediaConverterInput>) =>
      mutation.mutate({ file, options }),
    isProcessing,
    isDone,
    progress,
    downloadBlob,
    downloadFileName,
    handleManualDownload,
    cancel,
  };
}
