import { NextRequest } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";

type LogJobParams = {
  sourceFormat: string;
  targetFormat: string;
  engine: string;
  status?: "COMPLETED" | "FAILED" | "PROCESSING";
  fileSize?: number;
  mimeType?: string;
  error?: string;
};

/**
 * Resolves the authenticated user (via Better Auth session cookie OR Authorization API key header)
 * and records a Job + Conversion entry in PostgreSQL for user dashboard metrics.
 */
export async function recordUserJob(req: NextRequest, params: LogJobParams) {
  try {
    let userId: string | null = null;

    // 1. Check API Key header (Authorization: Bearer cvt_...)
    const authHeader = req.headers.get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
      const apiKeyVal = authHeader.substring(7).trim();
      const keyRecord = await prisma.apiKey.findUnique({
        where: { key: apiKeyVal },
      });
      if (keyRecord) {
        userId = keyRecord.userId;
      }
    }

    // 2. Fall back to Better Auth session cookie
    if (!userId) {
      const reqHeaders = await headers();
      const session = await auth.api.getSession({ headers: reqHeaders });
      if (session?.user?.id) {
        userId = session.user.id;
      }
    }

    // If no authenticated user, skip job logging (public conversion)
    if (!userId) return null;

    // Create Job + Conversion record
    const job = await prisma.job.create({
      data: {
        userId,
        sourceFormat: params.sourceFormat,
        targetFormat: params.targetFormat,
        status: params.status || "COMPLETED",
        conversions: {
          create: {
            engine: params.engine,
            startedAt: new Date(),
            finishedAt: new Date(),
            error: params.error || null,
          },
        },
      },
    });

    return job;
  } catch (err) {
    console.error("Failed to log user conversion job:", err);
    return null;
  }
}
