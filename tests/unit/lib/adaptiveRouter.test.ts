import { describe, it, expect } from "vitest";
import {
  shouldOffloadToWorker,
  isHeavyOperation,
  resolveEngine,
  SYNC_MAX_BYTES,
} from "@/app/lib/adaptiveRouter";

describe("Adaptive Conversion Router", () => {
  it("resolves engines correctly for various format types", () => {
    expect(resolveEngine("mp4")).toBe("ffmpeg");
    expect(resolveEngine("mp3")).toBe("ffmpeg");
    expect(resolveEngine("png")).toBe("sharp");
    expect(resolveEngine("webp")).toBe("sharp");
    expect(resolveEngine("rotate")).toBe("pdf-lib");
    expect(resolveEngine("split")).toBe("pdf-lib");
    expect(resolveEngine("encrypt")).toBe("qpdf");
    expect(resolveEngine("docx")).toBe("gotenberg");
    expect(resolveEngine("xlsx")).toBe("gotenberg");
  });

  it("identifies heavy operations accurately", () => {
    expect(isHeavyOperation("mp4")).toBe(true);
    expect(isHeavyOperation("avi")).toBe(true);
    expect(isHeavyOperation("pdfa")).toBe(true);
    expect(isHeavyOperation("png")).toBe(false);
    expect(isHeavyOperation("docx")).toBe(false);
    expect(isHeavyOperation("docx", { isBatch: true })).toBe(true);
    expect(isHeavyOperation("docx", { pageCount: 100 })).toBe(true);
  });

  it("routes small lightweight files to synchronous fast-path", () => {
    const smallPdfSize = 2 * 1024 * 1024; // 2MB
    const smallPngSize = 500 * 1024; // 500KB

    expect(shouldOffloadToWorker(smallPdfSize, "docx")).toBe(false);
    expect(shouldOffloadToWorker(smallPngSize, "webp")).toBe(false);
    expect(shouldOffloadToWorker(smallPdfSize, "rotate")).toBe(false);
  });

  it("routes large files (>15MB) to BullMQ worker queue", () => {
    const largeFileSize = 20 * 1024 * 1024; // 20MB
    expect(shouldOffloadToWorker(largeFileSize, "docx")).toBe(true);
    expect(shouldOffloadToWorker(largeFileSize, "png")).toBe(true);
  });

  it("routes heavy operations to BullMQ regardless of small file size", () => {
    const tinyVideoSize = 1 * 1024 * 1024; // 1MB video
    expect(shouldOffloadToWorker(tinyVideoSize, "mp4")).toBe(true);
    expect(shouldOffloadToWorker(tinyVideoSize, "webm")).toBe(true);
  });

  it("honors forceAsync option flag", () => {
    const tinyFileSize = 100 * 1024; // 100KB
    expect(shouldOffloadToWorker(tinyFileSize, "png", { forceAsync: true })).toBe(true);
  });
});
