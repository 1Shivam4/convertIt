import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";
import { getPresignedUploadUrl } from "@/app/lib/s3";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { fileName, mimeType, prefix } = body as {
      fileName: string;
      mimeType: string;
      prefix?: string;
    };

    if (!fileName || !mimeType) {
      return NextResponse.json(
        { error: "fileName and mimeType are required" },
        { status: 400 },
      );
    }

    // Identify user if logged in
    let userId: string | null = null;
    const authHeader = req.headers.get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
      const apiKeyVal = authHeader.substring(7).trim();
      const keyRecord = await prisma.apiKey.findUnique({
        where: { key: apiKeyVal },
      });
      if (keyRecord) userId = keyRecord.userId;
    }

    if (!userId) {
      const reqHeaders = await headers();
      const session = await auth.api.getSession({ headers: reqHeaders });
      if (session?.user?.id) userId = session.user.id;
    }

    const { uploadUrl, key, bucket } = await getPresignedUploadUrl({
      fileName,
      mimeType,
      prefix: prefix || (userId ? `users/${userId}/uploads` : "public/uploads"),
    });

    return NextResponse.json({
      uploadUrl,
      key,
      bucket,
    });
  } catch (err: any) {
    console.error("Presign URL generation error:", err);
    return NextResponse.json(
      { error: `Failed to generate upload URL: ${err?.message || err}` },
      { status: 500 },
    );/**
 * Tiered sliding window rate limiter using Redis + ioredis connection.
 * Quotas:
 *   - Anonymous IP: 10 requests / 60 seconds
 *   - Authenticated User: 60 requests / 60 seconds
 *   - API Key Client: 120 requests / 60 seconds
 */
  }
}
