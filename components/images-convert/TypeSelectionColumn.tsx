"use client";

import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CloudUpload, FileText, Wrench, SlidersHorizontal, Zap } from "lucide-react";
import { useImageConversionStore } from "@/app/store/useImageConversionStore";
import { imageConverterSchema, ImageConverterFormValues } from "@/app/lib/schemas/imageConverterSchema";
import { useImageConversion } from "@/app/hooks/useImageConversion";
import FormatTabContent from "./FormatTabContent";
import ToolsTabContent from "./ToolsTabContent";
import AdjustmentsTabContent from "./AdjustmentsTabContent";

export default function TypeSelectionColumn() {
  const {
    files,
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
  } = useImageConversionStore();

  const { convertImages, isPending } = useImageConversion();

  // ── Form with Zod Resolver ─────────────────────────────────────────────────
  const {
    handleSubmit,
    formState: { errors },
  } = useForm<ImageConverterFormValues>({
    resolver: zodResolver(imageConverterSchema),
    values: {
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
      backgroundColor: useBackgroundColor ? backgroundColor : undefined,
    },
  });

  const onSubmit: SubmitHandler<ImageConverterFormValues> = (values) => {
    convertImages(values);
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="h-full flex flex-col min-h-0 studio-card p-4 sm:p-5 overflow-hidden"
    >
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

      {/* Scrollable Column Body */}
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

        {/* Validation Errors banner if any */}
        {Object.keys(errors).length > 0 && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400 space-y-1">
            {errors.selectedFormatId && <p>{errors.selectedFormatId.message}</p>}
            {errors.quality && <p>{errors.quality.message}</p>}
            {errors.width && <p>{errors.width.message}</p>}
            {errors.height && <p>{errors.height.message}</p>}
          </div>
        )}

        {/* Tab-Specific Content Views */}
        {activeTab === "format" && <FormatTabContent />}
        {activeTab === "tools" && <ToolsTabContent />}
        {activeTab === "adjustments" && <AdjustmentsTabContent />}
      </div>

      {/* Sticky Bottom Convert CTA */}
      <div className="pt-3 pb-1 border-t border-white/8 shrink-0 bg-[#0d1117]">
        <button
          type="submit"
          disabled={isPending || files.length === 0}
          className="btn btn-error w-full text-white font-semibold min-h-[46px] h-[46px] flex items-center justify-center gap-2 shadow-lg shadow-red-600/30 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending ? (
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
    </form>
  );
}
