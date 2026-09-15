import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock redis
vi.mock("@/app/lib/redis", () => ({
  redisConnection: {
    status: "ready",
    get: vi.fn(),
    set: vi.fn(),
    del: vi.fn(),
  },
}));

// Mock prisma
vi.mock("@/app/lib/prisma", () => ({
  prisma: {
    job: { create: vi.fn() },
  },
}));

// Mock email module
vi.mock("@/app/lib/email", () => ({
  sendEmail: vi.fn(async () => ({ messageId: "mock_test_id" })),
}));

import { enqueueEmailJob, emailQueue } from "@/app/lib/queue";
import * as emailModule from "@/app/lib/email";

describe("BullMQ Email Queue Offloader", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("enqueues an email job onto the BullMQ email queue", async () => {
    const addSpy = vi.spyOn(emailQueue, "add").mockResolvedValueOnce({ id: "job_123" } as any);

    const result = await enqueueEmailJob({
      to: "user@example.com",
      subject: "Test Verification",
      html: "<p>Hello</p>",
      type: "verification",
    });

    expect(result.success).toBe(true);
    expect(result.mode).toBe("queue");
    expect(addSpy).toHaveBeenCalledWith("send-email", {
      to: "user@example.com",
      subject: "Test Verification",
      html: "<p>Hello</p>",
      type: "verification",
    });
  });

  it("gracefully falls back to direct SMTP send if queue throws", async () => {
    vi.spyOn(emailQueue, "add").mockRejectedValueOnce(new Error("Redis connection timed out"));
    const sendEmailSpy = vi.spyOn(emailModule, "sendEmail");

    const result = await enqueueEmailJob({
      to: "fallback@example.com",
      subject: "Direct Email",
      html: "<p>Fallback</p>",
      type: "password-reset",
    });

    expect(result.success).toBe(true);
    expect(result.mode).toBe("direct");
    expect(sendEmailSpy).toHaveBeenCalledWith({
      to: "fallback@example.com",
      subject: "Direct Email",
      html: "<p>Fallback</p>",
      type: "password-reset",
    });
  });
});
