/**
 * app/lib/admin-guard.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Centralized Role-Based Access Control (RBAC) guard for Admin routes & APIs.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { getSessionTokenFromRequest } from "@/app/lib/resolve-plan";

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "USER";
  plan: string;
}

/**
 * Verify if the incoming NextRequest / Request is authenticated as an active ADMIN user.
 * Returns the admin user record, or null if unauthorized/forbidden.
 */
export async function getAdminUserFromRequest(
  req: NextRequest | Request
): Promise<AdminUser | null> {
  try {
    const sessionToken = getSessionTokenFromRequest(req);
    if (!sessionToken) return null;

    const session = await prisma.session.findUnique({
      where: { token: sessionToken },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            plan: true,
            banned: true,
          },
        },
      },
    });

    if (
      session?.user &&
      session.user.role === "ADMIN" &&
      !session.user.banned
    ) {
      return {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        role: session.user.role as "ADMIN",
        plan: session.user.plan,
      };
    }

    return null;
  } catch (err) {
    console.error("[AdminGuard] Verification error:", err);
    return null;
  }
}

/**
 * Helper to enforce admin authorization in API Route handlers.
 * Usage:
 *   const admin = await requireAdmin(req);
 *   if (admin instanceof NextResponse) return admin; // returns 401/403 automatically
 */
export async function requireAdmin(
  req: NextRequest | Request
): Promise<AdminUser | NextResponse> {
  const sessionToken = getSessionTokenFromRequest(req);
  if (!sessionToken) {
    return NextResponse.json(
      { error: "Authentication required. Please log in as an administrator." },
      { status: 401 }
    );
  }

  const admin = await getAdminUserFromRequest(req);
  if (!admin) {
    return NextResponse.json(
      { error: "Access denied. Administrator privileges required." },
      { status: 403 }
    );
  }

  return admin;
}
