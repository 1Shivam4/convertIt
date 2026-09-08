"use client";

import React from "react";
import { MediaDropzone } from "@/components/media-converter/MediaDropzone";
import { MediaFormatSelector } from "@/components/media-converter/MediaFormatSelector";
import { MediaToolOptions } from "@/components/media-converter/MediaToolOptions";
import { MediaConvertButton } from "@/components/media-converter/MediaConvertButton";
import { useMediaConversionStore } from "@/app/store/useMediaConversionStore";
import { useConverterStore } from "@/app/store/useFileDetectionStore";

export default function MediaToConvertor() {
  // Single source of truth — both the homepage drop route and the
  // /tools/convert-media direct upload flow through useConverterStore.
  const { file, setFile, reset } = useConverterStore();
  const { resetOptions } = useMediaConversionStore();

  const handleRemoveFile = () => {
    reset(); // clears file, files, sourceType, stage → back to idle
    resetOptions(); // clears media-specific form options
  };

  const isAudioOnlyFile = Boolean(
    file?.type.startsWith("audio/") ||
    (file?.name && /\.(mp3|wav|aac|flac|ogg|m4a|wma|opus)$/i.test(file.name)),
  );

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-5">
      {/* ── STEP 1 ─ Upload ───────────────────────────────────── */}
      <MediaDropzone
        file={file}
        onFileSelect={setFile}
        onRemoveFile={handleRemoveFile}
        isAudioOnly={isAudioOnlyFile}
      />

      {/* ── STEPS 2 + 3 ─ appear only after a file is loaded ─── */}
      {file && (
        <>
          {/* Step 2: Format + Options */}
          <div className="bg-white/[0.03] border border-white/10 rounded-2xl overflow-hidden">
            {/* Section header */}
            <div className="px-5 py-4 border-b border-white/8 flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center text-[11px] font-bold text-white shrink-0">
                2
              </div>
              <span className="text-sm font-semibold text-white">
                {isAudioOnlyFile
                  ? "Choose Output Format"
                  : "Choose Output Format & Settings"}
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
              <span className="text-sm font-semibold text-white">
                Convert & Download
              </span>
            </div>
            <div className="p-5">
              <MediaConvertButton file={file} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
