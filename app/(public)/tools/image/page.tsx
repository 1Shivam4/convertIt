import { Metadata } from "next";
import { Sparkles } from "lucide-react";
import ImageStudio from "@/components/studios/ImageStudio";

export const metadata: Metadata = {
  title: "Image & Graphics Studio — Free Multi-Format Converter & Optimizer | ConvertIt",
  description:
    "Convert PNG, JPG, WebP, AVIF, GIF, TIFF, BMP, and multi-resolution ICO Favicons with smart quality compression, dimension scaling, aspect ratio locking, cropping, and EXIF privacy stripping.",
  keywords: [
    "image converter",
    "PNG to WebP",
    "JPG to PNG",
    "AVIF converter",
    "compress image",
    "crop image",
    "favicon generator",
    "ICO converter",
    "batch image converter",
  ],
};

export default function ImageStudioPage() {
  return (
    <div className="min-h-screen bg-[#0b0d11] text-white">
      {/* ── Studio Hero Header ────────────────────────────────────── */}
      <div className="relative overflow-hidden border-b border-white/8">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 via-transparent to-purple-600/5 pointer-events-none" />
        <div className="max-w-4xl mx-auto px-6 py-14 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold mb-5">
            <Sparkles className="w-3.5 h-3.5" />
            Image &amp; Graphics Hub · Powered by Sharp (libvips)
          </div>

          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white mb-3">
            Image &amp; Graphics Hub
          </h1>
          <p className="text-slate-400 text-base max-w-xl mx-auto">
            Batch convert between PNG, JPG, WebP, AVIF, GIF, TIFF, BMP &amp; ICO with
            smart quality optimization, resizing, aspect-ratio lock, and EXIF privacy cleaning.
          </p>

          {/* Feature Chips */}
          <div className="flex flex-wrap justify-center gap-2 mt-6">
            {[
              "WebP & AVIF Next-Gen",
              "Smart Compression",
              "Multi-Res ICO Favicon",
              "Aspect Ratio Lock",
              "EXIF Metadata Stripper",
              "Batch ZIP Export",
            ].map((chip) => (
              <span
                key={chip}
                className="px-3 py-1 text-[11px] font-semibold rounded-full bg-white/5 text-slate-300 border border-white/10"
              >
                {chip}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── Image Studio Workspace ────────────────────────────────── */}
      <ImageStudio />
    </div>
  );
}
