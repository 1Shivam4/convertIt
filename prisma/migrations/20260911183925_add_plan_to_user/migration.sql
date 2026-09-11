-- CreateEnum
CREATE TYPE "Plan" AS ENUM ('GUEST', 'FREE', 'STANDARD', 'PRO');

-- AlterTable
ALTER TABLE "ApiKey" ADD COLUMN     "label" TEXT,
ADD COLUMN     "lastUsedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "plan" "Plan" NOT NULL DEFAULT 'FREE',
ADD COLUMN     "planExpiresAt" TIMESTAMP(3);
