"use client";

import UploadColumn from "@/components/images-convert/UploadColumn";
import TypeSelectionColumn from "@/components/images-convert/TypeSelectionColumn";
import OutputColumn from "@/components/images-convert/OutputColumn";

export default function ImagesConvertStudio() {
  return (
    <div className="w-full h-full min-h-0 flex flex-col bg-[#0b0d11] text-slate-100 overflow-hidden">
      {/* 3-Column Studio Grid: 100% full width & full height */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-5 p-4 lg:p-5 overflow-hidden w-full h-full">
        <UploadColumn />
        <TypeSelectionColumn />
        <OutputColumn />
      </div>
    </div>
  );
}
