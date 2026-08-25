// Server Component — no "use client" directive
import { Sparkles } from "lucide-react";
import ImageToConvertor from "@/components/ImageToConvertor";

export const metadata = {
  title: "Image Converter & Optimizer | ConvertIt",
  description:
    "Convert PNG, JPG, WebP, AVIF, GIF, TIFF, BMP, and ICO images with quality controls, resizing, rotation, and EXIF privacy stripping.",
};

export default function ImageConverterPage() {
  return (
    <div className="min-h-screen bg-[#0b0d11] text-white">
      {/* ── Static Hero Header (Server Rendered) ─────────────────── */}
      <div className="relative overflow-hidden border-b border-white/8">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 via-transparent to-purple-600/5 pointer-events-none" />
        <div className="max-w-4xl mx-auto px-6 py-14 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold mb-5">
            <Sparkles className="w-3.5 h-3.5" />
            Powered by Sharp — Fastest Image Engine
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white mb-3">
            Image Converter
          </h1>
          <p className="text-slate-400 text-base max-w-xl mx-auto">
            Convert between PNG, JPG, WebP, AVIF, GIF, TIFF, BMP &amp; ICO with full
            quality, resize, and EXIF controls.
          </p>
        </div>
      </div>

      <ImageToConvertor />
    </div>
  );
}
