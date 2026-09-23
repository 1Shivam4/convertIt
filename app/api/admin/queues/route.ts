/**
 * app/api/admin/queues/route.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * BullMQ queue inspection and control actions (pause, resume, clean).
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/app/lib/admin-guard";
import { conversionQueue } from "@/app/lib/queue";

export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (admin instanceof NextResponse) return admin;

  try {
    const isPaused = await conversionQueue.isPaused();
    const counts = await conversionQueue.getJobCounts(
      "waiting",
      "active",
      "completed",
      "failed",
      "delayed"
    );

    const [waitingJobs, activeJobs, failedJobs] = await Promise.all([
      conversionQueue.getWaiting(0, 10),
      conversionQueue.getActive(0, 10),
      conversionQueue.getFailed(0, 10),
    ]);

    return NextResponse.json({
      success: true,
      isPaused,
      counts,
      jobs: {
        waiting: waitingJobs.map((j) => ({ id: j.id, name: j.name, data: j.data, timestamp: j.timestamp })),
        active: activeJobs.map((j) => ({ id: j.id, name: j.name, data: j.data, timestamp: j.timestamp })),
        failed: failedJobs.map((j) => ({
          id: j.id,
          name: j.name,
          data: j.data,
          failedReason: j.failedReason,
          stacktrace: j.stacktrace,
          timestamp: j.timestamp,
        })),
      },
    });
  } catch (err: any) {
    console.error("[AdminQueues] Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (admin instanceof NextResponse) return admin;

  try {
    const { action } = await req.json();

    if (action === "pause") {
      await conversionQueue.pause();
      return NextResponse.json({ success: true, message: "Queue paused" });
    } else if (action === "resume") {
      await conversionQueue.resume();
      return NextResponse.json({ success: true, message: "Queue resumed" });
    } else if (action === "clean_failed") {
      await conversionQueue.clean(0, 1000, "failed");
      return NextResponse.json({ success: true, message: "Cleaned failed jobs from queue" });
    } else if (action === "retry_all_failed") {
      const failedJobs = await conversionQueue.getFailed(0, 50);
      for (const job of failedJobs) {
        await job.retry();
      }
      return NextResponse.json({
        success: true,
        message: `Retried ${failedJobs.length} failed jobs`,
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err: any) {
    console.error("[AdminQueues] Action error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
