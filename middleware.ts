/**
 * middleware.ts  (Next.js 16 — must be this filename, export named `middleware`)
 * ─────────────────────────────────────────────────────────────────────────────
 * Route protection + rate limiting + plan header injection.
 */

import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";
import { checkRateLimit } from "@/app/lib/rate-limit";
import { resolvePlanFromRequest } from "@/app/lib/resolve-plan";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── 1. Dashboard protection — redirect if no session ─────────────────────
  const session = getSessionCookie(request);
  if (pathname.startsWith("/dashboard") && !session) {
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }

  // ── 2. Redirect authenticated users away from auth pages ─────────────────
  if ((pathname === "/sign-in" || pathname === "/sign-up") && session) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // ── 3. API conversion routes: resolve plan + rate limit + inject header ───
  const isApiRoute =
    pathname.startsWith("/api/pdf") ||
    pathname.startsWith("/api/image") ||
    pathname.startsWith("/api/media") ||
    pathname.startsWith("/api/storage");

  if (isApiRoute) {
    // Resolve the user's plan (Redis-cached, 60s TTL)
    const plan = await resolvePlanFromRequest(request);

    // Enforce rate limiting for this plan tier
    const rateResult = await checkRateLimit(request, plan);

    if (!rateResult.success) {
      return NextResponse.json(
        {
          error: `Rate limit exceeded. Please wait ${rateResult.resetSeconds}s before retrying.`,
          plan,
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(rateResult.resetSeconds),
            "X-RateLimit-Limit": String(rateResult.limit),
            "X-RateLimit-Remaining": String(rateResult.remaining),
            "X-RateLimit-Reset": String(rateResult.resetSeconds),
            "X-User-Plan": plan,
          },
        }
      );
    }

    // Inject the resolved plan into the request so API route handlers can read it
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-user-plan", plan);

    return NextResponse.next({
      request: { headers: requestHeaders },
    });
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/sign-in",
    "/sign-up",
    "/api/pdf/:path*",
    "/api/image/:path*",
    "/api/media/:path*",
    "/api/storage/:path*",
  ],
};
