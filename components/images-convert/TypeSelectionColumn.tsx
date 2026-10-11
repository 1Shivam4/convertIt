"use client";

import { CloudUpload, FileText, Wrench, SlidersHorizontal, Zap, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useImageConversionStore } from "@/app/store/useImageConversionStore";
import FormatTabContent from "./FormatTabContent";
import ToolsTabContent from "./ToolsTabContent";
import AdjustmentsTabContent from "./AdjustmentsTabContent";

export default function TypeSelectionColumn() {
  const {
    files,
    selectedIndex,
    activeTab,
    setActiveTab,
    selectedFormatId,
    quality,
    width,
    height,
    fitMode,
    rotateAngle,
    flipHorizontal,
    flipVertical,
    grayscale,
    stripExif,
    useBackgroundColor,
    backgroundColor,
    isConverting,
    setIsConverting,
    setOutput,
  } = useImageConversionStore();

  const activeFile = files[selectedIndex] || files[0] || null;

  const handleConvert = async () => {
    if (files.length === 0) {
      toast.error("Please upload at least one image first.");
      return;
    }

    setIsConverting(true);
    const optionsPayload = {
      targetFormat: selectedFormatId,
      quality,
      width: width ?? undefined,
      height: height ?? undefined,
      fitMode,
      rotateAngle,
      flipHorizontal,
      flipVertical,
      grayscale,
      stripExif,
      backgroundColor: useBackgroundColor ? backgroundColor : undefined,
    };

    try {
      const formData = new FormData();
      files.forEach((f) => formData.append("files", f));
      formData.append("options", JSON.stringify(optionsPayload));

      const res = await fetch("/api/image/convert", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!res.ok && res.status !== 202) {
        const errorText = await res.text();
        let message = errorText;
        try {
          const parsed = JSON.parse(errorText);
          if (parsed.error) message = parsed.error;
        } catch {
          // not json
        }
        throw new Error(message || "Conversion failed");
      }

      const contentType = res.headers.get("content-type") || "";

      // Handle asynchronous background job if offloaded
      if (res.status === 202 || contentType.includes("application/json")) {
        const json = await res.json();
        if (json.mode === "async" && json.jobId) {
          toast.info("Large job queued. Processing in background...");
          let finished = false;
          while (!finished) {
            await new Promise((r) => setTimeout(r, 1200));
            const pollRes = await fetch(`/api/jobs/${json.jobId}/status`);
            if (pollRes.ok) {
              const pollData = await pollRes.json();
              if (pollData.status === "COMPLETED") {
                const downloadUrl = pollData.downloadUrl || `/api/jobs/${json.jobId}/download`;
                const fileRes = await fetch(downloadUrl);
                const fileBlob = await fileRes.blob();
                const newBlobUrl = URL.createObjectURL(fileBlob);
                const finalName = `converted_${json.jobId}.${selectedFormatId}`;
                setOutput({
                  blobUrl: newBlobUrl,
                  fileName: finalName,
                  size: fileBlob.size,
                  meta: null,
                  isZip: false,
                });
                finished = true;
                toast.success("Conversion completed!");
                return;
              } else if (pollData.status === "FAILED") {
                throw new Error(pollData.error || "Background conversion job failed");
              }
            }
          }
          return;
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
      const finalName = isZip ? "converted_images.zip" : `${baseName}.${selectedFormatId}`;

      // Extract converted dimensions for single preview
      if (!isZip) {
        if (selectedFormatId === "heic" || selectedFormatId === "heif") {
          setOutput({
            blobUrl: newBlobUrl,
            fileName: finalName,
            size: blob.size,
            meta: null,
            isZip: false,
          });
        } else {
          const img = new window.Image();
          img.onload = () => {
            setOutput({
              blobUrl: newBlobUrl,
              fileName: finalName,
              size: blob.size,
              meta: { width: img.naturalWidth, height: img.naturalHeight },
              isZip: false,
            });
          };
          img.onerror = () => {
            setOutput({
              blobUrl: newBlobUrl,
              fileName: finalName,
              size: blob.size,
              meta: null,
              isZip: false,
            });
          };
          img.src = newBlobUrl;
        }
      } else {
        setOutput({
          blobUrl: newBlobUrl,
          fileName: finalName,
          size: blob.size,
          meta: null,
          isZip: true,
        });
      }

      toast.success(isZip ? "All images converted & packaged to ZIP!" : "Image converted successfully!");
    } catch (err: any) {
      console.error(err);
      toast.error(`Conversion failed: ${err.message || "Unknown error"}`);
      setIsConverting(false);
    }
  };

  return (
    <section className="h-full flex flex-col min-h-0 studio-card p-4 sm:p-5 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 shrink-0 pb-3 sm:pb-4 border-b border-white/8">
        <div className="studio-badge-step">
          <CloudUpload className="w-4 h-4" />
        </div>
        <div>
          <h2 className="studio-step-title">2. Choose Conversion Type</h2>
          <p className="studio-step-subtitle">Select a format or tool to process your image</p>
        </div>
      </div>

      {/* Scrollable Column Body with extra bottom padding to avoid cut-off */}
      <div className="flex-1 min-h-0 overflow-y-auto studio-scrollbar pt-3 pb-8 space-y-4">
        {/* 3 Segmented Tabs */}
        <div className="grid grid-cols-3 gap-1 p-1 bg-white/[0.03] border border-white/8 rounded-xl">
          <button
            type="button"
            onClick={() => setActiveTab("format")}
            className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === "format"
                ? "bg-red-600 text-white shadow-md shadow-red-600/30"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            Format Conversion
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("tools")}
            className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === "tools"
                ? "bg-red-600 text-white shadow-md shadow-red-600/30"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Wrench className="w-3.5 h-3.5" />
            Image Tools
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("adjustments")}
            className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === "adjustments"
                ? "bg-red-600 text-white shadow-md shadow-red-600/30"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            Adjustments
          </button>
        </div>

        {/* Tab-Specific Content Views */}
        {activeTab === "format" && <FormatTabContent />}
        {activeTab === "tools" && <ToolsTabContent />}
        {activeTab === "adjustments" && <AdjustmentsTabContent />}
      </div>

      {/* Sticky Bottom Convert CTA with DaisyUI */}
      <div className="pt-3 pb-1 border-t border-white/8 shrink-0 bg-[#0d1117]">
        <button
          type="button"
          onClick={handleConvert}
          disabled={isConverting || files.length === 0}
          className="btn btn-error w-full text-white font-semibold min-h-[46px] h-[46px] flex items-center justify-center gap-2 shadow-lg shadow-red-600/30 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isConverting ? (
            <>
              <span className="loading loading-spinner loading-sm text-white"></span>
              Converting {files.length} {files.length === 1 ? "Image" : "Images"}...
            </>
          ) : (
            <>
              <Zap className="w-4 h-4 fill-white" />
              Convert {files.length > 1 ? `${files.length} Images` : "Image"}
            </>
          )}
        </button>
      </div>
    </section>
  );
}
