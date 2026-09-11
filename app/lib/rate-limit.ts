/**
 * app/lib/rate-limit.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Tiered sliding-window rate limiter using Redis.
 * The plan is now passed in from middleware (already resolved + cached there),
 * so this function makes zero DB calls.
 */

import { NextRequest } from "next/server";
import { redisConnection } from "./redis";
import { getPlanLimits, type Plan } from "./plans";
import { getSessionCookie } from "better-auth/cookies";

export type RateLimitResult = {
  success: boolean;
  limit: number;
  remaining: number;
  resetSeconds: number;
};

// In-memory fallback when Redis is unavailable
const inMemoryCache = new Map<string, { count: number; expiresAt: number }>();

/**
 * Check rate limit for the request.
 *
 * @param req   The incoming NextRequest
 * @param plan  The resolved Plan tier (passed from middleware to avoid extra DB hits)
 */
export async function checkRateLimit(
  req: NextRequest,
  plan: Plan = "GUEST"
): Promise<RateLimitResult> {
  const windowSeconds = 60;
  const limit = getPlanLimits(plan).rateLimit;

  let identifier: string;

  // Build a stable identifier for this client
  const authHeader = req.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    identifier = `apikey:${authHeader.substring(7, 40)}`; // first 33 chars of key
  } else {
    const sessionToken = getSessionCookie(req);
    if (sessionToken) {
      identifier = `user:${sessionToken.substring(0, 40)}`;
    } else {
      const ip =
        req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
        req.headers.get("x-real-ip") ||
        "127.0.0.1";
      identifier = `ip:${ip}`;
    }
  }

  const key = `ratelimit:${identifier}`;

  // ── Redis sliding-window ──────────────────────────────────────────────────
  try {
    if (
      redisConnection.status === "ready" ||
      redisConnection.status === "connect"
    ) {
      const now = Date.now();
      const clearBefore = now - windowSeconds * 1000;

      const multi = redisConnection.multi();
      multi.zremrangebyscore(key, 0, clearBefore);
      multi.zadd(key, now, `${now}-${Math.random()}`);
      multi.zcard(key);
      multi.expire(key, windowSeconds);

      const results = await multi.exec();
      const currentCount = (results?.[2]?.[1] as number) || 1;
      const remaining = Math.max(0, limit - currentCount);

      return {
        success: currentCount <= limit,
        limit,
        remaining,
        resetSeconds: windowSeconds,
      };
    }
  } catch (err) {
    console.warn("Redis rate limit warning (falling back to memory):", err);
  }

  // ── In-memory fallback ────────────────────────────────────────────────────
  const now = Date.now();
  const memKey = `mem_ratelimit:${identifier}`;
  const existing = inMemoryCache.get(memKey);

  if (!existing || existing.expiresAt < now) {
    inMemoryCache.set(memKey, {
      count: 1,
      expiresAt: now + windowSeconds * 1000,
    });
    return { success: true, limit, remaining: limit - 1, resetSeconds: windowSeconds };
  }

  existing.count += 1;
  return {
    success: existing.count <= limit,
    limit,
    remaining: Math.max(0, limit - existing.count),
    resetSeconds: Math.ceil((existing.expiresAt - now) / 1000),
  };
}
