import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { verifyRazorpayWebhookSignature } from "@/app/lib/razorpay";
import { invalidateUserPlanCache } from "@/app/lib/resolve-plan";
import type { Plan } from "@/app/lib/plans";

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-razorpay-signature") || "";
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || "";

    // 1. Verify Webhook Signature if secret is configured
    if (webhookSecret) {
      const isValid = verifyRazorpayWebhookSignature(rawBody, signature, webhookSecret);
      if (!isValid) {
        console.error("[Razorpay Webhook] Invalid HMAC signature received.");
        return NextResponse.json({ error: "Invalid webhook signature." }, { status: 400 });
      }
    }

    const payload = JSON.parse(rawBody);
    const event = payload.event;
    const subscriptionData = payload.payload?.subscription?.entity;

    console.log(`[Razorpay Webhook] Processing event: ${event}`);

    if (!subscriptionData) {
      return NextResponse.json({ received: true });
    }

    const razorpaySubId = subscriptionData.id;
    const razorpayPlanId = subscriptionData.plan_id;
    const notes = subscriptionData.notes || {};
    let userId = notes.userId as string | undefined;
    const targetPlan = (notes.targetPlan || "STANDARD") as Plan;

    // If userId not in notes, look up existing subscription in DB
    if (!userId) {
      const existingSub = await prisma.subscription.findUnique({
        where: { razorpaySubscriptionId: razorpaySubId },
        select: { userId: true },
      });
      userId = existingSub?.userId;
    }

    if (!userId) {
      console.warn(`[Razorpay Webhook] Could not resolve userId for subscription ${razorpaySubId}`);
      return NextResponse.json({ received: true });
    }

    // 2. Dispatch events
    if (
      event === "subscription.charged" ||
      event === "subscription.activated" ||
      event === "subscription.authenticated"
    ) {
      const currentStart = subscriptionData.current_start
        ? new Date(subscriptionData.current_start * 1000)
        : new Date();
      const currentEnd = subscriptionData.current_end
        ? new Date(subscriptionData.current_end * 1000)
        : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

      // Upsert Subscription
      await prisma.subscription.upsert({
        where: { userId },
        update: {
          razorpaySubscriptionId: razorpaySubId,
          razorpayPlanId: razorpayPlanId,
          razorpayCustomerId: subscriptionData.customer_id || null,
          status: "ACTIVE",
          plan: targetPlan,
          currentPeriodStart: currentStart,
          currentPeriodEnd: currentEnd,
          cancelAtPeriodEnd: false,
          updatedAt: new Date(),
        },
        create: {
          userId,
          razorpaySubscriptionId: razorpaySubId,
          razorpayPlanId: razorpayPlanId,
          razorpayCustomerId: subscriptionData.customer_id || null,
          status: "ACTIVE",
          plan: targetPlan,
          currentPeriodStart: currentStart,
          currentPeriodEnd: currentEnd,
        },
      });

      // Update User tier
      await prisma.user.update({
        where: { id: userId },
        data: {
          plan: targetPlan,
          planExpiresAt: currentEnd,
        },
      });

      // Instantly clear Redis plan cache so new limits apply
      await invalidateUserPlanCache(userId);
      console.log(`[Razorpay Webhook] User ${userId} upgraded to ${targetPlan}`);
    } else if (event === "subscription.cancelled" || event === "subscription.completed") {
      // Mark subscription as CANCELLED and revert user to FREE
      await prisma.subscription.updateMany({
        where: { razorpaySubscriptionId: razorpaySubId },
        data: {
          status: "CANCELLED",
          updatedAt: new Date(),
        },
      });

      await prisma.user.update({
        where: { id: userId },
        data: {
          plan: "FREE",
          planExpiresAt: null,
        },
      });

      await invalidateUserPlanCache(userId);
      console.log(`[Razorpay Webhook] User ${userId} subscription cancelled, reverted to FREE`);
    } else if (event === "subscription.halted") {
      await prisma.subscription.updateMany({
        where: { razorpaySubscriptionId: razorpaySubId },
        data: {
          status: "HALTED",
          updatedAt: new Date(),
        },
      });
    }

    return NextResponse.json({ received: true });
  } catch (err: any) {
    console.error("[Razorpay Webhook Handler Error]:", err);
    return NextResponse.json({ error: err.message || "Webhook processing error" }, { status: 500 });
  }
}
