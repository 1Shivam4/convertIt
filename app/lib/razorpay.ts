/**
 * app/lib/razorpay.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Razorpay SDK client & Webhook HMAC SHA-256 signature verification.
 */

import Razorpay from "razorpay";
import crypto from "crypto";
import type { Plan } from "./plans";

// Singleton Razorpay instance
export const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || "rzp_test_placeholder",
  key_secret: process.env.RAZORPAY_KEY_SECRET || "rzp_secret_placeholder",
});

/**
 * Map ConvertIt Plan enum to configured Razorpay Plan ID
 */
export function getRazorpayPlanId(plan: Plan): string | null {
  if (plan === "STANDARD") {
    return process.env.RAZORPAY_PLAN_STANDARD_ID || "plan_standard_monthly";
  }
  if (plan === "PRO") {
    return process.env.RAZORPAY_PLAN_PRO_ID || "plan_pro_monthly";
  }
  return null;
}

/**
 * Verify Razorpay Webhook signature using HMAC-SHA256
 */
export function verifyRazorpayWebhookSignature(
  rawBody: string,
  signature: string,
  secret: string
): boolean {
  if (!signature || !secret) return false;
  try {
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(rawBody)
      .digest("hex");

    const sigBuf = Buffer.from(signature, "utf-8");
    const expBuf = Buffer.from(expectedSignature, "utf-8");

    if (sigBuf.length !== expBuf.length) {
      return false;
    }

    return crypto.timingSafeEqual(sigBuf, expBuf);
  } catch (err) {
    console.error("[Razorpay] Error verifying webhook signature:", err);
    return false;
  }
}
