import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";
import { getPresignedDownloadUrl } from "@/app/lib/s3";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const jobId = searchParams.get("jobId");

    if (!jobId) {
      return NextResponse.json(
        { error: "jobId parameter is required" },
        { status: 400 },
      );
    }

    // Identify user
    let userId: string | null = null;
    const authHeader = req.headers.get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
      const apiKeyVal = authHeader.substring(7).trim();
      const keyRecord = await prisma.apiKey.findUnique({
        where: { key: apiKeyVal },
      });
      if (keyRecord) userId = keyRecord.userId;
    }

    if (!userId) {
      const reqHeaders = await headers();
      const session = await auth.api.getSession({ headers: reqHeaders });
      if (session?.user?.id) userId = session.user.id;
    }

    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: {
        files: true,
        conversions: true,
      },
    });

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    // Optional owner check
    if (userId && job.userId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    let downloadUrl: string | null = null;
    const outputFile = job.files.find((f) => f.path.startsWith("outputs/"));

    if (job.status === "COMPLETED" && outputFile) {
      downloadUrl = await getPresignedDownloadUrl({
        key: outputFile.path,
        expiresInSeconds: 3600,
        downloadName: `converted.${job.targetFormat}`,
      });
    }

    return NextResponse.json({
      jobId: job.id,
      status: job.status,
      sourceFormat: job.sourceFormat,
      targetFormat: job.targetFormat,
      createdAt: job.createdAt,
      updatedAt: job.updatedAt,
      error: job.conversions[0]?.error || null,
      downloadUrl,
    });
  } catch (err: any) {
    console.error("Job status query error:", err);
    return NextResponse.json(
      { error: `Failed to fetch job status: ${err?.message || err}` },
      { status: 500 },
    );
  }
}
