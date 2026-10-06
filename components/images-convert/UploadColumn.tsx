"use client";

import { useRef, useState, useEffect, useMemo, ChangeEvent, DragEvent } from "react";
import Image from "next/image";
import {
  Timer,
  CloudUpload,
  FolderOpen,
  X,
  Trash2,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { useImageConversionStore } from "@/app/store/useImageConversionStore";
import { useSession } from "@/app/lib/auth-client";
import { PLAN_LIMITS, formatFileSize, type Plan } from "@/app/lib/plans";
import { validateImageBatch, isSupportedImageFile } from "@/app/lib/file/image-format-guards";

export default function UploadColumn() {
  const { data: session } = useSession();
  const userPlan: Plan = session?.user
    ? (((session.user as any).plan as Plan) ?? "FREE")
    : "GUEST";
  const planLimits = PLAN_LIMITS[userPlan];
  const maxBatch = planLimits.maxBatchImages || 10;

  const {
    files,
    selectedIndex,
    imageMetaMap,
    addFiles,
    removeFile,
    setSelectedIndex,
    setImageMeta,
    clearFiles,
  } = useImageConversionStore();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [heicPreviews, setHeicPreviews] = useState<Record<number, string>>({});
  const [heicLoading, setHeicLoading] = useState<Record<number, boolean>>({});

  const activeFile = files[selectedIndex] || files[0] || null;

  // Extract dimensions for standard web images
  useEffect(() => {
    files.forEach((file, idx) => {
      if (imageMetaMap[idx]) return;
      const isHeic = file.name.toLowerCase().endsWith(".heic") || file.name.toLowerCase().endsWith(".heif");
      if (isHeic) return; // Handled by HEIC preview decoder

      const objectUrl = URL.createObjectURL(file);
      const img = new window.Image();
      img.onload = () => {
        setImageMeta(idx, { width: img.naturalWidth, height: img.naturalHeight });
        URL.revokeObjectURL(objectUrl);
      };
      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
      };
      img.src = objectUrl;
    });
  }, [files, imageMetaMap, setImageMeta]);

  // Object URLs for standard web images
  const previewUrls = useMemo(() => {
    return files.map((f) => URL.createObjectURL(f));
  }, [files]);

  useEffect(() => {
    return () => {
      previewUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [previewUrls]);

  // Generate real browser-renderable previews for Apple HEIC / HEIF photos
  useEffect(() => {
    files.forEach((file, idx) => {
      const isHeic = file.name.toLowerCase().endsWith(".heic") || file.name.toLowerCase().endsWith(".heif");
      if (!isHeic || heicPreviews[idx] || heicLoading[idx]) return;

      setHeicLoading((prev) => ({ ...prev, [idx]: true }));
      const formData = new FormData();
      formData.append("file", file);

      fetch("/api/image/preview", { method: "POST", body: formData })
        .then(async (res) => {
          if (!res.ok) throw new Error("HEIC preview generation failed");
          const blob = await res.blob();
          const url = URL.createObjectURL(blob);
          setHeicPreviews((prev) => ({ ...prev, [idx]: url }));
          const w = parseInt(res.headers.get("X-Image-Width") || "0", 10);
          const h = parseInt(res.headers.get("X-Image-Height") || "0", 10);
          if (w > 0 && h > 0) {
            setImageMeta(idx, { width: w, height: h });
          }
        })
        .catch((err) => {
          console.warn("Could not generate HEIC preview thumbnail:", err);
        })
        .finally(() => {
          setHeicLoading((prev) => ({ ...prev, [idx]: false }));
        });
    });
  }, [files, heicPreviews, heicLoading, setImageMeta]);

  useEffect(() => {
    return () => {
      Object.values(heicPreviews).forEach((url) => URL.revokeObjectURL(url));
    };
  }, [heicPreviews]);

  const getEffectivePreviewUrl = (idx: number) => {
    const file = files[idx];
    if (!file) return null;
    const isHeic = file.name.toLowerCase().endsWith(".heic") || file.name.toLowerCase().endsWith(".heif");
    if (isHeic) {
      return heicPreviews[idx] || null;
    }
    return previewUrls[idx] || null;
  };

  const handleIncomingFiles = (incoming: File[]) => {
    if (incoming.length === 0) return;

    // Validate format compatibility
    const validation = validateImageBatch(incoming);
    if (!validation.allowed) {
      toast.error(validation.message || "Invalid files uploaded.");
      return;
    }

    const totalCount = files.length + incoming.length;
    if (totalCount > maxBatch) {
      toast.error(
        `Your ${planLimits.label} plan allows up to ${maxBatch} images per batch. Upgrade to Standard (30) or Pro (50) for larger batches.`
      );
      return;
    }

    // Size validation
    for (const f of incoming) {
      if (f.size > planLimits.maxFileSizeBytes) {
        toast.error(`"${f.name}" exceeds your plan limit of ${formatFileSize(planLimits.maxFileSizeBytes)}.`);
        return;
      }
    }

    addFiles(incoming);
    toast.success(`Added ${incoming.length} image${incoming.length > 1 ? "s" : ""}`);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const dropped = Array.from(e.dataTransfer.files);
    handleIncomingFiles(dropped);
  };

  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files ?? []);
    handleIncomingFiles(selected);
    e.target.value = "";
  };

  return (
    <section className="h-full flex flex-col min-h-0 studio-card p-5 overflow-hidden">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,.jpg,.jpeg,.png,.webp,.avif,.gif,.tiff,.bmp,.heic,.heif"
        onChange={handleFileInputChange}
        className="hidden"
      />

      {/* Header */}
      <div className="flex items-center gap-3 shrink-0 pb-4 border-b border-white/8">
        <div className="studio-badge-step">
          <Timer className="w-4 h-4" />
        </div>
        <div>
          <h2 className="studio-step-title">1. Upload Image</h2>
          <p className="studio-step-subtitle">Drag &amp; drop your image here or choose a file</p>
        </div>
      </div>

      {/* Scrollable Column Body */}
      <div className="flex-1 min-h-0 overflow-y-auto studio-scrollbar py-4 space-y-4">
        {/* Dropzone */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={`studio-dropzone p-6 flex flex-col items-center justify-center text-center transition-all ${
            isDragging ? "drag-active" : ""
          }`}
        >
          <div className="w-12 h-12 rounded-full bg-red-600/10 border border-red-500/20 flex items-center justify-center mb-3">
            <CloudUpload className="w-6 h-6 text-red-500" />
          </div>
          <p className="text-sm font-medium text-slate-300 mb-2">Drag &amp; drop an image here or</p>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="btn btn-error btn-sm text-white font-semibold gap-2 mb-3 shadow-md shadow-red-600/30 cursor-pointer"
          >
            <FolderOpen className="w-4 h-4" />
            Choose File
          </button>
          <div className="flex flex-wrap items-center justify-center gap-1.5 mt-1">
            <span className="badge badge-neutral badge-xs font-mono text-slate-300 border-white/10">JPG</span>
            <span className="badge badge-neutral badge-xs font-mono text-slate-300 border-white/10">PNG</span>
            <span className="badge badge-neutral badge-xs font-mono text-slate-300 border-white/10">WEBP</span>
            <span className="badge badge-neutral badge-xs font-mono text-slate-300 border-white/10">AVIF</span>
            <span className="badge badge-error badge-outline badge-xs font-mono font-semibold">HEIC</span>
            <span className="badge badge-neutral badge-xs font-mono text-slate-300 border-white/10">GIF</span>
            <span className="badge badge-neutral badge-xs font-mono text-slate-300 border-white/10">TIFF</span>
            <span className="badge badge-neutral badge-xs font-mono text-slate-300 border-white/10">BMP</span>
          </div>
          <p className="text-[10px] text-slate-500 mt-2">
            Max batch: <span className="badge badge-outline badge-error badge-xs font-semibold">{maxBatch} images</span> ({planLimits.label} plan)
          </p>
        </div>

        {/* Preview Section */}
        {files.length > 0 && (
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <span className="studio-label flex items-center gap-2">
                Preview
                <span className="badge badge-neutral badge-sm font-mono border-white/10 text-slate-300">
                  {files.length} {files.length === 1 ? "file" : "files"}
                </span>
              </span>
              {files.length > 1 && (
                <button
                  type="button"
                  onClick={clearFiles}
                  className="btn btn-ghost btn-xs text-slate-400 hover:text-error gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" />
                  Clear all
                </button>
              )}
            </div>

            {/* Active Preview Card */}
            {activeFile && (() => {
              const activeIsHeic = activeFile.name.toLowerCase().endsWith(".heic") || activeFile.name.toLowerCase().endsWith(".heif");
              const effectiveUrl = getEffectivePreviewUrl(selectedIndex);
              const isDecodingHeic = activeIsHeic && !effectiveUrl && heicLoading[selectedIndex];

              return (
                <div className="relative bg-white/[0.02] border border-white/10 rounded-xl overflow-hidden group">
                  <button
                    type="button"
                    onClick={() => removeFile(selectedIndex)}
                    className="absolute top-2 right-2 z-10 btn btn-circle btn-xs bg-black/60 hover:bg-error border-none text-white transition-all cursor-pointer"
                    title="Remove image"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>

                  <div className="relative aspect-video w-full bg-black/40 flex items-center justify-center overflow-hidden">
                    {effectiveUrl ? (
                      <Image
                        src={effectiveUrl}
                        alt={activeFile.name}
                        fill
                        unoptimized
                        className="object-cover"
                      />
                    ) : activeIsHeic ? (
                      <div className="flex flex-col items-center justify-center p-6 text-center space-y-2">
                        {isDecodingHeic ? (
                          <>
                            <span className="loading loading-spinner loading-md text-red-500"></span>
                            <p className="text-xs text-slate-300 font-medium">Generating HEIC preview…</p>
                          </>
                        ) : (
                          <>
                            <div className="w-10 h-10 rounded-xl bg-red-600/20 border border-red-500/30 flex items-center justify-center text-red-500">
                              <Sparkles className="w-5 h-5" />
                            </div>
                            <p className="text-xs text-slate-300 font-medium">Apple HEIC Photo</p>
                          </>
                        )}
                        <span className="badge badge-error badge-outline badge-xs font-mono">Ready to convert</span>
                      </div>
                    ) : null}
                  </div>

                  <div className="p-3 bg-white/[0.02] border-t border-white/8 flex items-center justify-between text-xs">
                    <span className="text-slate-200 font-medium truncate max-w-[150px]" title={activeFile.name}>
                      {activeFile.name}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="badge badge-ghost badge-xs font-mono">{formatFileSize(activeFile.size)}</span>
                      {imageMetaMap[selectedIndex] && (
                        <span className="badge badge-outline badge-xs font-mono text-slate-400">
                          {imageMetaMap[selectedIndex].width} × {imageMetaMap[selectedIndex].height}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Batch Thumbnail Selector */}
            {files.length > 1 && (
              <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 pt-1">
                {files.map((file, idx) => {
                  const isSelected = idx === selectedIndex;
                  const thumbUrl = getEffectivePreviewUrl(idx);
                  const isHeic = file.name.toLowerCase().endsWith(".heic") || file.name.toLowerCase().endsWith(".heif");

                  return (
                    <button
                      key={`${file.name}-${idx}`}
                      type="button"
                      onClick={() => setSelectedIndex(idx)}
                      className={`relative aspect-square rounded-lg overflow-hidden border transition-all cursor-pointer ${
                        isSelected
                          ? "border-red-500 ring-2 ring-red-500/30"
                          : "border-white/10 opacity-70 hover:opacity-100"
                      }`}
                    >
                      {thumbUrl ? (
                        <Image
                          src={thumbUrl}
                          alt={file.name}
                          fill
                          unoptimized
                          className="object-cover"
                        />
                      ) : isHeic ? (
                        <div className="w-full h-full bg-black/60 flex items-center justify-center text-[9px] text-red-400 font-mono font-bold">
                          HEIC
                        </div>
                      ) : null}
                      <span className="absolute bottom-0 inset-x-0 bg-black/70 text-[9px] text-white truncate px-1 py-0.5">
                        {idx + 1}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
