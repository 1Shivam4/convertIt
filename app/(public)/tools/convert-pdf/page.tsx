import { Metadata } from "next";
import { FileText } from "lucide-react";
import PDFConverterWorkspace from "@/components/PDFConverterWorkspace";

export const metadata: Metadata = {
  title: "Free PDF Converter & PDF Tools Online | ConvertIt",
  description:
    "Convert PDF to Word, Excel, PowerPoint, PNG, JPG, and more. Compress, merge, split, rotate, encrypt, and decrypt PDFs online for free. Powered by Gotenberg & pdf-lib.",
  keywords: [
    "PDF converter",
    "PDF to Word",
    "PDF to Excel",
    "PDF to PowerPoint",
    "compress PDF",
    "merge PDF",
    "split PDF",
    "rotate PDF",
    "encrypt PDF",
    "unlock PDF",
    "online PDF tools",
  ],
};

export default function ConvertPDFPage() {
  return (
    <div className="min-h-screen bg-[#0b0d11] text-white">
      {/* ── Static Hero Header ──────────────────────────────────── */}
      <div className="relative overflow-hidden border-b border-white/8">
        <div className="absolute inset-0 bg-gradient-to-br from-red-600/10 via-transparent to-rose-600/5 pointer-events-none" />
        <div className="max-w-4xl mx-auto px-6 py-14 text-center relative z-10">
          {/* Engine badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold mb-5">
            <FileText className="w-3.5 h-3.5" />
            Powered by Gotenberg &amp; pdf-lib
          </div>

          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white mb-3">
            PDF Converter &amp; Tools
          </h1>
          <p className="text-slate-400 text-base max-w-2xl mx-auto">
            Convert PDF to Word, Excel, PowerPoint, images, and more. Or use our
            PDF tools to compress, merge, split, rotate, encrypt &amp; unlock
            your documents — all in one place.
          </p>

          {/* Quick capability chips */}
          <div className="flex flex-wrap justify-center gap-2 mt-6">
            {[
              "→ DOCX",
              "→ XLSX",
              "→ PPTX",
              "→ PNG / JPG",
              "Compress",
              "Merge",
              "Split",
              "Rotate",
              "Encrypt",
              "Unlock",
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

      {/* ── Workspace ─────────────────────────────────────────────── */}
      <PDFConverterWorkspace />
    </div>
  );
}
