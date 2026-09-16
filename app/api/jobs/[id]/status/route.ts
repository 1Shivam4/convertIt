import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { getPresignedDownloadUrl } from "@/app/lib/s3";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "Job ID required" }, { status: 400 });
    }

    const job = await prisma.job.findUnique({
      where: { id },
      include: {
        files: true,
        conversions: true,
      },
    });

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    if (job.status === "COMPLETED") {
      const outputFile = job.files.find((f) => f.path.startsWith("outputs/"));
      let downloadUrl = `/api/jobs/${id}/download`;

      if (outputFile) {
        try {
          downloadUrl = await getPresignedDownloadUrl({
            key: outputFile.path,
            downloadName: `converted_${id}.${job.targetFormat}`,
          });
        } catch {
          // Fall back to server download stream endpoint
          downloadUrl = `/api/jobs/${id}/download`;
        }
      }

      return NextResponse.json({
        id: job.id,
        status: "COMPLETED",
        progress: 100,
        targetFormat: job.targetFormat,
        downloadUrl,
      });
    }

    if (job.status === "PROCESSING") {
      return NextResponse.json({
        id: job.id,
        status: "PROCESSING",
        progress: 65,
        targetFormat: job.targetFormat,
      });
    }

    if (job.status === "FAILED") {
      const lastConversion = job.conversions[job.conversions.length - 1];
      return NextResponse.json({
        id: job.id,
        status: "FAILED",
        progress: 0,
        error: lastConversion?.error || "Conversion failed in background engine",
      });
    }

    // Default QUEUED
    return NextResponse.json({
      id: job.id,
      status: "QUEUED",
      progress: 20,
      targetFormat: job.targetFormat,
    });
  } catch (err: any) {
    console.error("[JobStatus API] Error:", err);
    return NextResponse.json(
      { error: "Internal server error fetching job status" },
      { status: 500 }
    );
  }
}
