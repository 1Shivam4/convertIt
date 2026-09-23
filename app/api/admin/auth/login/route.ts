/**
 * app/api/admin/auth/login/route.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Dedicated, isolated Admin Login endpoint.
 * Validates credentials directly and strictly enforces role === "ADMIN".
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { scryptSync, randomBytes } from "crypto";

function verifyPassword(password: string, storedHash: string): boolean {
  try {
    const [hash, salt] = storedHash.split(":");
    if (!hash || !salt) return false;
    const computedHash = scryptSync(password, salt, 64).toString("hex");
    return computedHash === hash;
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Admin email and password are required." },
        { status: 400 }
      );
    }

    // 1. Look up user by email
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      include: {
        accounts: {
          where: { providerId: "credential" },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Invalid administrator credentials." },
        { status: 401 }
      );
    }

    // 2. Strict Admin Role Check
    if (user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Access Denied: This account does not possess Administrator privileges." },
        { status: 403 }
      );
    }

    if (user.banned) {
      return NextResponse.json(
        { error: "This administrative account has been suspended." },
        { status: 403 }
      );
    }

    // 3. Verify password
    const credentialAccount = user.accounts[0];
    if (!credentialAccount?.password) {
      return NextResponse.json(
        { error: "Password authentication is not configured for this admin account." },
        { status: 401 }
      );
    }

    const isValid = verifyPassword(password, credentialAccount.password);
    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid administrator credentials." },
        { status: 401 }
      );
    }

    // 4. Create new authenticated session in database
    const sessionToken = `adm_sess_${randomBytes(32).toString("hex")}`;
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    const now = new Date();

    const ipAddress =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "127.0.0.1";
    const userAgent = req.headers.get("user-agent") || undefined;

    await prisma.session.create({
      data: {
        id: `sess_${Date.now()}_${randomBytes(8).toString("hex")}`,
        userId: user.id,
        token: sessionToken,
        expiresAt,
        ipAddress,
        userAgent,
        createdAt: now,
        updatedAt: now,
      },
    });

    // 5. Build response and set session cookie
    const isProduction = process.env.NODE_ENV === "production";
    const cookieName = isProduction
      ? "__Secure-better-auth.session_token"
      : "better-auth.session_token";

    const cookieValue = `${cookieName}=${encodeURIComponent(
      sessionToken
    )}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${7 * 24 * 60 * 60}${
      isProduction ? "; Secure" : ""
    }`;

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        plan: user.plan,
      },
    });

    response.headers.set("Set-Cookie", cookieValue);

    return response;
  } catch (err: any) {
    console.error("[AdminAuthLogin] Error:", err);
    return NextResponse.json(
      { error: "Internal server error during authentication." },
      { status: 500 }
    );
  }
}
