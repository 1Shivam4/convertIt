/**
 * middleware.ts (Next.js 15 Edge Middleware)
 * ─────────────────────────────────────────────────────────────────────────────
 * IMPORTANT: This file runs in the Edge Runtime — NO Node.js APIs allowed.
 * That means NO ioredis, NO Prisma, NO pg, NO Buffer, NO native modules.
 *
 * Responsibilities here are intentionally lightweight:
 *  1. Redirect unauthenticated users away from /dashboard
 *  2. Redirect authenticated users away from /sign-in and /sign-up
 *  3. Inject an x-pathname header so server components can read the current path
 *
 * Rate limiting & plan resolution happen inside API route handlers (Node.js
 * runtime) where ioredis and Prisma are both available.
 */

import { NextRequest, NextResponse } from "next/server";

/** Extract the Better Auth session token from cookies — Edge-compatible. */
function getSessionToken(req: NextRequest): string | null {
  // NextRequest.cookies is available in Edge — safe to use
  return (
    req.cookies.get("better-auth.session_token")?.value ||
    req.cookies.get("__Secure-better-auth.session_token")?.value ||
    null
  );
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionToken = getSessionToken(request);

  // ── 1. Dashboard protection — redirect if no session ─────────────────────
  if (pathname.startsWith("/dashboard") && !sessionToken) {
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }

  // ── 2. Redirect authenticated users away from auth pages ─────────────────
  if ((pathname === "/sign-in" || pathname === "/sign-up") && sessionToken) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // ── 3. Pass x-pathname header so layouts/server components know the route ─
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", pathname);

  return NextResponse.next({
    request: { headers: requestHeaders },
  });
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/sign-in",
    "/sign-up",
    /*
     * API routes are matched so the x-pathname header is injected,
     * but rate limiting is enforced inside each route handler (Node.js runtime).
     */
    "/api/pdf/:path*",
    "/api/image/:path*",
    "/api/media/:path*",
    "/api/storage/:path*",
  ],
};
