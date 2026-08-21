"use client";

import { useRef, useState, type ChangeEvent, type DragEvent } from "react";
import { CloudUpload, FileText, X, Loader2 } from "lucide-react";
import { useConverterStore } from "../app/store/useFileDetectionStore";
import { detectFileType } from "../app/lib/file/detect_file_types";
import PDFToConvertor from "./PDFToConvertor";

export default function FileDropzone() {
  const { file, stage, sourceType, setFile, setSourceType, setError, reset } =
    useConverterStore();

  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = async (file: File) => {
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

    const file = e.dataTransfer.files?.[0];

    if (!file) {
      return;
    }

    await processFile(file);
  };

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (!file) {
      return;
    }

    await processFile(file);

    // Allows selecting the same file again.
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

  // Render 2-Section PDF converter interface when PDF file is ready or being converted
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
  }

  return (
    <div className="w-full max-w-7xl mx-auto mt-8 relative z-20">
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileChange}
        className="hidden"
      />

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
