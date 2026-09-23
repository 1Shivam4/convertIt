/**
 * app/api/admin/users/route.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * User directory listing (paginated, filtered) & Direct User Creation.
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/app/lib/admin-guard";
import { prisma } from "@/app/lib/prisma";
import { scryptSync, randomBytes } from "crypto";

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${hash}:${salt}`;
}

export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (admin instanceof NextResponse) return admin;

  const url = new URL(req.url);
  const search = url.searchParams.get("search")?.trim() || "";
  const plan = url.searchParams.get("plan") || "";
  const role = url.searchParams.get("role") || "";
  const status = url.searchParams.get("status") || "";
  const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get("limit") || "10", 10)));
  const skip = (page - 1) * limit;

  const where: any = {};

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
      { id: { contains: search, mode: "insensitive" } },
    ];
  }

  if (plan) {
    where.plan = plan;
  }

  if (role) {
    where.role = role;
  }

  if (status === "banned") {
    where.banned = true;
  } else if (status === "active") {
    where.banned = false;
  }

  try {
    const [total, users] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          plan: true,
          banned: true,
          createdAt: true,
          tokenBalance: { select: { balance: true } },
          _count: {
            select: {
              jobs: true,
              apiKeys: true,
            },
          },
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      users: users.map((u) => ({
        ...u,
        tokenBalance: u.tokenBalance?.balance ?? 0,
        jobCount: u._count.jobs,
        apiKeyCount: u._count.apiKeys,
      })),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err: any) {
    console.error("[AdminUsers] Query error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (admin instanceof NextResponse) return admin;

  try {
    const body = await req.json();
    const { name, email, password, plan = "FREE", role = "USER", initialTokens = 0 } = body;

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: "Name, email, and password are required" },
        { status: 400 }
      );
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "A user with this email address already exists" },
        { status: 409 }
      );
    }

    const userId = `usr_${Date.now()}_${randomBytes(4).toString("hex")}`;
    const passwordHash = hashPassword(password);
    const now = new Date();

    const [newUser] = await prisma.$transaction([
      prisma.user.create({
        data: {
          id: userId,
          email,
          name,
          emailVerified: true,
          plan,
          role,
          createdAt: now,
          updatedAt: now,
          tokenBalance: initialTokens > 0 ? { create: { balance: initialTokens } } : undefined,
        },
      }),
      prisma.account.create({
        data: {
          id: `acc_${userId}`,
          accountId: userId,
          providerId: "credential",
          userId,
          password: passwordHash,
          createdAt: now,
          updatedAt: now,
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        plan: newUser.plan,
        role: newUser.role,
      },
    });
  } catch (err: any) {
    console.error("[AdminUsers] Direct creation error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
