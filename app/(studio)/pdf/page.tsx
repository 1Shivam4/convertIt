import { Metadata } from "next";
import { Suspense } from "react";
import PDFStudio from "@/components/studios/PDFStudio";

export const metadata: Metadata = {
  title: "Document & PDF Studio — Online Converter & PDF Tools | ConvertIt",
  description:
    "Professional online Document & PDF Studio. Convert PDF to Word (DOCX), Excel (XLSX), PowerPoint (PPTX), PNG, JPG, HTML, and Markdown. Compress, merge, split, rotate, watermark, and secure documents.",
  keywords: [
    "PDF converter",
    "PDF studio",
    "PDF to Word",
    "PDF to Excel",
    "compress PDF",
    "merge PDF",
    "split PDF",
    "rotate PDF",
    "online PDF tools",
  ],
};

export default function PDFStudioPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full h-full flex items-center justify-center bg-[#0b0d11] text-slate-400">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 rounded-full border-2 border-red-500 border-t-transparent animate-spin" />
            <p className="text-xs font-mono">Loading PDF Studio...</p>
          </div>
        </div>
      }
    >
      <PDFStudio />
    </Suspense>
  );
}
