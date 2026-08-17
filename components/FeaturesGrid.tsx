import { ShieldCheck, Sliders, Zap } from "lucide-react";

export default function FeaturesGrid() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
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
  );
}
