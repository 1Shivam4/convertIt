import Link from "next/link";
import Image from "next/image";
import FileDropzone from "../../components/FileDropzone";
import { navbarItems } from "../utils/vars";
import {
  ChevronDown,
  RefreshCw,
  Volume2,
  Zap,
  ShieldCheck,
  Sliders,
  ArrowRight,
} from "lucide-react";
import Hero from "@/components/Hero";
import SupportConversions from "@/components/SupportConversions";
import FeaturesGrid from "@/components/FeaturesGrid";

export default function PublicPage() {
  return (
    <div className="relative min-h-screen bg-[#0b0d11] text-slate-100 overflow-hidden">
      {/* Background Decorative Grids and Radial Glows */}
      <div className="absolute inset-0 bg-grid-pattern opacity-30 pointer-events-none" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-tr from-red-600/10 via-red-500/5 to-transparent blur-3xl rounded-full pointer-events-none" />

      {/* Main Container */}
      <div className="max-w-7xl mx-auto flex flex-col gap-10">
        <Hero />
        {/* FILE DROPZONE CARD */}
        <FileDropzone />

        {/* SUPPORTED CONVERSION CATEGORIES (Server Rendered) */}
        <SupportConversions />

        {/* FEATURES HIGHLIGHT GRID (Server Rendered) */}
        <FeaturesGrid />
      </div>
    </div>
  );
}
