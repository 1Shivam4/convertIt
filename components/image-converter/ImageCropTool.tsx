"use client";

import {
  useRef,
  useState,
  useCallback,
  useEffect,
  type MouseEvent,
} from "react";
import { Crop, RefreshCw, X, Download, CheckCircle2, RotateCcw, Maximize2 } from "lucide-react";
import { toast } from "sonner";

interface CropBox {
  x: number; // 0..1 relative to image
  y: number; // 0..1 relative to image
  w: number; // 0..1 relative to image
  h: number; // 0..1 relative to image
}

type Handle =
  | "nw" | "n" | "ne"
  | "w"  |       "e"
  | "sw" | "s" | "se"
  | "move";

interface Props {
  file: File;
  onClose: () => void;
}

function clamp(v: number, min: number, max: number) {
  return Math.min(Math.max(v, min), max);
}

function formatBytes(b: number) {
  const kb = b / 1024;
  return kb > 1024 ? `${(kb / 1024).toFixed(2)} MB` : `${kb.toFixed(1)} KB`;
}

const HANDLE_SIZE = 12;

const HANDLES: { id: Handle; cursor: string; x: number; y: number }[] = [
  { id: "nw", cursor: "nw-resize", x: 0,   y: 0   },
  { id: "n",  cursor: "n-resize",  x: 0.5, y: 0   },
  { id: "ne", cursor: "ne-resize", x: 1,   y: 0   },
  { id: "w",  cursor: "w-resize",  x: 0,   y: 0.5 },
  { id: "e",  cursor: "e-resize",  x: 1,   y: 0.5 },
  { id: "sw", cursor: "sw-resize", x: 0,   y: 1   },
  { id: "s",  cursor: "s-resize",  x: 0.5, y: 1   },
  { id: "se", cursor: "se-resize", x: 1,   y: 1   },
];

const ASPECT_RATIOS = [
  { label: "Free", value: null },
  { label: "1:1 Square", value: 1 },
  { label: "16:9 Landscape", value: 16 / 9 },
  { label: "4:3 Standard", value: 4 / 3 },
  { label: "9:16 Story", value: 9 / 16 },
];

export default function ImageCropTool({ file, onClose }: Props) {
  const imgRef = useRef<HTMLImageElement>(null);

  const [box, setBox] = useState<CropBox>({ x: 0.1, y: 0.1, w: 0.8, h: 0.8 });
  const [naturalSize, setNaturalSize] = useState({ w: 0, h: 0 });
  const [aspectRatio, setAspectRatio] = useState<number | null>(null);

  const [isProcessing, setIsProcessing] = useState(false);
  const [downloadBlob, setDownloadBlob] = useState<Blob | null>(null);
  const [downloadName, setDownloadName] = useState("");
  const [convertedSize, setConvertedSize] = useState<number | null>(null);
  const [imageUrl] = useState(() => URL.createObjectURL(file));

  const dragRef = useRef<{
    handle: Handle;
    startX: number;
    startY: number;
    startBox: CropBox;
  } | null>(null);

  // Helper to map client coordinates to [0..1] within the image rect
  const getRelativeCoords = useCallback((clientX: number, clientY: number) => {
    const img = imgRef.current;
    if (!img) return { rx: 0, ry: 0 };
    const rect = img.getBoundingClientRect();
    const rx = clamp((clientX - rect.left) / rect.width, 0, 1);
    const ry = clamp((clientY - rect.top) / rect.height, 0, 1);
    return { rx, ry };
  }, []);

  // Set Aspect Ratio preset
  const applyAspectRatio = useCallback(
    (ratio: number | null) => {
      setAspectRatio(ratio);
      if (!ratio || naturalSize.w === 0 || naturalSize.h === 0) return;

      const imgRatio = naturalSize.w / naturalSize.h;
      let newW = 0.8;
      let newH = 0.8;

      if (ratio > imgRatio) {
        // Limited by width
        newW = 0.8;
        newH = (0.8 * imgRatio) / ratio;
      } else {
        // Limited by height
        newH = 0.8;
        newW = (0.8 * ratio) / imgRatio;
      }

      const newX = (1 - newW) / 2;
      const newY = (1 - newH) / 2;

      setBox({ x: newX, y: newY, w: newW, h: newH });
    },
    [naturalSize]
  );

  // Mouse Move & Up handlers
  useEffect(() => {
    const onMouseMove = (e: globalThis.MouseEvent) => {
      const drag = dragRef.current;
      if (!drag || !imgRef.current) return;

      const { rx, ry } = getRelativeCoords(e.clientX, e.clientY);
      const dx = rx - drag.startX;
      const dy = ry - drag.startY;
      const sb = drag.startBox;

      setBox(() => {
        let x = sb.x;
        let y = sb.y;
        let w = sb.w;
        let h = sb.h;

        if (drag.handle === "move") {
          x = clamp(sb.x + dx, 0, 1 - sb.w);
          y = clamp(sb.y + dy, 0, 1 - sb.h);
        } else {
          // Resize handles
          if (drag.handle.includes("e")) w = clamp(sb.w + dx, 0.05, 1 - sb.x);
          if (drag.handle.includes("s")) h = clamp(sb.h + dy, 0.05, 1 - sb.y);
          if (drag.handle.includes("w")) {
            const possibleW = clamp(sb.w - dx, 0.05, sb.x + sb.w);
            x = sb.x + (sb.w - possibleW);
            w = possibleW;
          }
          if (drag.handle.includes("n")) {
            const possibleH = clamp(sb.h - dy, 0.05, sb.y + sb.h);
            y = sb.y + (sb.h - possibleH);
            h = possibleH;
          }

          // Enforce aspect ratio if active
          if (aspectRatio && naturalSize.w > 0 && naturalSize.h > 0) {
            const currentImgRatio = naturalSize.w / naturalSize.h;
            // Target ratio in normalized box space = aspectRatio / currentImgRatio
            const targetBoxRatio = aspectRatio / currentImgRatio;
            h = w / targetBoxRatio;
            if (y + h > 1) {
              h = 1 - y;
              w = h * targetBoxRatio;
            }
          }
        }

        return { x, y, w, h };
      });
    };

    const onMouseUp = () => {
      dragRef.current = null;
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [getRelativeCoords, aspectRatio, naturalSize]);

  const startDrag = useCallback(
    (e: MouseEvent, handle: Handle) => {
      e.preventDefault();
      e.stopPropagation();
      const { rx, ry } = getRelativeCoords(e.clientX, e.clientY);
      dragRef.current = {
        handle,
        startX: rx,
        startY: ry,
        startBox: { ...box },
      };
    },
    [box, getRelativeCoords]
  );

  const startDrawNewBox = useCallback(
    (e: MouseEvent) => {
      e.preventDefault();
      const { rx, ry } = getRelativeCoords(e.clientX, e.clientY);
      const initialBox = { x: rx, y: ry, w: 0.05, h: 0.05 };
      setBox(initialBox);
      dragRef.current = {
        handle: "se",
        startX: rx,
        startY: ry,
        startBox: initialBox,
      };
    },
    [getRelativeCoords]
  );

  const resetCrop = useCallback(() => {
    setBox({ x: 0.1, y: 0.1, w: 0.8, h: 0.8 });
    setAspectRatio(null);
  }, []);

  // Pixel values for server crop execution
  const cropPixels =
    naturalSize.w > 0 && naturalSize.h > 0
      ? {
          left: Math.round(box.x * naturalSize.w),
          top: Math.round(box.y * naturalSize.h),
          width: Math.max(1, Math.round(box.w * naturalSize.w)),
          height: Math.max(1, Math.round(box.h * naturalSize.h)),
        }
      : null;

  const handleCrop = useCallback(async () => {
    if (!cropPixels || cropPixels.width <= 0 || cropPixels.height <= 0) {
      toast.error("Please select a valid crop region.");
      return;
    }

    setIsProcessing(true);
    setDownloadBlob(null);
    setConvertedSize(null);

    try {
      const formData = new FormData();
      formData.append("files", file);
      formData.append("crop", JSON.stringify(cropPixels));

      const res = await fetch("/api/image/crop", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        throw new Error(await res.text());
      }

      const blob = await res.blob();
      setDownloadBlob(blob);

      const sizeHeader = res.headers.get("X-Converted-Size");
      if (sizeHeader) setConvertedSize(parseInt(sizeHeader, 10));

      const cd = res.headers.get("Content-Disposition");
      let fname = `${file.name.substring(0, file.name.lastIndexOf(".")) || "cropped"}_cropped.jpg`;
      if (cd) {
        const m = cd.match(/filename="?([^"]+)"?/);
        if (m?.[1]) fname = m[1];
      }
      setDownloadName(fname);
      toast.success("Crop successful!");
    } catch (err: any) {
      toast.error(err?.message || "Crop execution failed");
    } finally {
      setIsProcessing(false);
    }
  }, [cropPixels, file]);

  const handleDownload = useCallback(() => {
    if (!downloadBlob) return;
    const url = URL.createObjectURL(downloadBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = downloadName;
    a.click();
    URL.revokeObjectURL(url);
  }, [downloadBlob, downloadName]);

  return (
    <div className="bg-white/[0.03] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
      {/* Header Bar */}
      <div className="px-5 py-4 border-b border-white/8 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-blue-600/20 border border-blue-500/30">
            <Crop className="w-4 h-4 text-blue-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Visual Crop Tool</h3>
            <p className="text-[11px] text-slate-400">
              Drag on the image or drag corner handles to set your crop region.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={resetCrop}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-all flex items-center gap-1.5 text-xs"
            title="Reset crop box"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset
          </button>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-white/10 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Preset Aspect Ratios */}
      <div className="px-5 py-3 border-b border-white/8 bg-white/[0.01] flex items-center gap-2 flex-wrap">
        <span className="text-xs font-medium text-slate-400 mr-1">Aspect Ratio:</span>
        {ASPECT_RATIOS.map((ar) => (
          <button
            key={ar.label}
            type="button"
            onClick={() => applyAspectRatio(ar.value)}
            className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-all ${
              aspectRatio === ar.value
                ? "bg-blue-600 border-blue-500 text-white shadow-md shadow-blue-600/20"
                : "bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-white/10"
            }`}
          >
            {ar.label}
          </button>
        ))}
      </div>

      {/* Main Canvas Viewport */}
      <div className="p-6 flex flex-col items-center justify-center bg-[#07080a]">
        {/* Info bar */}
        {cropPixels && (
          <div className="w-full max-w-2xl mb-3 px-3.5 py-2 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-between text-xs font-mono">
            <span className="text-slate-300">
              Output: <strong className="text-blue-400">{cropPixels.width} × {cropPixels.height} px</strong>
            </span>
            <span className="text-slate-400">
              Offset: ({cropPixels.left}, {cropPixels.top})
            </span>
          </div>
        )}

        {/* Display Container - Centers the image and attaches overlay directly onto the img bounds */}
        <div className="relative inline-block select-none max-w-full max-h-[65vh] overflow-hidden rounded-xl border border-white/10 bg-[#0b0d11]">
          {/* Main Image */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            ref={imgRef}
            src={imageUrl}
            alt={file.name}
            className="block max-w-full max-h-[65vh] object-contain pointer-events-auto"
            draggable={false}
            onLoad={(e) => {
              const img = e.currentTarget;
              setNaturalSize({ w: img.naturalWidth, h: img.naturalHeight });
            }}
          />

          {/* Interactive Overlay Layer placed EXACTLY over the image element */}
          <div
            className="absolute inset-0 cursor-crosshair overflow-hidden"
            onMouseDown={startDrawNewBox}
          >
            {/* Dark Mask Outside Crop Box */}
            <div
              className="absolute bg-black/65 top-0 left-0 right-0"
              style={{ height: `${box.y * 100}%` }}
            />
            <div
              className="absolute bg-black/65 bottom-0 left-0 right-0"
              style={{ height: `${(1 - box.y - box.h) * 100}%` }}
            />
            <div
              className="absolute bg-black/65"
              style={{
                top: `${box.y * 100}%`,
                left: 0,
                width: `${box.x * 100}%`,
                height: `${box.h * 100}%`,
              }}
            />
            <div
              className="absolute bg-black/65"
              style={{
                top: `${box.y * 100}%`,
                right: 0,
                width: `${(1 - box.x - box.w) * 100}%`,
                height: `${box.h * 100}%`,
              }}
            />

            {/* Draggable Crop Box */}
            <div
              className="absolute border-2 border-white ring-1 ring-black/50"
              style={{
                left: `${box.x * 100}%`,
                top: `${box.y * 100}%`,
                width: `${box.w * 100}%`,
                height: `${box.h * 100}%`,
                cursor: "move",
              }}
              onMouseDown={(e) => startDrag(e, "move")}
            >
              {/* Rule of Thirds Grid */}
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-1/3 left-0 right-0 border-t border-white/30" />
                <div className="absolute top-2/3 left-0 right-0 border-t border-white/30" />
                <div className="absolute left-1/3 top-0 bottom-0 border-l border-white/30" />
                <div className="absolute left-2/3 top-0 bottom-0 border-l border-white/30" />
              </div>

              {/* 8 Resize Handles */}
              {HANDLES.map((h) => (
                <div
                  key={h.id}
                  className="absolute bg-white rounded-full shadow-lg border-2 border-blue-600 hover:scale-125 transition-transform z-20"
                  style={{
                    width: HANDLE_SIZE,
                    height: HANDLE_SIZE,
                    left: `calc(${h.x * 100}% - ${HANDLE_SIZE / 2}px)`,
                    top: `calc(${h.y * 100}% - ${HANDLE_SIZE / 2}px)`,
                    cursor: h.cursor,
                  }}
                  onMouseDown={(e) => startDrag(e, h.id)}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Action Footer */}
      <div className="p-4 border-t border-white/8 bg-white/[0.02]">
        {!downloadBlob ? (
          <button
            type="button"
            onClick={handleCrop}
            disabled={isProcessing || !cropPixels || cropPixels.width <= 0}
            className="w-full py-3.5 rounded-xl font-bold text-sm text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all shadow-xl shadow-blue-600/20"
          >
            {isProcessing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Cropping Image...
              </>
            ) : (
              <>
                <Crop className="w-4 h-4" />
                Apply Crop
                {cropPixels && (
                  <span className="font-mono text-blue-200 text-xs ml-1">
                    ({cropPixels.width}×{cropPixels.height}px)
                  </span>
                )}
              </>
            )}
          </button>
        ) : (
          <div className="flex items-center gap-4 bg-emerald-600/10 border border-emerald-500/30 rounded-xl p-4">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <div className="flex-1 min-w-0 text-xs">
              <p className="text-white font-semibold">Cropping Successful!</p>
              <p className="text-slate-400 mt-0.5">
                New Size: {convertedSize ? formatBytes(convertedSize) : "Ready"}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleDownload}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-all shadow-md shadow-emerald-600/20"
              >
                <Download className="w-3.5 h-3.5" />
                Download Cropped Image
              </button>
              <button
                type="button"
                onClick={() => setDownloadBlob(null)}
                className="px-3 py-2 rounded-lg bg-white/8 hover:bg-white/15 text-slate-300 text-xs font-semibold transition-all"
              >
                Crop Again
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
