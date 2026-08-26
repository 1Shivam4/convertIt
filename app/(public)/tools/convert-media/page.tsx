import { Metadata } from "next";
import MediaToConvertor from "@/components/MediaToConvertor";

export const metadata: Metadata = {
  title: "Free Video & Audio Converter Online | ConvertIt",
  description:
    "Convert, trim, compress, and extract audio from MP4, WEBM, MOV, AVI, MKV, MP3, WAV, AAC, FLAC, and OGG files online for free. Powered by FFmpeg.",
  keywords: [
    "video converter",
    "audio converter",
    "convert MP4 to WEBM",
    "convert video to MP3",
    "extract audio from video",
    "compress video online",
    "trim video online",
    "FFmpeg online converter",
  ],
};

export default function ConvertMediaPage() {
  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-base-100 via-base-200/40 to-base-100">
      <div className="max-w-7xl mx-auto space-y-10">
        <MediaToConvertor />
      </div>
    </div>
  );
}
