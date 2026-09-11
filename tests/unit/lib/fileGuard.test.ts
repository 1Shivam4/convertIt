import { describe, it, expect } from "vitest";
import { guardFileSize, guardFileSizeBatch } from "@/app/lib/file-guard";

function createMockRequest(planHeader?: string) {
  const headers = new Headers();
  if (planHeader) headers.set("x-user-plan", planHeader);
  return { headers } as any;
}

describe("file-guard module", () => {
  it("allows file within GUEST limit (5MB <= 10MB)", () => {
    const req = createMockRequest("GUEST");
    const result = guardFileSize(req, 5 * 1024 * 1024);
    expect(result.allowed).toBe(true);
  });

  it("rejects file exceeding GUEST limit (15MB > 10MB) with 413", () => {
    const req = createMockRequest("GUEST");
    const result = guardFileSize(req, 15 * 1024 * 1024);
    expect(result.allowed).toBe(false);
    if (!result.allowed) {
      expect(result.status).toBe(413);
      expect(result.error).toContain("exceeds your Guest plan limit");
    }
  });

  it("allows file up to FREE limit (35MB <= 40MB)", () => {
    const req = createMockRequest("FREE");
    const result = guardFileSize(req, 35 * 1024 * 1024);
    expect(result.allowed).toBe(true);
  });

  it("allows larger files for STANDARD (150MB <= 200MB)", () => {
    const req = createMockRequest("STANDARD");
    const result = guardFileSize(req, 150 * 1024 * 1024);
    expect(result.allowed).toBe(true);
  });

  it("guardFileSizeBatch rejects if any file in batch exceeds limit", () => {
    const req = createMockRequest("FREE"); // 40MB limit
    const smallFile = { size: 10 * 1024 * 1024 } as File;
    const largeFile = { size: 50 * 1024 * 1024 } as File;

    const result = guardFileSizeBatch(req, [smallFile, largeFile]);
    expect(result.allowed).toBe(false);
  });
});
