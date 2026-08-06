import Link from "next/link";
import Image from "next/image";
import FileDropzone from "../components/FileDropzone";
import { navbarItems } from "../utils/vars";
import {
  ChevronDown,
  RefreshCw,
  Volume2,
  Zap,
  ShieldCheck,
  Globe,
  Sliders,
  ArrowRight,
} from "lucide-react";

export default function PublicPage() {
  return (
    <div className="relative min-h-screen bg-[#0b0d11] text-slate-100 overflow-hidden">
      {/* Background Decorative Grids and Radial Glows */}
      <div className="absolute inset-0 bg-grid-pattern opacity-30 pointer-events-none" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-tr from-red-600/10 via-red-500/5 to-transparent blur-3xl rounded-full pointer-events-none" />

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-24 relative z-10">
        {/* HERO SECTION */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center mb-12">
          {/* Left Column: Hero Text */}
          <div className="lg:col-span-7 space-y-6 text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold uppercase tracking-wider">
              <Zap className="w-3.5 h-3.5" />
              <span>Fast & Secure File Converter</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-tight">
              Convert Any File
            </h1>

            <p className="text-lg sm:text-xl text-slate-300 max-w-2xl font-normal leading-relaxed">
              Drop a file and pick what to turn it into. CloudConvert handles 200+
              formats across documents, images, audio, video, archives and more —
              straight from your browser.
            </p>
          </div>

          {/* Right Column: High-Tech Graphic (WAV -> MP3 illustration with glowing concentric circles) */}
          <div className="lg:col-span-5 relative flex items-center justify-center min-h-[260px] sm:min-h-[300px]">
            {/* Concentric Glow Rings */}
            <div className="absolute w-72 h-72 rounded-full border border-white/5 animate-pulse-glow" />
            <div className="absolute w-56 h-56 rounded-full border border-red-500/10" />
            <div className="absolute w-40 h-40 rounded-full border border-red-500/20" />

            {/* Visual Conversion Flow Cards */}
            <div className="relative flex items-center gap-4 sm:gap-6 z-10">
              {/* Source Card: WAV */}
              <div className="bg-[#141824]/90 border border-white/10 rounded-2xl p-5 w-32 sm:w-36 flex flex-col items-center gap-2 shadow-2xl backdrop-blur-md hover:border-white/20 transition-all">
                <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-300">
                  <Volume2 className="w-6 h-6 text-slate-200" />
                </div>
                <div className="flex items-center gap-1 font-bold text-white text-sm tracking-wider">
                  <span>WAV</span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </div>
              </div>

              {/* Loop Arrow Divider: TO */}
              <div className="flex flex-col items-center gap-1 z-20">
                <div className="w-10 h-10 rounded-full bg-[#181d2c] border border-red-500/40 flex items-center justify-center text-red-400 shadow-lg shadow-red-600/20">
                  <RefreshCw className="w-4 h-4 animate-spin-slow" />
                </div>
                <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                  TO
                </span>
              </div>

              {/* Target Card: MP3 */}
              <div className="bg-[#18151c]/95 border-2 border-red-500/60 rounded-2xl p-5 w-32 sm:w-36 flex flex-col items-center gap-2 shadow-2xl shadow-red-600/20 backdrop-blur-md scale-105">
                <div className="w-12 h-12 rounded-xl bg-red-500/20 border border-red-500/30 flex items-center justify-center text-red-400">
                  <Volume2 className="w-6 h-6 text-red-400" />
                </div>
                <div className="flex items-center gap-1 font-bold text-white text-sm tracking-wider">
                  <span>MP3</span>
                  <ChevronDown className="w-3.5 h-3.5 text-red-400" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* FILE DROPZONE CARD */}
        <FileDropzone />

        {/* SUPPORTED CONVERSION CATEGORIES (Server Rendered) */}
        <div className="mt-28 space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-3xl font-bold text-white">
              Supported Conversions & Tools
            </h2>
            <p className="text-slate-400 text-sm sm:text-base max-w-xl mx-auto">
              Everything you need to convert, compress, and edit files right in your browser.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {navbarItems.map((category) => (
              <div
                key={category.name}
                className="bg-[#121622]/80 border border-white/10 rounded-2xl p-6 flex flex-col justify-between hover:border-red-500/40 hover:bg-[#151a28] transition-all group"
              >
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-red-600/10 border border-red-500/20 flex items-center justify-center group-hover:scale-105 transition-transform">
                      <Image
                        src={category.icon}
                        width={22}
                        height={22}
                        alt={category.name}
                        className="w-5 h-5"
                      />
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-lg">
                        {category.name} Tools
                      </h3>
                      <span className="text-xs text-slate-400">
                        {category.itemsList.length} popular formats
                      </span>
                    </div>
                  </div>

                  <ul className="space-y-2 text-sm">
                    {category.itemsList.slice(0, 4).map((tool) => (
                      <li key={tool.name}>
                        <Link
                          href={tool.location}
                          className="flex items-center justify-between text-slate-300 hover:text-white py-1 transition-colors"
                        >
                          <span className="truncate">{tool.name}</span>
                          <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-red-400 transition-colors" />
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-6 pt-4 border-t border-white/5">
                  <span className="text-xs font-medium text-red-400 group-hover:underline inline-flex items-center gap-1">
                    Explore all {category.name} tools &rarr;
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* FEATURES HIGHLIGHT GRID (Server Rendered) */}
        <div className="mt-28 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-[#121622]/60 border border-white/5 rounded-2xl p-6 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-red-400">
              <Zap className="w-5 h-5" />
            </div>
            <h4 className="text-lg font-bold text-white">Lightning Fast</h4>
            <p className="text-slate-400 text-sm">
              High-performance servers ensure file conversions take only seconds.
            </p>
          </div>

          <div className="bg-[#121622]/60 border border-white/5 rounded-2xl p-6 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-red-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h4 className="text-lg font-bold text-white">Data Privacy</h4>
            <p className="text-slate-400 text-sm">
              Your files are encrypted and automatically deleted after processing.
            </p>
          </div>

          <div className="bg-[#121622]/60 border border-white/5 rounded-2xl p-6 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-red-400">
              <Sliders className="w-5 h-5" />
            </div>
            <h4 className="text-lg font-bold text-white">Custom Options</h4>
            <p className="text-slate-400 text-sm">
              Adjust resolutions, quality settings, bitrate, and codec parameters.
            </p>
          </div>
        </div>

        {/* FOOTER */}
        <footer className="mt-32 pt-12 border-t border-white/10 text-center md:text-left text-slate-400 text-xs">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-red-600/20 border border-red-500/30 flex items-center justify-center p-1">
                <Image
                  src="/icons/loop.svg"
                  width={16}
                  height={16}
                  alt="ConvertIt"
                />
              </div>
              <span className="font-bold text-white text-sm">
                convert<span className="text-red-500">it</span>
              </span>
              <span className="ml-2 text-slate-500">
                &copy; {new Date().getFullYear()} ConvertIt Inc. All rights reserved.
              </span>
            </div>

            <div className="flex items-center gap-6 text-slate-400">
              <Link href="/privacy" className="hover:text-white transition-colors">
                Privacy Policy
              </Link>
              <Link href="/terms" className="hover:text-white transition-colors">
                Terms of Service
              </Link>
              <Link href="/api" className="hover:text-white transition-colors">
                API
              </Link>
              <Link href="/contact" className="hover:text-white transition-colors">
                Contact
              </Link>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
