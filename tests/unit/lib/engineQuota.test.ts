import { describe, it, expect, vi, beforeEach } from "vitest";
import { consumeEngineQuota } from "@/app/lib/engine-quota";

// Mock redisConnection
vi.mock("@/app/lib/redis", () => {
  const store = new Map<string, string>();
  return {
    redisConnection: {
      get: vi.fn(async (key: string) => store.get(key) || null),
      incrby: vi.fn(async (key: string, count: number) => {
        const current = parseInt(store.get(key) || "0", 10);
        const next = current + count;
        store.set(key, String(next));
        return next;
      }),
      expire: vi.fn(async () => 1),
      del: vi.fn(async (key: string) => {
        store.delete(key);
        return 1;
      }),
    },
  };
});

describe("Engine Quota System (Redis)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("always allows PDF conversions as unlimited on any plan", async () => {
    const resultGuest = await consumeEngineQuota("test_user_1", "pdf", "GUEST", 50);
    expect(resultGuest.allowed).toBe(true);
    expect(resultGuest.limit).toBe("unlimited");

    const resultFree = await consumeEngineQuota("test_user_1", "pdf", "FREE", 100);
    expect(resultFree.allowed).toBe(true);
    expect(resultFree.limit).toBe("unlimited");
  });

  it("strictly enforces daily media quota on FREE plan (max 5)", async () => {
    const userId = "free_media_user";

    // First 5 media conversions allowed
    for (let i = 1; i <= 5; i++) {
      const res = await consumeEngineQuota(userId, "media", "FREE", 1);
      expect(res.allowed).toBe(true);
      expect(res.current).toBe(i);
      expect(res.limit).toBe(5);
    }

    // 6th conversion should be rejected
    const blockedRes = await consumeEngineQuota(userId, "media", "FREE", 1);
    expect(blockedRes.allowed).toBe(false);
    expect(blockedRes.remaining).toBe(0);
    expect(blockedRes.message).toContain("Daily media conversion limit reached");
  });

  it("enforces daily image quota on GUEST plan (max 10)", async () => {
    const guestId = "guest_image_user";

    const res = await consumeEngineQuota(guestId, "image", "GUEST", 10);
    expect(res.allowed).toBe(true);
    expect(res.current).toBe(10);

    const blockedRes = await consumeEngineQuota(guestId, "image", "GUEST", 1);
    expect(blockedRes.allowed).toBe(false);
    expect(blockedRes.limit).toBe(10);
  });

  it("allows unlimited conversions on PRO plan", async () => {
    const proUser = "pro_user_unlimited";

    const imgRes = await consumeEngineQuota(proUser, "image", "PRO", 1000);
    expect(imgRes.allowed).toBe(true);
    expect(imgRes.limit).toBe("unlimited");

    const mediaRes = await consumeEngineQuota(proUser, "media", "PRO", 500);
    expect(mediaRes.allowed).toBe(true);
    expect(mediaRes.limit).toBe("unlimited");
  });
});
