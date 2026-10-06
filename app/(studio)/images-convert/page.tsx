import { Metadata } from "next";
import ImagesConvertStudio from "@/components/studios/ImagesConvertStudio";

export const metadata: Metadata = {
  title: "Image Converter Studio — Batch Convert & Optimize Images | ConvertIt",
  description:
    "Fast, secure batch image converter. Convert JPG, PNG, WebP, AVIF, GIF, TIFF, BMP with quality tuning, resizing, and EXIF privacy stripping.",
  keywords: [
    "image converter",
    "batch image converter",
    "JPG to PNG",
    "PNG to WebP",
    "AVIF converter",
    "compress image",
  ],
};

export default function ImagesConvertPage() {
  return <ImagesConvertStudio />;
}
