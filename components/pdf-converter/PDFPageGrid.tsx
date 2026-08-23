"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  RotateCw,
  Trash2,
  CheckCircle2,
  Circle,
  RefreshCw,
  Eye,
} from "lucide-react";

interface PDFPageGridProps {
  file: File;
  onPageManipulationsChange?: (data: {
    pageRotations: Record<number, number>; // 0-indexed page -> degrees (90, 180, 270)
    deletedPages: number[]; // 0-indexed pages to delete
    selectedPages: number[]; // 0-indexed pages selected for extraction
  }) => void;
  mode?: "full" | "select-only";
}

interface PageThumbnail {
  pageIndex: number;
  dataUrl: string;
  originalWidth: number;
  originalHeight: number;
}

export default function PDFPageGrid({
  file,
  onPageManipulationsChange,
  mode = "full",
}: PDFPageGridProps) {
  const [thumbnails, setThumbnails] = useState<PageThumbnail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Manipulations state
  const [rotations, setRotations] = useState<Record<number, number>>({});
  const [deletedPages, setDeletedPages] = useState<number[]>([]);
  const [selectedPages, setSelectedPages] = useState<number[]>([]);

  // Load and render PDF pages via pdfjs-dist
  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);
    setThumbnails([]);

    async function loadPdfThumbnails() {
      try {
        const pdfjs = await import("pdfjs-dist");
        // Use CDN worker matching version for standard browser environment
        pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

        const arrayBuffer = await file.arrayBuffer();
        const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
        const pdfDoc = await loadingTask.promise;

        const rendered: PageThumbnail[] = [];
        const initialSelected: number[] = [];

        for (let i = 1; i <= pdfDoc.numPages; i++) {
          if (!isMounted) return;
          const page = await pdfDoc.getPage(i);
          const viewport = page.getViewport({ scale: 0.35 });

          const canvas = document.createElement("canvas");
          const context = canvas.getContext("2d");
          if (!context) continue;

          canvas.height = viewport.height;
          canvas.width = viewport.width;

          await page.render({
            canvasContext: context,
            canvas: canvas,
            viewport: viewport,
          } as any).promise;

          const pageIdx = i - 1;
          rendered.push({
            pageIndex: pageIdx,
            dataUrl: canvas.toDataURL("image/png"),
            originalWidth: viewport.width,
            originalHeight: viewport.height,
          });
          initialSelected.push(pageIdx);
        }

        if (isMounted) {
          setThumbnails(rendered);
          setSelectedPages(initialSelected);
          setLoading(false);
        }
      } catch (err: any) {
        if (isMounted) {
          console.error("PDF.js render error:", err);
          setError("Unable to render PDF page thumbnails");
          setLoading(false);
        }
      }
    }

    loadPdfThumbnails();

    return () => {
      isMounted = false;
    };
  }, [file]);

  // Broadcast changes to parent
  useEffect(() => {
    onPageManipulationsChange?.({
      pageRotations: rotations,
      deletedPages: deletedPages,
      selectedPages: selectedPages,
    });
  }, [rotations, deletedPages, selectedPages, onPageManipulationsChange]);

  // Toggle single page rotation (+90°)
  const handleRotatePage = useCallback((pageIdx: number) => {
    setRotations((prev) => {
      const current = prev[pageIdx] || 0;
      const nextAngle = (current + 90) % 360;
      if (nextAngle === 0) {
        const copy = { ...prev };
        delete copy[pageIdx];
        return copy;
      }
      return { ...prev, [pageIdx]: nextAngle };
    });
  }, []);

  // Toggle page deletion
  const handleToggleDelete = useCallback((pageIdx: number) => {
    setDeletedPages((prev) =>
      prev.includes(pageIdx)
        ? prev.filter((p) => p !== pageIdx)
        : [...prev, pageIdx]
    );
  }, []);

  // Toggle page selection for split
  const handleToggleSelect = useCallback((pageIdx: number) => {
    setSelectedPages((prev) =>
      prev.includes(pageIdx)
        ? prev.filter((p) => p !== pageIdx)
        : [...prev, pageIdx]
    );
  }, []);

  // Bulk actions
  const handleRotateAll = useCallback(() => {
    setRotations((prev) => {
      const next: Record<number, number> = {};
      thumbnails.forEach((t) => {
        const current = prev[t.pageIndex] || 0;
        next[t.pageIndex] = (current + 90) % 360;
      });
      return next;
    });
  }, [thumbnails]);

  const handleResetAll = useCallback(() => {
    setRotations({});
    setDeletedPages([]);
    setSelectedPages(thumbnails.map((t) => t.pageIndex));
  }, [thumbnails]);

  if (loading) {
    return (
      <div className="p-8 text-center bg-white/5 border border-white/10 rounded-xl space-y-3">
        <div className="inline-block animate-spin w-6 h-6 border-2 border-red-500 border-t-transparent rounded-full" />
        <p className="text-xs font-semibold text-slate-300">
          Generating PDF page previews...
        </p>
      </div>
    );
  }

  if (error || thumbnails.length === 0) {
    return null; // Fallback gracefully if canvas render fails
  }

  const activePagesCount = thumbnails.length - deletedPages.length;

  return (
    <div className="space-y-3 p-4 bg-[#0e1117] border border-white/10 rounded-2xl">
      {/* Header Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-white/10 text-xs">
        <div className="flex items-center gap-2">
          <Eye className="w-4 h-4 text-red-400" />
          <span className="font-bold text-white">Visual Page Editor</span>
          <span className="px-2 py-0.5 bg-white/10 text-slate-300 rounded-full font-mono text-[10px]">
            {activePagesCount} of {thumbnails.length} Pages Active
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleRotateAll}
            className="flex items-center gap-1 px-2.5 py-1 bg-white/5 hover:bg-white/10 text-slate-200 rounded-lg text-[11px] font-medium transition-colors"
          >
            <RotateCw className="w-3 h-3 text-red-400" />
            Rotate All 90°
          </button>
          <button
            type="button"
            onClick={handleResetAll}
            className="flex items-center gap-1 px-2.5 py-1 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded-lg text-[11px] font-medium transition-colors"
          >
            <RefreshCw className="w-3 h-3" />
            Reset
          </button>
        </div>
      </div>

      {/* Page Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 max-h-[360px] overflow-y-auto pr-1 custom-scrollbar">
        {thumbnails.map((t) => {
          const isDeleted = deletedPages.includes(t.pageIndex);
          const isSelected = selectedPages.includes(t.pageIndex);
          const rotationAngle = rotations[t.pageIndex] || 0;

          return (
            <div
              key={t.pageIndex}
              className={`group relative bg-[#06080b] border rounded-xl p-2 flex flex-col items-center transition-all duration-200 ${
                isDeleted
                  ? "opacity-30 border-red-500/30 line-through"
                  : isSelected
                  ? "border-red-500/60 shadow-lg shadow-red-500/10"
                  : "border-white/10 hover:border-white/20"
              }`}
            >
              {/* Page Number & Selection Badge */}
              <div className="w-full flex items-center justify-between mb-1.5 px-1">
                <span className="text-[10px] font-mono font-bold text-slate-400">
                  Page {t.pageIndex + 1}
                </span>

                <button
                  type="button"
                  onClick={() => handleToggleSelect(t.pageIndex)}
                  className="text-slate-400 hover:text-red-400 transition-colors"
                  title={isSelected ? "Deselect page" : "Select page"}
                >
                  {isSelected ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-red-500" />
                  ) : (
                    <Circle className="w-3.5 h-3.5 text-slate-500" />
                  )}
                </button>
              </div>

              {/* Canvas Thumbnail Preview with Rotation Transform */}
              <div className="relative w-full aspect-[3/4] bg-slate-950/80 rounded-lg overflow-hidden flex items-center justify-center border border-white/5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={t.dataUrl}
                  alt={`Page ${t.pageIndex + 1}`}
                  style={{
                    transform: `rotate(${rotationAngle}deg)`,
                    transition: "transform 0.2s ease-in-out",
                  }}
                  className="max-h-full max-w-full object-contain shadow-md"
                />

                {/* Rotation Indicator Badge */}
                {rotationAngle > 0 && (
                  <span className="absolute top-1 right-1 bg-red-600 text-white text-[9px] font-bold px-1 py-0.5 rounded shadow">
                    {rotationAngle}°
                  </span>
                )}

                {/* Hover Action Overlay */}
                <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleRotatePage(t.pageIndex)}
                    className="p-1.5 bg-red-600 hover:bg-red-500 text-white rounded-lg transition-transform active:scale-95 shadow"
                    title="Rotate Page 90° Clockwise"
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleToggleDelete(t.pageIndex)}
                    className={`p-1.5 rounded-lg transition-transform active:scale-95 shadow ${
                      isDeleted
                        ? "bg-emerald-600 hover:bg-emerald-500 text-white"
                        : "bg-red-950/80 hover:bg-red-900 border border-red-500/40 text-red-300"
                    }`}
                    title={isDeleted ? "Restore Page" : "Delete Page"}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
