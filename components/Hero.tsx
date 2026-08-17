import { ChevronDown, RefreshCw, Volume2, Zap } from "lucide-react";

export default function Hero() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
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
  );
}
