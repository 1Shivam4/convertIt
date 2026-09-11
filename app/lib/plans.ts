/**
 * app/lib/plans.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Single source of truth for all subscription tier limits.
 * Every enforcement layer (middleware, API routes, UI) reads from here.
 */

export type Plan = "GUEST" | "FREE" | "STANDARD" | "PRO";

export type PlanConfig = {
  /** Maximum allowed upload file size in bytes */
  maxFileSizeBytes: number;
  /** API requests allowed per minute (sliding window) */
  rateLimit: number;
  /** How long to keep output files in Cloudflare R2 (0 = stream only, no storage) */
  storageTTLHours: number;
  /** BullMQ job priority — lower number = higher priority */
  queuePriority: number;
  /** Whether this plan can generate API keys */
  canUseApiKeys: boolean;
  /** Max concurrent file uploads allowed */
  concurrentUploads: number;
  /** Human-readable display label */
  label: string;
  /** Badge color class for DaisyUI */
  badgeColor: string;
};

export const PLAN_LIMITS = {
  GUEST: {
    maxFileSizeBytes: 10 * 1024 * 1024,   // 10 MB
    rateLimit: 10,
    storageTTLHours: 0,                    // stream-only, no R2 persistence
    queuePriority: 10,
    canUseApiKeys: false,
    concurrentUploads: 1,
    label: "Guest",
    badgeColor: "badge-ghost",
  },
  FREE: {
    maxFileSizeBytes: 40 * 1024 * 1024,   // 40 MB
    rateLimit: 30,
    storageTTLHours: 24,
    queuePriority: 5,
    canUseApiKeys: false,
    concurrentUploads: 2,
    label: "Free",
    badgeColor: "badge-neutral",
  },
  STANDARD: {
    maxFileSizeBytes: 200 * 1024 * 1024,  // 200 MB
    rateLimit: 100,
    storageTTLHours: 168,                  // 7 days
    queuePriority: 2,
    canUseApiKeys: true,
    concurrentUploads: 5,
    label: "Standard",
    badgeColor: "badge-info",
  },
  PRO: {
    maxFileSizeBytes: 500 * 1024 * 1024,  // 500 MB
    rateLimit: 300,
    storageTTLHours: 720,                  // 30 days
    queuePriority: 1,
    canUseApiKeys: true,
    concurrentUploads: 10,
    label: "Pro",
    badgeColor: "badge-warning",
  },
} as const satisfies Record<Plan, PlanConfig>;

/** Get limits for a given plan tier. */
export function getPlanLimits(plan: Plan): PlanConfig {
  return PLAN_LIMITS[plan] ?? PLAN_LIMITS.FREE;
}

/** Format bytes to a human-readable string, e.g. "40 MB", "500 MB" */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(0)} MB`;
}

/** Returns a friendly upgrade message when a file exceeds the plan limit. */
export function getUpgradeMessage(plan: Plan, fileSize: number): string {
  const limit = getPlanLimits(plan);
  const fileMB = formatFileSize(fileSize);
  const limitMB = formatFileSize(limit.maxFileSizeBytes);

  const upgrades: Record<Plan, string> = {
    GUEST:    "Sign up for free to upload files up to 40 MB",
    FREE:     "Upgrade to Standard to upload files up to 200 MB",
    STANDARD: "Upgrade to Pro to upload files up to 500 MB",
    PRO:      "File exceeds the maximum allowed size",
  };

  return `Your file (${fileMB}) exceeds your ${limit.label} plan limit of ${limitMB}. ${upgrades[plan]}.`;
}
