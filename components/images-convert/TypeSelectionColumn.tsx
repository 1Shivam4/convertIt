"use client";

import { CloudUpload, FileText, Wrench, SlidersHorizontal, Zap, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useImageConversionStore } from "@/app/store/useImageConversionStore";
import FormatTileGrid from "./FormatTileGrid";
import AdvancedOptionsDrawer from "./AdvancedOptionsDrawer";

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
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || "Conversion failed");
      }

      const contentType = res.headers.get("content-type") || "";
      const isZip = contentType.includes("zip") || files.length > 1;

      const blob = await res.blob();
      const newBlobUrl = URL.createObjectURL(blob);

      const baseName = activeFile
        ? activeFile.name.substring(0, activeFile.name.lastIndexOf("."))
        : "converted";
      const finalName = isZip ? "converted_images.zip" : `${baseName}.${selectedFormatId}`;

      // Extract converted dimensions for single preview
      if (!isZip) {
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
        img.src = newBlobUrl;
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
    <section className="h-full flex flex-col min-h-0 studio-card p-5 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 shrink-0 pb-4 border-b border-white/8">
        <div className="studio-badge-step">
          <CloudUpload className="w-4 h-4" />
        </div>
        <div>
          <h2 className="studio-step-title">2. Choose Conversion Type</h2>
          <p className="studio-step-subtitle">Select a format or tool to process your image</p>
        </div>
      </div>

      {/* Scrollable Column Body */}
      <div className="flex-1 min-h-0 overflow-y-auto studio-scrollbar py-4 space-y-5">
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

        {/* Format Tiles Grid */}
        <FormatTileGrid />

        {/* Collapsible Advanced Options */}
        <AdvancedOptionsDrawer />
      </div>

      {/* Sticky Bottom Convert CTA with DaisyUI */}
      <div className="pt-3 border-t border-white/8 shrink-0">
        <button
          type="button"
          onClick={handleConvert}
          disabled={isConverting || files.length === 0}
          className="btn btn-error w-full text-white font-semibold py-3 flex items-center justify-center gap-2 shadow-lg shadow-red-600/30 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
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
