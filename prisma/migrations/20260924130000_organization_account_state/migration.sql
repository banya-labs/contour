CREATE TYPE "OrganizationAccountStatus" AS ENUM ('ACTIVE', 'LOCKED', 'SUSPENDED', 'DELETION_PENDING');
ALTER TABLE "organization" ADD COLUMN "accountStatus" "OrganizationAccountStatus" NOT NULL DEFAULT 'ACTIVE';
ALTER TABLE "organization" ADD COLUMN "accountLockedAt" TIMESTAMP(3);
ALTER TABLE "organization" ADD COLUMN "accountLockReason" TEXT;
