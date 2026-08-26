"use client";

import React, { useState } from "react";
import { MediaDropzone } from "@/components/media-converter/MediaDropzone";
import { MediaFormatSelector } from "@/components/media-converter/MediaFormatSelector";
import { MediaToolOptions } from "@/components/media-converter/MediaToolOptions";
import { MediaConvertButton } from "@/components/media-converter/MediaConvertButton";
import { useMediaConversionStore } from "@/app/store/useMediaConversionStore";
import { useConverterStore } from "@/app/store/useFileDetectionStore";

export default function MediaToConvertor() {
  const { file: storeFile, setFile: setStoreFile, reset: resetStore } =
    useConverterStore();
  const [localFile, setLocalFile] = useState<File | null>(null);
  const { resetOptions } = useMediaConversionStore();

  const activeFile = localFile || storeFile;

  const handleFileSelect = (file: File) => {
    setLocalFile(file);
    setStoreFile(file);
  };

  const handleRemoveFile = () => {
    setLocalFile(null);
    resetStore();
    resetOptions();
  };

  const isAudioOnlyFile = Boolean(
    activeFile?.type.startsWith("audio/") ||
      (activeFile?.name &&
        /\.(mp3|wav|aac|flac|ogg|m4a|wma|opus)$/i.test(activeFile.name))
  );

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-5">
      {/* ── STEP 1 ─ Upload ───────────────────────────────────── */}
      <MediaDropzone
        file={activeFile}
        onFileSelect={handleFileSelect}
        onRemoveFile={handleRemoveFile}
        isAudioOnly={isAudioOnlyFile}
      />

      {/* ── STEPS 2 + 3 ─ appear only after a file is loaded ─── */}
      {activeFile && (
        <>
          {/* Step 2: Format + Options */}
          <div className="bg-white/[0.03] border border-white/10 rounded-2xl overflow-hidden">
            {/* Section header */}
            <div className="px-5 py-4 border-b border-white/8 flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center text-[11px] font-bold text-white shrink-0">
                2
              </div>
              <span className="text-sm font-semibold text-white">
                {isAudioOnlyFile ? "Choose Output Format" : "Choose Output Format & Settings"}
              </span>
            </div>

            {/* Format selector */}
            <div className="p-5">
              <MediaFormatSelector isAudioOnly={isAudioOnlyFile} />
            </div>

            {/* Options */}
            <div className="border-t border-white/8 p-5">
              <MediaToolOptions isAudioOnlyFile={isAudioOnlyFile} />
            </div>
          </div>

          {/* Step 3: Convert */}
          <div className="bg-white/[0.03] border border-white/10 rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-white/8 flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center text-[11px] font-bold text-white shrink-0">
                3
              </div>
              <span className="text-sm font-semibold text-white">Convert & Download</span>
            </div>
            <div className="p-5">
              <MediaConvertButton file={activeFile} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
