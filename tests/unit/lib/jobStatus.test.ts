import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "@/app/api/jobs/[id]/status/route";
import { NextRequest } from "next/server";

vi.mock("@/app/lib/prisma", () => ({
  prisma: {
    job: {
      findUnique: vi.fn(),
    },
  },
}));

vi.mock("@/app/lib/s3", () => ({
  getPresignedDownloadUrl: vi.fn().mockResolvedValue("https://s3.example.com/download/file.pdf"),
}));

import { prisma } from "@/app/lib/prisma";

describe("Job Status API Route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 404 when job does not exist", async () => {
    (prisma.job.findUnique as any).mockResolvedValue(null);

    const req = new NextRequest("http://localhost:3000/api/jobs/job-123/status");
    const params = Promise.resolve({ id: "job-123" });

    const res = await GET(req, { params });
    expect(res.status).toBe(404);

    const json = await res.json();
    expect(json.error).toBe("Job not found");
  });

  it("returns status for QUEUED job", async () => {
    (prisma.job.findUnique as any).mockResolvedValue({
      id: "job-queued",
      status: "QUEUED",
      targetFormat: "docx",
      files: [],
      conversions: [],
    });

    const req = new NextRequest("http://localhost:3000/api/jobs/job-queued/status");
    const params = Promise.resolve({ id: "job-queued" });

    const res = await GET(req, { params });
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.status).toBe("QUEUED");
    expect(json.progress).toBe(20);
  });

  it("returns status for PROCESSING job", async () => {
    (prisma.job.findUnique as any).mockResolvedValue({
      id: "job-proc",
      status: "PROCESSING",
      targetFormat: "mp4",
      files: [],
      conversions: [],
    });

    const req = new NextRequest("http://localhost:3000/api/jobs/job-proc/status");
    const params = Promise.resolve({ id: "job-proc" });

    const res = await GET(req, { params });
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.status).toBe("PROCESSING");
    expect(json.progress).toBe(65);
  });

  it("returns signed downloadUrl for COMPLETED job", async () => {
    (prisma.job.findUnique as any).mockResolvedValue({
      id: "job-done",
      status: "COMPLETED",
      targetFormat: "pdf",
      files: [
        { path: "outputs/job-done/converted.pdf", size: 1024, mimeType: "application/pdf" },
      ],
      conversions: [],
    });

    const req = new NextRequest("http://localhost:3000/api/jobs/job-done/status");
    const params = Promise.resolve({ id: "job-done" });

    const res = await GET(req, { params });
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.status).toBe("COMPLETED");
    expect(json.progress).toBe(100);
    expect(json.downloadUrl).toBe("https://s3.example.com/download/file.pdf");
  });

  it("returns error message for FAILED job", async () => {
    (prisma.job.findUnique as any).mockResolvedValue({
      id: "job-fail",
      status: "FAILED",
      targetFormat: "docx",
      files: [],
      conversions: [
        { error: "Gotenberg engine timeout" },
      ],
    });

    const req = new NextRequest("http://localhost:3000/api/jobs/job-fail/status");
    const params = Promise.resolve({ id: "job-fail" });

    const res = await GET(req, { params });
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.status).toBe("FAILED");
    expect(json.error).toBe("Gotenberg engine timeout");
  });
});
