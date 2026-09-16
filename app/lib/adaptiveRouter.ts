/**
 * ConvertIt Smart Adaptive Conversion Router
 *
 * Implements the hybrid execution pattern:
 * - Fast-path (Synchronous): For files <= 15MB and lightweight transforms (instant binary stream in <2s).
 * - Heavy-path (BullMQ Asynchronous): For files > 15MB, heavy video/audio transcoding, or batch tasks.
 */

export const SYNC_MAX_BYTES = 15 * 1024 * 1024; // 15 Megabytes

// Media formats that inherently require significant CPU / time (FFmpeg)
export const HEAVY_MEDIA_FORMATS = new Set([
  "mp4",
  "mkv",
  "avi",
  "mov",
  "webm",
  "flv",
  "wmv",
  "mp3",
  "wav",
  "aac",
  "ogg",
  "flac",
  "m4a",
  "wma",
]);

// Large document / complex engine formats
export const HEAVY_DOCUMENT_FORMATS = new Set([
  "pdfa",
]);

export type SupportedEngine =
  | "gotenberg"
  | "sharp"
  | "ffmpeg"
  | "pdf-lib"
  | "qpdf";

/**
 * Resolves which transformation engine processes the given target format or operation.
 */
export function resolveEngine(formatId: string): SupportedEngine {
  const normalized = formatId.toLowerCase();

  // Media / Audio / Video -> FFmpeg
  if (HEAVY_MEDIA_FORMATS.has(normalized)) {
    return "ffmpeg";
  }

  // Pure image transforms -> Sharp
  if (["png", "jpeg", "jpg", "webp", "avif", "tiff", "gif", "bmp", "svg"].includes(normalized)) {
    return "sharp";
  }

  // Native lightweight PDF manipulations -> PDF-Lib / QPDF
  if (["rotate", "split", "watermark", "flatten"].includes(normalized)) {
    return "pdf-lib";
  }
  if (["encrypt", "decrypt"].includes(normalized)) {
    return "qpdf";
  }

  // Default office documents & LibreOffice -> Gotenberg
  return "gotenberg";
}

/**
 * Determines whether a specific operation is computationally heavy
 * and should bypass synchronous HTTP streaming regardless of file size.
 */
export function isHeavyOperation(
  formatId: string,
  options?: Record<string, any>
): boolean {
  const normalized = formatId.toLowerCase();

  // Video transcoding is always heavy
  if (HEAVY_MEDIA_FORMATS.has(normalized)) {
    return true;
  }

  // High-complexity document conversions
  if (HEAVY_DOCUMENT_FORMATS.has(normalized)) {
    return true;
  }

  // Multi-page batch operations
  if (options?.isBatch === true || (options?.pageCount && options.pageCount > 50)) {
    return true;
  }

  return false;
}

/**
 * Evaluates whether an incoming conversion request should be offloaded
 * to BullMQ background workers or processed synchronously.
 */
export function shouldOffloadToWorker(
  fileSizeBytes: number,
  formatId: string,
  options?: Record<string, any>
): boolean {
  // 1. If explicit async mode requested (e.g. by API client)
  if (options?.forceAsync === true) {
    return true;
  }

  // 2. Heavy operations always offload to worker
  if (isHeavyOperation(formatId, options)) {
    return true;
  }

  // 3. Payload size exceeds synchronous streaming threshold
  if (fileSizeBytes > SYNC_MAX_BYTES) {
    return true;
  }

  // Fast-path eligible
  return false;
}
