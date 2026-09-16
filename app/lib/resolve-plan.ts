/**
 * app/lib/resolve-plan.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Resolves a user's current Plan tier from a NextRequest.
 * Checks in order: API key header → session cookie → defaults to GUEST.
 * Results are cached in Redis (TTL 60s) to avoid a DB hit per request.
 */

import { NextRequest } from "next/server";
import { redisConnection } from "@/app/lib/redis";
import { prisma } from "@/app/lib/prisma";
import type { Plan } from "@/app/lib/plans";

const CACHE_TTL_SECONDS = 60;

/**
 * Safely extracts the Better Auth session token from a NextRequest or standard Request.
 * Native implementation avoiding external cookie parser crashes in Next.js 16.
 */
export function getSessionTokenFromRequest(req: NextRequest | Request): string | null {
  try {
    if ("cookies" in req && req.cookies && typeof req.cookies.get === "function") {
      const token =
        req.cookies.get("better-auth.session_token")?.value ||
        req.cookies.get("__Secure-better-auth.session_token")?.value;
      if (token) return token;
    }

    const cookieHeader = req.headers.get("cookie");
    if (!cookieHeader) return null;

    const match = cookieHeader.match(
      /(?:^|;\s*)(?:__Secure-)?better-auth\.session_token=([^;]+)/
    );
    return match ? decodeURIComponent(match[1]) : null;
  } catch (err) {
    console.error("[SessionExtract] Error reading session token:", err);
    return null;
  }
}

async function getFromCache(key: string): Promise<Plan | null> {
  try {
    if (redisConnection.status === "ready" || redisConnection.status === "connect") {
      const cached = await redisConnection.get(key);
      if (cached) return cached as Plan;
    }
  } catch {
    /* Redis unavailable — skip cache */
  }
  return null;
}

async function setCache(key: string, plan: Plan): Promise<void> {
  try {
    if (redisConnection.status === "ready" || redisConnection.status === "connect") {
      await redisConnection.setex(key, CACHE_TTL_SECONDS, plan);
    }
  } catch {
    /* ignore */
  }
}

/**
 * Resolve the Plan for the incoming request.
 * Priority: API key → session cookie → GUEST
 */
export async function resolvePlanFromRequest(req: NextRequest): Promise<Plan> {
  // ── 1. Check API Key (Authorization: Bearer cvt_...) ──────────────────────
  const authHeader = req.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const apiKeyVal = authHeader.substring(7).trim();
    const cacheKey = `plan:apikey:${apiKeyVal}`;

    const cached = await getFromCache(cacheKey);
    if (cached) return cached;

    try {
      const keyRecord = await prisma.apiKey.findUnique({
        where: { key: apiKeyVal },
        select: { user: { select: { plan: true } } },
      });
      if (keyRecord?.user?.plan) {
        const plan = keyRecord.user.plan as Plan;
        await setCache(cacheKey, plan);
        return plan;
      }
    } catch {
      /* DB error — fall through */
    }
  }

  // ── 2. Check Session Cookie ───────────────────────────────────────────────
  const sessionToken = getSessionTokenFromRequest(req);
  if (sessionToken) {
    const cacheKey = `plan:session:${sessionToken}`;

    const cached = await getFromCache(cacheKey);
    if (cached) return cached;

    try {
      // Look up session → user → plan
      const session = await prisma.session.findUnique({
        where: { token: sessionToken },
        select: { user: { select: { plan: true } } },
      });
      if (session?.user?.plan) {
        const plan = session.user.plan as Plan;
        await setCache(cacheKey, plan);
        return plan;
      }
    } catch {
      /* DB error — fall through */
    }
  }

  // ── 3. Default: unauthenticated guest ─────────────────────────────────────
  return "GUEST";
}

/**
 * Resolves the authenticated user ID and role if available.
 */
export async function resolveUserFromRequest(
  req: NextRequest | Request
): Promise<{ id: string; email?: string; role?: string; plan: Plan } | null> {
  const sessionToken = getSessionTokenFromRequest(req);
  if (sessionToken) {
    try {
      const session = await prisma.session.findUnique({
        where: { token: sessionToken },
        select: {
          user: {
            select: { id: true, email: true, plan: true, role: true, banned: true },
          },
        },
      });
      if (session?.user && !session.user.banned) {
        return {
          id: session.user.id,
          email: session.user.email,
          role: session.user.role,
          plan: session.user.plan as Plan,
        };
      }
    } catch {
      /* ignore DB lookup error */
    }
  }

  // Also check Bearer API key
  const authHeader = req.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const apiKeyVal = authHeader.substring(7).trim();
    try {
      const keyRecord = await prisma.apiKey.findUnique({
        where: { key: apiKeyVal },
        select: {
          user: {
            select: { id: true, email: true, plan: true, role: true, banned: true },
          },
        },
      });
      if (keyRecord?.user && !keyRecord.user.banned) {
        return {
          id: keyRecord.user.id,
          email: keyRecord.user.email,
          role: keyRecord.user.role,
          plan: keyRecord.user.plan as Plan,
        };
      }
    } catch {
      /* ignore DB lookup error */
    }
  }

  return null;
}

/**
 * Invalidate all Redis plan cache entries for a user upon subscription updates.
 */
export async function invalidateUserPlanCache(userId: string): Promise<void> {
  try {
    if (redisConnection.status === "ready" || redisConnection.status === "connect") {
      const sessions = await prisma.session.findMany({
        where: { userId },
        select: { token: true },
      });
      const keysToDelete = sessions.map((s) => `plan:session:${s.token}`);

      const apiKeys = await prisma.apiKey.findMany({
        where: { userId },
        select: { key: true },
      });
      keysToDelete.push(...apiKeys.map((k) => `plan:apikey:${k.key}`));

      if (keysToDelete.length > 0) {
        await redisConnection.del(...keysToDelete);
      }
    }
  } catch (err) {
    console.error("[ResolvePlan] Failed to invalidate plan cache:", err);
  }
}
