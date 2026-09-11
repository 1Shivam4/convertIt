import { describe, it, expect } from "vitest";
import {
  PLAN_LIMITS,
  getPlanLimits,
  formatFileSize,
  getUpgradeMessage,
} from "@/app/lib/plans";

describe("plans module", () => {
  it("defines 4 tier levels with increasing file size limits", () => {
    expect(PLAN_LIMITS.GUEST.maxFileSizeBytes).toBe(10 * 1024 * 1024);
    expect(PLAN_LIMITS.FREE.maxFileSizeBytes).toBe(40 * 1024 * 1024);
    expect(PLAN_LIMITS.STANDARD.maxFileSizeBytes).toBe(200 * 1024 * 1024);
    expect(PLAN_LIMITS.PRO.maxFileSizeBytes).toBe(500 * 1024 * 1024);
  });

  it("restricts API key access to STANDARD and PRO tiers", () => {
    expect(PLAN_LIMITS.GUEST.canUseApiKeys).toBe(false);
    expect(PLAN_LIMITS.FREE.canUseApiKeys).toBe(false);
    expect(PLAN_LIMITS.STANDARD.canUseApiKeys).toBe(true);
    expect(PLAN_LIMITS.PRO.canUseApiKeys).toBe(true);
  });

  it("getPlanLimits returns correct config and defaults to FREE for unknown plan", () => {
    expect(getPlanLimits("STANDARD").label).toBe("Standard");
    // @ts-expect-error invalid plan test
    expect(getPlanLimits("UNKNOWN").label).toBe("Free");
  });

  it("formatFileSize formats bytes correctly", () => {
    expect(formatFileSize(500)).toBe("500 B");
    expect(formatFileSize(2048)).toBe("2 KB");
    expect(formatFileSize(40 * 1024 * 1024)).toBe("40 MB");
  });

  it("getUpgradeMessage generates informative prompts for each plan", () => {
    const msgGuest = getUpgradeMessage("GUEST", 15 * 1024 * 1024);
    expect(msgGuest).toContain("15 MB");
    expect(msgGuest).toContain("Guest plan limit of 10 MB");
    expect(msgGuest).toContain("Sign up for free");

    const msgFree = getUpgradeMessage("FREE", 50 * 1024 * 1024);
    expect(msgFree).toContain("Upgrade to Standard");
  });
});
