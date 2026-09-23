/**
 * app/api/admin/tokens/route.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Token / Credit distribution manager and ledger.
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/app/lib/admin-guard";
import { prisma } from "@/app/lib/prisma";

export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (admin instanceof NextResponse) return admin;

  try {
    const [balances, recentTransactions] = await Promise.all([
      prisma.tokenBalance.findMany({
        take: 50,
        orderBy: { balance: "desc" },
        include: {
          user: {
            select: { id: true, name: true, email: true, plan: true },
          },
        },
      }),
      prisma.tokenTransaction.findMany({
        take: 50,
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            select: { name: true, email: true },
          },
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      balances,
      transactions: recentTransactions,
    });
  } catch (err: any) {
    console.error("[AdminTokens] Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (admin instanceof NextResponse) return admin;

  try {
    const { userId, amount, reason = "ADMIN_GRANT" } = await req.json();

    if (!userId || typeof amount !== "number" || amount === 0) {
      return NextResponse.json(
        { error: "Valid userId and non-zero amount number required" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Execute balance update and record transaction atomically
    const [updatedBalance, transaction] = await prisma.$transaction([
      prisma.tokenBalance.upsert({
        where: { userId },
        create: {
          userId,
          balance: Math.max(0, amount),
        },
        update: {
          balance: {
            increment: amount,
          },
        },
      }),
      prisma.tokenTransaction.create({
        data: {
          userId,
          amount,
          reason,
          grantedBy: admin.id,
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      balance: updatedBalance.balance,
      transaction,
    });
  } catch (err: any) {
    console.error("[AdminTokens] Grant error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
