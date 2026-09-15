import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";
import { razorpay } from "@/app/lib/razorpay";

export async function POST(req: NextRequest) {
  try {
    const reqHeaders = await headers();
    const session = await auth.api.getSession({ headers: reqHeaders });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const subscription = await prisma.subscription.findUnique({
      where: { userId: session.user.id },
    });

    if (!subscription || subscription.status !== "ACTIVE") {
      return NextResponse.json(
        { error: "No active paid subscription found to cancel." },
        { status: 400 }
      );
    }

    // Cancel at end of current billing cycle in Razorpay
    try {
      await (razorpay as any).subscriptions.cancel(
        subscription.razorpaySubscriptionId,
        { cancel_at_cycle_end: 1 }
      );
    } catch (err: any) {
      console.warn("[Razorpay Cancel Warning]:", err.message);
      // Even if already canceled in Razorpay, proceed with DB update
    }

    const updated = await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        cancelAtPeriodEnd: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Subscription will cancel at the end of the current billing period.",
      currentPeriodEnd: updated.currentPeriodEnd,
    });
  } catch (err: any) {
    console.error("[Razorpay Subscription Cancel Error]:", err);
    return NextResponse.json(
      { error: err.message || "Failed to cancel subscription." },
      { status: 500 }
    );
  }
}
