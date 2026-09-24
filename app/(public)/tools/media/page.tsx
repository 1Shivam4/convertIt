import { Metadata } from "next";
import { Video } from "lucide-react";
import MediaStudio from "@/components/studios/MediaStudio";

export const metadata: Metadata = {
  title: "Audio & Video Studio — Free Media Transcoder & Audio Extractor | ConvertIt",
  description:
    "Convert MP4, WebM, MOV, AVI, MKV, and animated GIF video files. Extract studio-quality MP3, WAV, AAC, FLAC, and OGG audio with live SSE progress streaming and time trimming.",
  keywords: [
    "video converter",
    "video to MP3",
    "MP4 to WebM",
    "MOV to MP4",
    "extract audio from video",
    "compress video",
    "audio converter",
    "WAV to MP3",
    "media studio",
  ],
};

export default function MediaStudioPage() {
  return (
    <div className="min-h-screen bg-[#0b0d11] text-white">
      {/* ── Studio Hero Header ────────────────────────────────────── */}
      <div className="relative overflow-hidden border-b border-white/8">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 via-transparent to-pink-600/5 pointer-events-none" />
        <div className="max-w-4xl mx-auto px-6 py-14 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-semibold mb-5">
            <Video className="w-3.5 h-3.5" />
            Audio &amp; Video Studio · Powered by FFmpeg
          </div>

          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white mb-3">
            Audio &amp; Video Studio
          </h1>
          <p className="text-slate-400 text-base max-w-xl mx-auto">
            High-speed video transcoding, audio extraction, resolution scaling, and timeline clipping
            streamed in real-time.
          </p>

          {/* Feature Chips */}
          <div className="flex flex-wrap justify-center gap-2 mt-6">
            {[
              "MP4 (H.264)",
              "WebM (VP9)",
              "Extract MP3 & WAV",
              "Lossless FLAC",
              "Animated GIF Maker",
              "Timeline Trimmer",
              "1080p / 720p Scaling",
              "Real-time SSE Streaming",
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

      {/* ── Media Studio Workspace ────────────────────────────────── */}
      <MediaStudio />
    </div>
  );
}
