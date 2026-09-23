/**
 * app/api/admin/metrics/route.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Aggregate metrics & KPIs for the Admin Overview Hub.
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/app/lib/admin-guard";
import { prisma } from "@/app/lib/prisma";
import { conversionQueue } from "@/app/lib/queue";
import { redisConnection } from "@/app/lib/redis";

export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (admin instanceof NextResponse) return admin;

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // ── 1. Users metrics ───────────────────────────────────────────────────
    const [
      totalUsers,
      newUsersToday,
      freeUsers,
      standardUsers,
      proUsers,
      bannedUsers,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { createdAt: { gte: today } } }),
      prisma.user.count({ where: { plan: "FREE" } }),
      prisma.user.count({ where: { plan: "STANDARD" } }),
      prisma.user.count({ where: { plan: "PRO" } }),
      prisma.user.count({ where: { banned: true } }),
    ]);

    // ── 2. Conversion jobs metrics ──────────────────────────────────────────
    const [
      totalJobs,
      completedJobs,
      failedJobs,
      queuedJobs,
      processingJobs,
      jobsToday,
    ] = await Promise.all([
      prisma.job.count(),
      prisma.job.count({ where: { status: "COMPLETED" } }),
      prisma.job.count({ where: { status: "FAILED" } }),
      prisma.job.count({ where: { status: "QUEUED" } }),
      prisma.job.count({ where: { status: "PROCESSING" } }),
      prisma.job.count({ where: { createdAt: { gte: today } } }),
    ]);

    const successRate =
      totalJobs > 0
        ? Math.round((completedJobs / (completedJobs + failedJobs || 1)) * 100)
        : 100;

    // ── 3. BullMQ Queue metrics ─────────────────────────────────────────────
    let queueStats: Record<string, number> = { waiting: 0, active: 0, completed: 0, failed: 0, delayed: 0 };
    try {
      const counts = await conversionQueue.getJobCounts(
        "waiting",
        "active",
        "completed",
        "failed",
        "delayed"
      );
      queueStats = counts;
    } catch {
      /* ignore if queue offline */
    }

    // ── 4. Engine ping statuses ─────────────────────────────────────────────
    let redisConnected = false;
    try {
      redisConnected = redisConnection.status === "ready" || redisConnection.status === "connect";
    } catch {
      redisConnected = false;
    }

    let gotenbergAlive = false;
    try {
      const gotenbergUrl = process.env.GOTENBERG_URL || "http://localhost:3000";
      const res = await fetch(`${gotenbergUrl}/health`, { signal: AbortSignal.timeout(2000) });
      gotenbergAlive = res.ok;
    } catch {
      gotenbergAlive = false;
    }

    return NextResponse.json({
      success: true,
      users: {
        total: totalUsers,
        today: newUsersToday,
        byPlan: {
          FREE: freeUsers,
          STANDARD: standardUsers,
          PRO: proUsers,
        },
        banned: bannedUsers,
      },
      jobs: {
        total: totalJobs,
        today: jobsToday,
        completed: completedJobs,
        failed: failedJobs,
        queued: queuedJobs,
        processing: processingJobs,
        successRate,
      },
      queues: queueStats,
      engines: {
        database: true,
        redis: redisConnected,
        gotenberg: gotenbergAlive,
      },
    });
  } catch (err: any) {
    console.error("[AdminMetrics] Error aggregating metrics:", err);
    return NextResponse.json(
      { error: "Failed to aggregate metrics: " + err.message },
      { status: 500 }
    );
  }
}
