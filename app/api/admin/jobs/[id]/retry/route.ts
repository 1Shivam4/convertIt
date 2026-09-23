/**
 * app/api/admin/jobs/[id]/retry/route.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Retry a failed conversion job via BullMQ.
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/app/lib/admin-guard";
import { prisma } from "@/app/lib/prisma";
import { conversionQueue } from "@/app/lib/queue";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin(req);
  if (admin instanceof NextResponse) return admin;

  const { id } = await params;

  try {
    const jobRecord = await prisma.job.findUnique({
      where: { id },
      include: { files: true },
    });

    if (!jobRecord) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    // Reset status in DB to QUEUED
    await prisma.job.update({
      where: { id },
      data: { status: "QUEUED" },
    });

    // Re-enqueue into BullMQ
    await conversionQueue.add(
      "process-conversion",
      {
        jobId: jobRecord.id,
        sourceFormat: jobRecord.sourceFormat,
        targetFormat: jobRecord.targetFormat,
        filePath: jobRecord.files[0]?.path,
      },
      {
        jobId: `retry_${jobRecord.id}_${Date.now()}`,
      }
    );

    return NextResponse.json({
      success: true,
      message: `Job ${id} re-enqueued for processing`,
    });
  } catch (err: any) {
    console.error("[AdminJobRetry] Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
