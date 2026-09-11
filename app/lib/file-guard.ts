/**
 * app/lib/file-guard.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Server-side file size enforcement.
 * Called at the top of every conversion API route handler.
 * Reads the X-User-Plan header attached by middleware (resolve-plan).
 */

import { NextRequest } from "next/server";
import { getPlanLimits, getUpgradeMessage, type Plan } from "@/app/lib/plans";

export type FileGuardResult =
  | { allowed: true; plan: Plan }
  | { allowed: false; plan: Plan; limitBytes: number; error: string; status: 413 };

/**
 * Validates that the given file size is within the plan's allowed limit.
 *
 * @param req       The incoming NextRequest (reads X-User-Plan header)
 * @param fileSize  File size in bytes to check
 */
export function guardFileSize(req: NextRequest, fileSize: number): FileGuardResult {
  const plan = (req.headers.get("x-user-plan") as Plan | null) ?? "GUEST";
  const limits = getPlanLimits(plan);

  if (fileSize > limits.maxFileSizeBytes) {
    return {
      allowed: false,
      plan,
      limitBytes: limits.maxFileSizeBytes,
      error: getUpgradeMessage(plan, fileSize),
      status: 413,
    };
  }

  return { allowed: true, plan };
}

/**
 * Validates total size of multiple files (e.g. batch image conversion).
 * Uses the same single-file limit per file to keep things simple.
 */
export function guardFileSizeBatch(
  req: NextRequest,
  files: File[]
): FileGuardResult {
  const plan = (req.headers.get("x-user-plan") as Plan | null) ?? "GUEST";
  const limits = getPlanLimits(plan);

  for (const file of files) {
    if (file.size > limits.maxFileSizeBytes) {
      return {
        allowed: false,
        plan,
        limitBytes: limits.maxFileSizeBytes,
        error: getUpgradeMessage(plan, file.size),
        status: 413,
      };
    }
  }

  return { allowed: true, plan };
}

/**
 * Convenience: returns a ready-to-send 413 Response from a failed guard result.
 */
export function fileSizeErrorResponse(result: Extract<FileGuardResult, { allowed: false }>) {
  return Response.json(
    {
      error: result.error,
      plan: result.plan,
      limitBytes: result.limitBytes,
    },
    {
      status: 413,
      headers: { "X-User-Plan": result.plan },
    }
  );
}
