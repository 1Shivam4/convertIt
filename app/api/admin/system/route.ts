/**
 * app/api/admin/system/route.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Real-time diagnostic pings for Gotenberg, Redis, PostgreSQL, Sharp, and FFmpeg.
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/app/lib/admin-guard";
import { prisma } from "@/app/lib/prisma";
import { redisConnection } from "@/app/lib/redis";
import { exec } from "child_process";
import { promisify } from "util";
import os from "os";

const execAsync = promisify(exec);

export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (admin instanceof NextResponse) return admin;

  const results: any = {
    timestamp: new Date().toISOString(),
    system: {
      platform: os.platform(),
      arch: os.arch(),
      totalMemoryMB: Math.round(os.totalmem() / 1024 / 1024),
      freeMemoryMB: Math.round(os.freemem() / 1024 / 1024),
      uptimeHours: (os.uptime() / 3600).toFixed(1),
    },
    engines: {},
  };

  // ── 1. PostgreSQL DB Ping ────────────────────────────────────────────────
  const dbStart = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    results.engines.database = {
      status: "healthy",
      latencyMs: Date.now() - dbStart,
    };
  } catch (err: any) {
    results.engines.database = {
      status: "unhealthy",
      error: err.message,
    };
  }

  // ── 2. Redis Ping ────────────────────────────────────────────────────────
  const redisStart = Date.now();
  try {
    const pong = await redisConnection.ping();
    results.engines.redis = {
      status: pong === "PONG" ? "healthy" : "degraded",
      latencyMs: Date.now() - redisStart,
    };
  } catch (err: any) {
    results.engines.redis = {
      status: "unhealthy",
      error: err.message,
    };
  }

  // ── 3. Gotenberg Container Ping ──────────────────────────────────────────
  const gotenbergUrl = process.env.GOTENBERG_URL || "http://localhost:3000";
  const gotenbergStart = Date.now();
  try {
    const res = await fetch(`${gotenbergUrl}/health`, { signal: AbortSignal.timeout(2500) });
    const latency = Date.now() - gotenbergStart;
    results.engines.gotenberg = {
      status: res.ok ? "healthy" : "degraded",
      latencyMs: latency,
      url: gotenbergUrl,
    };
  } catch (err: any) {
    results.engines.gotenberg = {
      status: "unreachable",
      error: err.message,
      url: gotenbergUrl,
    };
  }

  // ── 4. FFmpeg Binary Check ───────────────────────────────────────────────
  try {
    const { stdout } = await execAsync("ffmpeg -version", { timeout: 3000 });
    const versionMatch = stdout.match(/ffmpeg version ([^\s]+)/);
    results.engines.ffmpeg = {
      status: "healthy",
      version: versionMatch ? versionMatch[1] : "detected",
    };
  } catch (err: any) {
    results.engines.ffmpeg = {
      status: "not_installed",
      message: "FFmpeg CLI binary not in PATH or ffmpeg-static fallback in use",
    };
  }

  // ── 5. Sharp (libvips) Check ─────────────────────────────────────────────
  try {
    const sharp = require("sharp");
    results.engines.sharp = {
      status: "healthy",
      versions: sharp.versions,
    };
  } catch (err: any) {
    results.engines.sharp = {
      status: "unhealthy",
      error: err.message,
    };
  }

  return NextResponse.json({ success: true, diagnostics: results });
}
