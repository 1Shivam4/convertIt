/**
 * app/api/admin/jobs/route.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * All platform conversion jobs listing with filtering & engine error inspection.
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/app/lib/admin-guard";
import { prisma } from "@/app/lib/prisma";

export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (admin instanceof NextResponse) return admin;

  const url = new URL(req.url);
  const status = url.searchParams.get("status") || "";
  const search = url.searchParams.get("search")?.trim() || "";
  const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get("limit") || "15", 10)));
  const skip = (page - 1) * limit;

  const where: any = {};

  if (status) {
    where.status = status;
  }

  if (search) {
    where.OR = [
      { id: { contains: search, mode: "insensitive" } },
      { sourceFormat: { contains: search, mode: "insensitive" } },
      { targetFormat: { contains: search, mode: "insensitive" } },
      { user: { email: { contains: search, mode: "insensitive" } } },
    ];
  }

  try {
    const [total, jobs] = await Promise.all([
      prisma.job.count({ where }),
      prisma.job.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            select: { id: true, name: true, email: true, plan: true },
          },
          files: true,
          conversions: true,
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      jobs,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err: any) {
    console.error("[AdminJobs] Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
