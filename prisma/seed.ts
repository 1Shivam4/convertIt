/**
 * prisma/seed.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Creates 3 test users — one per plan tier — for development and testing.
 *
 * Run:  bun run seed
 *
 * Credentials:
 *   free@convertit.test       / Test@123!  (FREE plan)
 *   standard@convertit.test   / Test@123!  (STANDARD plan)
 *   pro@convertit.test        / Test@123!  (PRO plan)
 */

import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";

// Initialize Prisma directly for seeding (no globalThis cache needed)
const adapter = new PrismaNeon({ connectionString: process.env.DIRECT_URL! });
const prisma = new PrismaClient({ adapter } as any);

const TEST_USERS = [
  {
    email: "free@convertit.test",
    name: "Free User",
    password: "Test@123!",
    plan: "FREE" as const,
  },
  {
    email: "standard@convertit.test",
    name: "Standard User",
    password: "Test@123!",
    plan: "STANDARD" as const,
  },
  {
    email: "pro@convertit.test",
    name: "Pro User",
    password: "Test@123!",
    plan: "PRO" as const,
  },
];

async function hashPassword(password: string): Promise<string> {
  // Better Auth uses scrypt via @noble/hashes under the hood.
  // We use the built-in crypto.scrypt for seed compatibility.
  const { scryptSync, randomBytes } = await import("crypto");
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  // Better Auth expects format: "hash:salt"
  return `${hash}:${salt}`;
}

async function main() {
  console.log("🌱 Seeding test users...\n");

  for (const userData of TEST_USERS) {
    // Check if user already exists
    const existing = await prisma.user.findUnique({
      where: { email: userData.email },
    });

    if (existing) {
      // Update plan if user already exists
      await prisma.user.update({
        where: { email: userData.email },
        data: { plan: userData.plan, emailVerified: true },
      });
      console.log(`✅ Updated existing user: ${userData.email} → ${userData.plan}`);
      continue;
    }

    const passwordHash = await hashPassword(userData.password);
    const userId = `seed_${userData.plan.toLowerCase()}_${Date.now()}`;
    const now = new Date();

    // Create user + credential account atomically
    await prisma.$transaction([
      prisma.user.create({
        data: {
          id: userId,
          email: userData.email,
          name: userData.name,
          emailVerified: true, // Skip email verification for test users
          plan: userData.plan,
          createdAt: now,
          updatedAt: now,
        },
      }),
      prisma.account.create({
        data: {
          id: `acc_${userId}`,
          accountId: userId,
          providerId: "credential",
          userId,
          password: passwordHash,
          createdAt: now,
          updatedAt: now,
        },
      }),
    ]);

    console.log(`✅ Created: ${userData.email} (${userData.plan}) — password: ${userData.password}`);
  }

  console.log("\n🎉 Seed complete!\n");
  console.log("Test credentials:");
  console.log("┌─────────────────────────────────┬───────────┬───────────┐");
  console.log("│ Email                           │ Plan      │ Password  │");
  console.log("├─────────────────────────────────┼───────────┼───────────┤");
  for (const u of TEST_USERS) {
    console.log(`│ ${u.email.padEnd(31)} │ ${u.plan.padEnd(9)} │ ${u.password.padEnd(9)} │`);
  }
  console.log("└─────────────────────────────────┴───────────┴───────────┘");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
