CREATE TYPE "PlatformStaffRole" AS ENUM ('OWNER', 'OPERATIONS', 'SUPPORT', 'FINANCE', 'COMPLIANCE', 'READ_ONLY');

CREATE TYPE "PlatformStaffStatus" AS ENUM ('ACTIVE', 'SUSPENDED');

CREATE TABLE "platform_staff" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "PlatformStaffRole" NOT NULL DEFAULT 'READ_ONLY',
    "status" "PlatformStaffStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "suspendedAt" TIMESTAMP(3),
    CONSTRAINT "platform_staff_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "platform_audit_event" (
    "id" TEXT NOT NULL,
    "actorStaffId" TEXT,
    "actorUserId" TEXT,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT,
    "capability" TEXT NOT NULL,
    "reason" TEXT,
    "details" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "platform_audit_event_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "platform_staff_userId_key" ON "platform_staff"("userId");
CREATE INDEX "platform_staff_status_role_idx" ON "platform_staff"("status", "role");
CREATE INDEX "platform_audit_event_createdAt_idx" ON "platform_audit_event"("createdAt");
CREATE INDEX "platform_audit_event_targetType_targetId_createdAt_idx" ON "platform_audit_event"("targetType", "targetId", "createdAt");

ALTER TABLE "platform_staff" ADD CONSTRAINT "platform_staff_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "platform_audit_event" ADD CONSTRAINT "platform_audit_event_actorStaffId_fkey" FOREIGN KEY ("actorStaffId") REFERENCES "platform_staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "platform_audit_event" ADD CONSTRAINT "platform_audit_event_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
