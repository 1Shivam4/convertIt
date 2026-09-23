/**
 * app/api/admin/invitations/route.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * User invitations list & invite creation.
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/app/lib/admin-guard";
import { prisma } from "@/app/lib/prisma";
import { randomBytes } from "crypto";

export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (admin instanceof NextResponse) return admin;

  try {
    const invitations = await prisma.invitation.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        creator: {
          select: { name: true, email: true },
        },
      },
    });

    return NextResponse.json({ success: true, invitations });
  } catch (err: any) {
    console.error("[AdminInvites] Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (admin instanceof NextResponse) return admin;

  try {
    const { email, role = "USER", plan = "FREE" } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json(
        { error: "A user with this email address already exists" },
        { status: 409 }
      );
    }

    // Check if invitation already exists
    const existingInvite = await prisma.invitation.findUnique({ where: { email } });
    if (existingInvite && !existingInvite.accepted && existingInvite.expiresAt > new Date()) {
      return NextResponse.json(
        { error: "An active invitation for this email already exists" },
        { status: 409 }
      );
    }

    const token = `inv_${randomBytes(24).toString("hex")}`;
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const invite = await prisma.invitation.upsert({
      where: { email },
      create: {
        email,
        role,
        plan,
        token,
        expiresAt,
        invitedBy: admin.id,
      },
      update: {
        role,
        plan,
        token,
        expiresAt,
        invitedBy: admin.id,
        accepted: false,
      },
    });

    return NextResponse.json({
      success: true,
      invitation: invite,
      inviteLink: `${process.env.BETTER_AUTH_URL || "http://localhost:3000"}/sign-up?invite=${token}`,
    });
  } catch (err: any) {
    console.error("[AdminInvites] Create error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
