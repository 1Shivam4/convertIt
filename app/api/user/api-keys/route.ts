import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";
import { randomBytes } from "crypto";
import { getPlanLimits } from "@/app/lib/plans";

export async function GET() {
  const reqHeaders = await headers();
  const session = await auth.api.getSession({ headers: reqHeaders });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const keys = await prisma.apiKey.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    select: { id: true, key: true, label: true, lastUsedAt: true, createdAt: true },
  });

  return NextResponse.json({ keys });
}

export async function POST(req: NextRequest) {
  const reqHeaders = await headers();
  const session = await auth.api.getSession({ headers: reqHeaders });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Fetch user's plan from DB
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { plan: true },
  });

  const plan = (user?.plan ?? "FREE") as "GUEST" | "FREE" | "STANDARD" | "PRO";
  const limits = getPlanLimits(plan);

  // ── Gate: only STANDARD and PRO can generate API keys ─────────────────────
  if (!limits.canUseApiKeys) {
    return NextResponse.json(
      {
        error: "API key access requires a Standard or Pro plan.",
        currentPlan: plan,
        requiredPlan: "STANDARD",
      },
      { status: 403 }
    );
  }

  // Optional key label from request body
  let label: string | undefined;
  try {
    const body = await req.json();
    label = body.label?.trim() || undefined;
  } catch { /* no body */ }

  // Generate a secret API key with prefix 'cvt_'
  const generatedKey = `cvt_${randomBytes(24).toString("hex")}`;

  const created = await prisma.apiKey.create({
    data: {
      userId: session.user.id,
      key: generatedKey,
      label,
    },
  });

  return NextResponse.json({ key: created });
}

export async function DELETE(request: Request) {
  const reqHeaders = await headers();
  const session = await auth.api.getSession({ headers: reqHeaders });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const keyId = searchParams.get("id");

  if (!keyId) {
    return NextResponse.json({ error: "Key ID required" }, { status: 400 });
  }

  await prisma.apiKey.deleteMany({
    where: {
      id: keyId,
      userId: session.user.id,
    },
  });

  return NextResponse.json({ success: true });
}
