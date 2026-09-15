/**
 * app/lib/engine-quota.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * High-performance Redis-backed atomic daily conversion quota tracking.
 * Ensures PDF remains unlimited while Image and Media (Video/Audio) are
 * strictly bounded on Free and Guest tiers.
 */

import { redisConnection } from "./redis";
import { getPlanLimits, type Plan, type EngineType } from "./plans";
import { NextRequest } from "next/server";

export type QuotaCheckResult = {
  allowed: boolean;
  engine: EngineType;
  current: number;
  limit: number | "unlimited";
  remaining: number;
  resetSeconds: number;
  message?: string;
};

/** Get midnight UTC seconds remaining for TTL */
function getSecondsUntilMidnight(): number {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setUTCHours(24, 0, 0, 0);
  return Math.max(60, Math.floor((midnight.getTime() - now.getTime()) / 1000));
}

/** Get current UTC date string YYYY-MM-DD */
function getTodayDateString(): string {
  return new Date().toISOString().split("T")[0];
}

/** Extract client IP or session user identifier */
export function getClientIdentifier(req: NextRequest, userId?: string | null): string {
  if (userId) return `usr_${userId}`;
  const forwarded = req.headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0].trim() : "anonymous_client";
  return `ip_${ip}`;
}

/**
 * Check and consume daily quota for a given engine (Image / Media / PDF).
 * PDFs are unconditionally allowed ("unlimited").
 */
export async function consumeEngineQuota(
  identifier: string,
  engine: EngineType,
  plan: Plan,
  batchCount: number = 1
): Promise<QuotaCheckResult> {
  const limits = getPlanLimits(plan);
  const engineLimitKey = `${engine}DailyLimit` as keyof typeof limits.quotas;
  const rawLimit = limits.quotas[engineLimitKey];
  const resetSeconds = getSecondsUntilMidnight();

  // 1. If engine is unlimited for this plan (e.g. all PDFs or Pro tier), allow immediately
  if (rawLimit === "unlimited") {
    return {
      allowed: true,
      engine,
      current: 0,
      limit: "unlimited",
      remaining: Infinity,
      resetSeconds,
    };
  }

  const limitNumber = typeof rawLimit === "number" ? rawLimit : 0;
  const dateKey = getTodayDateString();
  const redisKey = `quota:${engine}:${identifier}:${dateKey}`;

  try {
    // 2. Fetch current count before incrementing
    const currentStr = await redisConnection.get(redisKey);
    const current = currentStr ? parseInt(currentStr, 10) : 0;

    if (current + batchCount > limitNumber) {
      const upgradeTarget = plan === "GUEST" ? "Free" : "Standard";
      return {
        allowed: false,
        engine,
        current,
        limit: limitNumber,
        remaining: Math.max(0, limitNumber - current),
        resetSeconds,
        message: `Daily ${engine} conversion limit reached (${current}/${limitNumber}). Upgrade to ${upgradeTarget} to unlock higher limits.`,
      };
    }

    // 3. Atomically increment quota
    const newCount = await redisConnection.incrby(redisKey, batchCount);
    if (newCount === batchCount) {
      await redisConnection.expire(redisKey, resetSeconds);
    }

    return {
      allowed: true,
      engine,
      current: newCount,
      limit: limitNumber,
      remaining: Math.max(0, limitNumber - newCount),
      resetSeconds,
    };
  } catch (err) {
    console.error(`[EngineQuota] Redis error checking ${engine} quota:`, err);
    // Graceful degradation: allow request if Redis temporarily fails
    return {
      allowed: true,
      engine,
      current: 0,
      limit: limitNumber,
      remaining: 1,
      resetSeconds,
    };
  }
}
