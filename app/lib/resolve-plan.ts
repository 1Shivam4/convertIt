/**
 * app/lib/resolve-plan.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Resolves a user's current Plan tier from a NextRequest.
 * Checks in order: API key header → session cookie → defaults to GUEST.
 * Results are cached in Redis (TTL 60s) to avoid a DB hit per request.
 */

import { NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";
import { redisConnection } from "@/app/lib/redis";
import { prisma } from "@/app/lib/prisma";
import type { Plan } from "@/app/lib/plans";

const CACHE_TTL_SECONDS = 60;

async function getFromCache(key: string): Promise<Plan | null> {
  try {
    if (redisConnection.status === "ready" || redisConnection.status === "connect") {
      const cached = await redisConnection.get(key);
      if (cached) return cached as Plan;
    }
  } catch { /* Redis unavailable — skip cache */ }
  return null;
}

async function setCache(key: string, plan: Plan): Promise<void> {
  try {
    if (redisConnection.status === "ready" || redisConnection.status === "connect") {
      await redisConnection.setex(key, CACHE_TTL_SECONDS, plan);
    }
  } catch { /* ignore */ }
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
    } catch { /* DB error — fall through */ }
  }

  // ── 2. Check Session Cookie ───────────────────────────────────────────────
  const sessionToken = getSessionCookie(req);
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
    } catch { /* DB error — fall through */ }
  }

  // ── 3. Default: unauthenticated guest ─────────────────────────────────────
  return "GUEST";
}
