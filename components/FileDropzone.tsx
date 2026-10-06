"use client";

import { useRef, useState, type ChangeEvent, type DragEvent } from "react";
import { useRouter } from "next/navigation";
import { CloudUpload, FileText, X, Loader2, Zap } from "lucide-react";
import { toast } from "sonner";
import { useConverterStore } from "../app/store/useFileDetectionStore";
import { useImageConversionStore } from "../app/store/useImageConversionStore";
import { detectFileType } from "../app/lib/file/detect_file_types";
import { useSession } from "../app/lib/auth-client";
import {
  PLAN_LIMITS,
  formatFileSize,
  getUpgradeMessage,
  type Plan,
} from "../app/lib/plans";
import {
  validateImageBatch,
  isSupportedImageFile,
  isKnownImageFile,
} from "../app/lib/file/image-format-guards";
import PDFToConvertor from "./PDFToConvertor";
import ImageToConvertor from "./ImageToConvertor";
import MediaToConvertor from "./MediaToConvertor";

export default function FileDropzone() {
  const router = useRouter();
  const { data: session } = useSession();
  const userPlan: Plan = session?.user
    ? (((session.user as any).plan as Plan) ?? "FREE")
    : "GUEST";
  const planLimits = PLAN_LIMITS[userPlan];

  const {
    file,
    stage,
    sourceType,
    error,
    setFile,
    addFiles,
    setSourceType,
    setError,
    reset,
  } = useConverterStore();

  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFileSize = (filesToCheck: File[]): boolean => {
    for (const f of filesToCheck) {
      if (f.size > planLimits.maxFileSizeBytes) {
        setError(getUpgradeMessage(userPlan, f.size));
        return false;
      }
    }
    return true;
  };

  const processFile = async (file: File) => {
    if (!validateFileSize([file])) return;

    if (isSupportedImageFile(file)) {
      reset();
      addFiles([file]);
      useImageConversionStore.getState().clearFiles();
      useImageConversionStore.getState().addFiles([file]);
      setSourceType({ extension: file.name.split(".").pop() || "img", mimeType: file.type || "image/jpeg" });
      router.push("/images-convert");
      return;
    }

    if (isKnownImageFile(file)) {
      const val = validateImageBatch([file]);
      if (!val.allowed) {
        setError(val.message || "Unsupported image format.");
        toast.error(val.message || "Unsupported image format.");
        return;
      }
    }

    try {
      setFile(file);

      const type = await detectFileType(file);

      if (!type) {
        setError("Unable to determine the file type.");
        return;
      }

      setSourceType(type);
    } catch (error) {
      console.error("File detection failed:", error);

      setError("Failed to detect the file type.");
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    setIsDragging(false);
  };

  const handleDrop = async (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    setIsDragging(false);

    const dropped = Array.from(e.dataTransfer.files);
    if (dropped.length === 0) return;

    // Check if any image files are present
    const hasImages = dropped.some(isKnownImageFile);
    if (hasImages) {
      const validation = validateImageBatch(dropped);
      if (!validation.allowed) {
        setError(validation.message || "Invalid files uploaded.");
        toast.error(validation.message || "Invalid files uploaded.");
        return;
      }

      const maxBatch = planLimits.maxBatchImages || 10;
      if (dropped.length > maxBatch) {
        setError(
          `Your ${planLimits.label} plan allows up to ${maxBatch} images per batch. Upgrade to Standard (30) or Pro (50) for larger batches.`
        );
        return;
      }
      if (!validateFileSize(dropped)) return;
      reset();
      addFiles(dropped);
      useImageConversionStore.getState().clearFiles();
      useImageConversionStore.getState().addFiles(dropped);
      setSourceType({ extension: "img", mimeType: "image/jpeg" });
      router.push("/images-convert");
      return;
    }

    // Multi-file drop: if every file is a PDF, load them all at once
    const allPDFs = dropped.every(
      (f) =>
        f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf"),
    );

    if (dropped.length > 1 && allPDFs) {
      if (!validateFileSize(dropped)) return;
      addFiles(dropped);
      setSourceType({ extension: "pdf", mimeType: "application/pdf" });
      return;
    }

    // Single file (or mixed drop) — use normal detection on the first file
    await processFile(dropped[0]);
  };

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files ?? []);
    if (selected.length === 0) return;

    const hasImages = selected.some(isKnownImageFile);
    if (hasImages) {
      const validation = validateImageBatch(selected);
      if (!validation.allowed) {
        setError(validation.message || "Invalid files uploaded.");
        toast.error(validation.message || "Invalid files uploaded.");
        return;
      }

      const maxBatch = planLimits.maxBatchImages || 10;
      if (selected.length > maxBatch) {
        setError(
          `Your ${planLimits.label} plan allows up to ${maxBatch} images per batch. Upgrade to Standard (30) or Pro (50) for larger batches.`
        );
        return;
      }
      if (!validateFileSize(selected)) return;
      reset();
      addFiles(selected);
      useImageConversionStore.getState().clearFiles();
      useImageConversionStore.getState().addFiles(selected);
      setSourceType({ extension: "img", mimeType: "image/jpeg" });
      router.push("/images-convert");
    }

    const allPDFs = selected.every(
      (f) =>
        f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf"),
    );

    if (selected.length > 1 && allPDFs) {
      if (!validateFileSize(selected)) return;
      addFiles(selected);
      setSourceType({ extension: "pdf", mimeType: "application/pdf" });
    } else {
      await processFile(selected[0]);
    }

    e.target.value = "";
  };

  const handleRemoveFile = () => {
    reset();
  };

  if (stage === "detecting") {
    return (
      <div className="w-full max-w-7xl mx-auto">
        <div className="relative bg-[#131722]/90 backdrop-blur-md rounded-2xl border-2 border-white/10 p-12 text-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-red-600/20 border border-red-500/30 flex items-center justify-center">
              <Loader2 className="w-7 h-7 text-red-500 animate-spin" />
            </div>

            <div>
              <h3 className="text-xl font-bold text-white">
                Detecting file type...
              </h3>

              {file && (
                <p className="mt-1 text-sm text-slate-400">{file.name}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Render conversion interface when file is ready
  if (
    file &&
    (stage === "ready" ||
      stage === "converting" ||
      stage === "completed" ||
      stage === "error")
  ) {
    const isPdf =
      sourceType?.extension === "pdf" ||
      file.type === "application/pdf" ||
      file.name.toLowerCase().endsWith(".pdf");

    if (isPdf) {
      return <PDFToConvertor />;
    }

    const isImage =
      sourceType?.mimeType?.startsWith("image/") ||
      file.type.startsWith("image/");

    if (isImage) {
      return <ImageToConvertor />;
    }

    const isMedia =
      sourceType?.mimeType?.startsWith("video/") ||
      sourceType?.mimeType?.startsWith("audio/") ||
      file.type.startsWith("video/") ||
      file.type.startsWith("audio/");

    if (isMedia) {
      return <MediaToConvertor />;
    }

    // Office documents — route to PDF workspace where Gotenberg converts them
    const OFFICE_MIME_TYPES = [
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // docx
      "application/msword", // doc
      "application/vnd.openxmlformats-officedocument.presentationml.presentation", // pptx
      "application/vnd.ms-powerpoint", // ppt
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // xlsx
      "application/vnd.ms-excel", // xls
      "application/vnd.oasis.opendocument.text", // odt
      "application/vnd.oasis.opendocument.spreadsheet", // ods
      "application/vnd.oasis.opendocument.presentation", // odp
      "application/rtf",
      "text/rtf",
      "application/epub+zip",
      "text/plain",
      "text/csv",
    ];
    const OFFICE_EXTENSIONS = [
      "docx",
      "doc",
      "pptx",
      "ppt",
      "xlsx",
      "xls",
      "odt",
      "ods",
      "odp",
      "rtf",
      "epub",
      "txt",
      "csv",
    ];
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "";

    const isOfficeDoc =
      OFFICE_MIME_TYPES.includes(file.type) ||
      OFFICE_MIME_TYPES.includes(sourceType?.mimeType ?? "") ||
      OFFICE_EXTENSIONS.includes(ext);

    if (isOfficeDoc) {
      return <PDFToConvertor />;
    }
  }

  return (
    <div className="w-full max-w-7xl mx-auto mt-8 relative z-20">
      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={handleFileChange}
        className="hidden"
      />

      {error && (
        <div className="mb-4 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm flex items-start justify-between gap-3 animate-in fade-in">
          <div className="flex items-start gap-2.5">
            <span className="p-1 rounded-md bg-red-500/20 text-red-400 mt-0.5 shrink-0">
              <X className="w-3.5 h-3.5" />
            </span>
            <p className="font-medium leading-relaxed">{error}</p>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              reset();
            }}
            className="text-red-400/80 hover:text-red-300 p-1 shrink-0 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`
          relative
          bg-[#131722]/90
          backdrop-blur-md
          rounded-2xl
          border-2
          transition-all
          duration-300
          p-8 md:p-12
          text-center
          cursor-pointer
          group
          shadow-2xl
          ${
            isDragging
              ? "border-red-500 bg-red-500/10 scale-[1.01]"
              : "border-white/10 hover:border-red-500/40 hover:bg-[#161b28]"
          }
        `}
      >
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-red-600/20 border border-red-500/30 flex items-center justify-center text-red-500 group-hover:scale-110 transition-all duration-300">
            <CloudUpload className="w-8 h-8" />
          </div>

          <div className="space-y-1">
            <h3 className="text-xl md:text-2xl font-bold text-white">
              Select your file here to get started
            </h3>

            <p className="text-sm md:text-base text-slate-400">
              or drop your file here.
            </p>

            <div className="pt-2 flex items-center justify-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-slate-300">
                <Zap className="w-3.5 h-3.5 text-yellow-400" />
                {planLimits.label} Plan: Max{" "}
                {formatFileSize(planLimits.maxFileSizeBytes)}
                {userPlan === "GUEST" && " (Sign up for 40 MB)"}
                {userPlan === "FREE" && " (Upgrade for 200 MB)"}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              fileInputRef.current?.click();
            }}
            className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-500 text-white font-semibold px-6 py-3 rounded-lg text-base shadow-lg shadow-red-600/30 transition-all"
          >
            <CloudUpload className="w-5 h-5" />
            Select File
          </button>
        </div>

        {file && (
          <div
            className="mt-6 pt-6 border-t border-white/10"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10">
              <div className="flex items-center gap-3 min-w-0">
                <FileText className="w-5 h-5 text-red-400 shrink-0" />

                <div className="min-w-0 text-left">
                  <p className="text-sm font-medium text-slate-200 truncate">
                    {file.name}
                  </p>

                  <p className="text-xs text-slate-400">
                    {(file.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleRemoveFile}
                className="text-slate-400 hover:text-red-400 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
