import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";
import { razorpay, getRazorpayPlanId } from "@/app/lib/razorpay";
import { getPlanLimits, type Plan } from "@/app/lib/plans";

export async function POST(req: NextRequest) {
  try {
    const reqHeaders = await headers();
    const session = await auth.api.getSession({ headers: reqHeaders });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized. Please sign in." }, { status: 401 });
    }

    const body = await req.json();
    const targetPlan = body.plan as Plan;

    if (targetPlan !== "STANDARD" && targetPlan !== "PRO") {
      return NextResponse.json({ error: "Invalid target subscription plan." }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { subscription: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    // Check if user already has an active subscription for this plan
    if (user.plan === targetPlan && user.subscription?.status === "ACTIVE") {
      return NextResponse.json(
        { error: `You are already actively subscribed to the ${targetPlan} plan.` },
        { status: 400 }
      );
    }

    const planId = getRazorpayPlanId(targetPlan);
    if (!planId) {
      return NextResponse.json({ error: "Razorpay Plan ID not configured." }, { status: 500 });
    }

    const planLimits = getPlanLimits(targetPlan);

    // Create a subscription in Razorpay (e.g. 120 total billing cycles = 10 years max)
    const subscription = await (razorpay as any).subscriptions.create({
      plan_id: planId,
      total_count: 120,
      quantity: 1,
      customer_notify: 1,
      notes: {
        userId: user.id,
        userEmail: user.email,
        targetPlan: targetPlan,
      },
    });

    return NextResponse.json({
      subscriptionId: subscription.id,
      keyId: process.env.RAZORPAY_KEY_ID || "rzp_test_placeholder",
      plan: targetPlan,
      amount: planLimits.priceInr * 100, // amount in paise
      currency: "INR",
      name: `ConvertIt ${planLimits.label} Plan`,
      description: `${planLimits.label} Tier Monthly Subscription`,
      user: {
        name: user.name,
        email: user.email,
      },
    });
  } catch (err: any) {
    console.error("[Razorpay Subscription Create Error]:", err);
    return NextResponse.json(
      { error: err.message || "Failed to initiate Razorpay subscription." },
      { status: 500 }
    );
  }
}
