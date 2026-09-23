import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";
import { resolveUserFromRequest } from "@/app/lib/resolve-plan";

export async function GET(req: NextRequest) {
  let userId: string | undefined;

  // 1. First try Better Auth native session extraction
  try {
    const reqHeaders = await headers();
    const session = await auth.api.getSession({ headers: reqHeaders });
    if (session?.user?.id) {
      userId = session.user.id;
    }
  } catch {
    /* fallback to resolveUserFromRequest */
  }

  // 2. Fallback to resolveUserFromRequest
  if (!userId) {
    const userSummary = await resolveUserFromRequest(req);
    if (userSummary?.id) {
      userId = userSummary.id;
    }
  }

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        plan: true,
        role: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    let tokens = 0;
    try {
      const tokenRecord = await (prisma as any).tokenBalance?.findUnique({
        where: { userId },
        select: { balance: true },
      });
      if (tokenRecord?.balance) {
        tokens = tokenRecord.balance;
      }
    } catch {
      /* ignore if tokenBalance not initialized */
    }

    return NextResponse.json({
      success: true,
      user: {
        ...user,
        tokens,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
