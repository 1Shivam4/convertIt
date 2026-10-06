/**
 * app/lib/file/image-format-guards.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Single source of truth for supported vs unsupported image formats and
 * human-friendly, precise error categorization.
 */

export const SUPPORTED_IMAGE_EXTS = [
  "jpg",
  "jpeg",
  "png",
  "webp",
  "avif",
  "gif",
  "tiff",
  "bmp",
  "ico",
  "svg",
  "heic",
  "heif",
] as const;

export const UNSUPPORTED_IMAGE_EXTS = [
  "raw",
  "dng",
  "cr2",
  "cr3",
  "nef",
  "arw",
  "orf",
  "rw2",
  "pef",
  "srw",
  "psd",
  "psb",
  "ai",
  "eps",
  "hdr",
  "exr",
  "jxl",
  "tga",
  "pcx",
  "ppm",
  "pgm",
  "pbm",
  "xcf",
  "cur",
] as const;

export function isSupportedImageFile(file: File | { name: string; type?: string }): boolean {
  const ext = file.name.split(".").pop()?.toLowerCase() || "";
  const mime = file.type?.toLowerCase() || "";
  return (
    mime.startsWith("image/") ||
    SUPPORTED_IMAGE_EXTS.includes(ext as any)
  );
}

export function isKnownImageFile(file: File | { name: string; type?: string }): boolean {
  const ext = file.name.split(".").pop()?.toLowerCase() || "";
  const mime = file.type?.toLowerCase() || "";
  return (
    mime.startsWith("image/") ||
    SUPPORTED_IMAGE_EXTS.includes(ext as any) ||
    UNSUPPORTED_IMAGE_EXTS.includes(ext as any)
  );
}

export interface ImageValidationResult {
  allowed: boolean;
  message?: string;
  unsupportedImageCount: number;
  nonImageCount: number;
}

export function validateImageBatch(files: File[]): ImageValidationResult {
  const unsupportedImages: File[] = [];
  const nonImages: File[] = [];

  for (const f of files) {
    const ext = f.name.split(".").pop()?.toLowerCase() || "";
    if (SUPPORTED_IMAGE_EXTS.includes(ext as any)) {
      continue;
    }
    if (UNSUPPORTED_IMAGE_EXTS.includes(ext as any)) {
      unsupportedImages.push(f);
      continue;
    }
    // Check MIME type as fallback
    if (f.type && f.type.startsWith("image/")) {
      continue;
    }
    nonImages.push(f);
  }

  if (unsupportedImages.length === 0 && nonImages.length === 0) {
    return {
      allowed: true,
      unsupportedImageCount: 0,
      nonImageCount: 0,
    };
  }

  // 1. If unsupported image formats are detected (e.g. .PSD, .RAW, .DNG)
  if (unsupportedImages.length > 0 && nonImages.length === 0) {
    const extList = Array.from(
      new Set(unsupportedImages.map((f) => `.${f.name.split(".").pop()?.toUpperCase()}`))
    ).join(", ");
    const sampleNames = unsupportedImages.slice(0, 2).map((f) => `"${f.name}"`).join(", ");
    const more = unsupportedImages.length > 2 ? ` (+${unsupportedImages.length - 2} more)` : "";
    return {
      allowed: false,
      unsupportedImageCount: unsupportedImages.length,
      nonImageCount: 0,
      message: `Unsupported image format (${extList}): ${sampleNames}${more}. ConvertIt currently supports JPG, PNG, WebP, AVIF, HEIC, GIF, TIFF, BMP, ICO, and SVG. Camera RAW and layered design formats are not supported in this synchronous studio.`,
    };
  }

  // 2. If completely non-image files are detected (e.g. .PDF, .MP4, .DOCX)
  if (nonImages.length > 0 && unsupportedImages.length === 0) {
    const extList = Array.from(
      new Set(
        nonImages.map((f) => {
          const ext = f.name.split(".").pop()?.toUpperCase();
          return ext ? `.${ext}` : f.type || "UNKNOWN";
        })
      )
    ).join(", ");
    const sampleNames = nonImages.slice(0, 2).map((f) => `"${f.name}"`).join(", ");
    const more = nonImages.length > 2 ? ` (+${nonImages.length - 2} more)` : "";
    return {
      allowed: false,
      unsupportedImageCount: 0,
      nonImageCount: nonImages.length,
      message: `Non-image file(s) detected (${extList}): ${sampleNames}${more}. Only image files are allowed in this studio.`,
    };
  }

  // 3. Both unsupported images and non-images
  const unsuppExts = Array.from(
    new Set(unsupportedImages.map((f) => `.${f.name.split(".").pop()?.toUpperCase()}`))
  ).join(", ");
  const nonExts = Array.from(
    new Set(nonImages.map((f) => `.${f.name.split(".").pop()?.toUpperCase()}`))
  ).join(", ");

  return {
    allowed: false,
    unsupportedImageCount: unsupportedImages.length,
    nonImageCount: nonImages.length,
    message: `Invalid files in upload: Unsupported images (${unsuppExts}) and non-image files (${nonExts}). Supported image formats: JPG, PNG, WebP, AVIF, HEIC, GIF, TIFF, BMP, ICO, SVG.`,
  };
}
