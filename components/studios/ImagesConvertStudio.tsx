"use client";

import UploadColumn from "@/components/images-convert/UploadColumn";
import TypeSelectionColumn from "@/components/images-convert/TypeSelectionColumn";
import OutputColumn from "@/components/images-convert/OutputColumn";

export default function ImagesConvertStudio() {
  return (
    <div className="w-full h-full min-h-0 flex flex-col bg-[#0b0d11] text-slate-100 overflow-hidden">
      {/* 3-Column Studio Workstation:
          - Desktop (>=1280px / xl): Full-width 3-column grid, 100% height
          - Laptop / Tablet (768px - 1279px): Side-by-side columns with horizontal scroll so nothing is crushed
          - Mobile (<768px): Vertical stacked workstation with smooth scroll
      */}
      <div className="flex-1 min-h-0 p-3 sm:p-4 lg:p-5 w-full h-full overflow-hidden">
        <div className="h-full w-full flex flex-col md:flex-row xl:grid xl:grid-cols-3 gap-4 lg:gap-5 overflow-y-auto md:overflow-y-hidden md:overflow-x-auto xl:overflow-hidden studio-scrollbar">
          <div className="w-full md:w-[360px] xl:w-auto h-[620px] md:h-full shrink-0 min-h-0">
            <UploadColumn />
          </div>
          <div className="w-full md:w-[380px] xl:w-auto h-[620px] md:h-full shrink-0 min-h-0">
            <TypeSelectionColumn />
          </div>
          <div className="w-full md:w-[360px] xl:w-auto h-[620px] md:h-full shrink-0 min-h-0">
            <OutputColumn />
          </div>
        </div>
      </div>
    </div>
  );
}
