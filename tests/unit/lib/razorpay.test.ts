import { describe, it, expect } from "vitest";
import {
  verifyRazorpayWebhookSignature,
  getRazorpayPlanId,
} from "@/app/lib/razorpay";
import crypto from "crypto";

describe("Razorpay Library & Webhook Signatures", () => {
  const secret = "test_webhook_secret_key_123";
  const rawBody = JSON.stringify({
    event: "subscription.charged",
    payload: {
      subscription: {
        entity: {
          id: "sub_123456",
          status: "active",
        },
      },
    },
  });

  it("successfully validates authentic HMAC SHA-256 signatures", () => {
    const validSignature = crypto
      .createHmac("sha256", secret)
      .update(rawBody)
      .digest("hex");

    const isValid = verifyRazorpayWebhookSignature(rawBody, validSignature, secret);
    expect(isValid).toBe(true);
  });

  it("rejects tampered or invalid signatures", () => {
    const invalidSignature = "invalid_fake_signature_hex_code";
    const isValid = verifyRazorpayWebhookSignature(rawBody, invalidSignature, secret);
    expect(isValid).toBe(false);
  });

  it("returns null for non-paid plans", () => {
    expect(getRazorpayPlanId("FREE")).toBe(null);
    expect(getRazorpayPlanId("GUEST")).toBe(null);
  });

  it("returns configured plan ID for STANDARD and PRO", () => {
    expect(getRazorpayPlanId("STANDARD")).toBeTruthy();
    expect(getRazorpayPlanId("PRO")).toBeTruthy();
  });
});
