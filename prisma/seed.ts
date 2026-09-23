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
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

// Initialize Prisma client dual-compatibly for seeding
const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL || "";
const adapter = connectionString.includes("neon.tech")
  ? new PrismaNeon({ connectionString })
  : new PrismaPg(new Pool({ connectionString }));

const prisma = new PrismaClient({ adapter });

const TEST_USERS = [
  {
    email: "admin@convertit.test",
    name: "System Admin",
    password: "Admin@123!",
    plan: "PRO" as const,
    role: "ADMIN" as const,
  },
  {
    email: "freeaccount@gmail.com",
    name: "Free User",
    password: "Test@123!",
    plan: "FREE" as const,
    role: "USER" as const,
  },
  {
    email: "standardaccount@gmail.com",
    name: "Standard User",
    password: "Test@123!",
    plan: "STANDARD" as const,
    role: "USER" as const,
  },
  {
    email: "proaccount@gmail.com",
    name: "Pro User",
    password: "Test@123!",
    plan: "PRO" as const,
    role: "USER" as const,
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
      // Update plan and role if user already exists
      await prisma.user.update({
        where: { email: userData.email },
        data: { plan: userData.plan, role: userData.role, emailVerified: true },
      });
      console.log(`✅ Updated existing user: ${userData.email} → ${userData.plan} (${userData.role})`);
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
          role: userData.role,
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
