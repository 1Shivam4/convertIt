/**
 * app/api/admin/users/[id]/route.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * User detail query, Plan modification, Role change, Ban/Unban, and User deletion.
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/app/lib/admin-guard";
import { prisma } from "@/app/lib/prisma";
import { invalidateUserPlanCache } from "@/app/lib/resolve-plan";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin(req);
  if (admin instanceof NextResponse) return admin;

  const { id } = await params;

  try {
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        tokenBalance: true,
        apiKeys: {
          select: { id: true, label: true, key: true, lastUsedAt: true, createdAt: true },
        },
        jobs: {
          take: 10,
          orderBy: { createdAt: "desc" },
          include: { conversions: true, files: true },
        },
        _count: { select: { jobs: true, apiKeys: true, sessions: true } },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, user });
  } catch (err: any) {
    console.error("[AdminUserDetail] Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin(req);
  if (admin instanceof NextResponse) return admin;

  const { id } = await params;

  try {
    const body = await req.json();
    const { plan, role, banned } = body;

    const updateData: any = {};
    if (plan !== undefined) updateData.plan = plan;
    if (role !== undefined) updateData.role = role;
    if (banned !== undefined) updateData.banned = banned;

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
    });

    // Invalidate Redis plan cache so user changes apply immediately
    await invalidateUserPlanCache(id);

    // If user was banned, delete all active sessions immediately
    if (banned === true) {
      await prisma.session.deleteMany({ where: { userId: id } });
    }

    return NextResponse.json({
      success: true,
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        plan: updatedUser.plan,
        role: updatedUser.role,
        banned: updatedUser.banned,
      },
    });
  } catch (err: any) {
    console.error("[AdminUserPatch] Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin(req);
  if (admin instanceof NextResponse) return admin;

  const { id } = await params;

  // Prevent admin from deleting themselves
  if (admin.id === id) {
    return NextResponse.json(
      { error: "You cannot delete your own administrative account" },
      { status: 400 }
    );
  }

  try {
    await prisma.user.delete({ where: { id } });
    await invalidateUserPlanCache(id);

    return NextResponse.json({ success: true, message: "User deleted successfully" });
  } catch (err: any) {
    console.error("[AdminUserDelete] Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
