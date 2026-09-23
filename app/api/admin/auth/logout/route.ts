/**
 * app/api/admin/auth/logout/route.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Dedicated Admin Sign Out endpoint.
 * Revokes active session from database and deletes session cookies.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { getSessionTokenFromRequest } from "@/app/lib/resolve-plan";

export async function POST(req: NextRequest) {
  try {
    const sessionToken = getSessionTokenFromRequest(req);

    if (sessionToken) {
      await prisma.session.deleteMany({
        where: { token: sessionToken },
      });
    }

    const isProduction = process.env.NODE_ENV === "production";
    const cookieName = isProduction
      ? "__Secure-better-auth.session_token"
      : "better-auth.session_token";

    const response = NextResponse.json({
      success: true,
      message: "Admin signed out successfully.",
    });

    // Clear cookie
    response.headers.set(
      "Set-Cookie",
      `${cookieName}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT`
    );

    return response;
  } catch (err: any) {
    console.error("[AdminAuthLogout] Error:", err);
    return NextResponse.json(
      { error: "Internal server error during sign out." },
      { status: 500 }
    );
  }
}
