-- Additive Phase A/B foundation. Existing Better Auth columns remain compatible.
ALTER TABLE "member" ADD COLUMN IF NOT EXISTS "status" TEXT NOT NULL DEFAULT 'active', ADD COLUMN IF NOT EXISTS "deactivatedAt" TIMESTAMP(3), ADD COLUMN IF NOT EXISTS "deactivatedById" TEXT, ADD COLUMN IF NOT EXISTS "lastRoleChangedAt" TIMESTAMP(3);
ALTER TABLE "invitation" ADD COLUMN IF NOT EXISTS "tokenHash" TEXT, ADD COLUMN IF NOT EXISTS "acceptedAt" TIMESTAMP(3), ADD COLUMN IF NOT EXISTS "acceptedByUserId" TEXT, ADD COLUMN IF NOT EXISTS "revokedAt" TIMESTAMP(3), ADD COLUMN IF NOT EXISTS "roleKey" TEXT, ADD COLUMN IF NOT EXISTS "note" TEXT;

CREATE TABLE "organization_profile" ("id" TEXT NOT NULL, "organizationId" TEXT NOT NULL, "country" TEXT NOT NULL DEFAULT 'ZM', "timezone" TEXT NOT NULL DEFAULT 'Africa/Lusaka', "agencyType" TEXT NOT NULL DEFAULT 'BROKERAGE', "primaryOfficeAddress" TEXT, "city" TEXT, "primaryPhone" TEXT, "primaryEmail" TEXT, "onboardingStatus" TEXT NOT NULL DEFAULT 'ORGANIZATION_PROFILE_REQUIRED', "onboardingStep" TEXT NOT NULL DEFAULT 'PROFILE', "completedAt" TIMESTAMP(3), "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "organization_profile_pkey" PRIMARY KEY ("id"));
CREATE UNIQUE INDEX "organization_profile_organizationId_key" ON "organization_profile"("organizationId");
ALTER TABLE "organization_profile" ADD CONSTRAINT "organization_profile_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "organization_asset" ("id" TEXT NOT NULL, "organizationId" TEXT NOT NULL, "kind" TEXT NOT NULL, "objectKey" TEXT NOT NULL, "mimeType" TEXT NOT NULL, "fileSize" INTEGER NOT NULL, "sha256" TEXT NOT NULL, "originalFileName" TEXT, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "organization_asset_pkey" PRIMARY KEY ("id"));
CREATE UNIQUE INDEX "organization_asset_objectKey_key" ON "organization_asset"("objectKey");
CREATE UNIQUE INDEX "organization_asset_organizationId_kind_key" ON "organization_asset"("organizationId", "kind");
CREATE INDEX "organization_asset_organizationId_kind_idx" ON "organization_asset"("organizationId", "kind");
ALTER TABLE "organization_asset" ADD CONSTRAINT "organization_asset_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "organization_role" ("id" TEXT NOT NULL, "organizationId" TEXT NOT NULL, "key" TEXT NOT NULL, "displayName" TEXT NOT NULL, "description" TEXT, "isSystem" BOOLEAN NOT NULL DEFAULT true, "isActive" BOOLEAN NOT NULL DEFAULT true, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "organization_role_pkey" PRIMARY KEY ("id"));
CREATE UNIQUE INDEX "organization_role_organizationId_key_key" ON "organization_role"("organizationId", "key");
CREATE INDEX "organization_role_organizationId_isActive_idx" ON "organization_role"("organizationId", "isActive");
ALTER TABLE "organization_role" ADD CONSTRAINT "organization_role_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "organization_role_permission" ("id" TEXT NOT NULL, "roleId" TEXT NOT NULL, "permission" TEXT NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "organization_role_permission_pkey" PRIMARY KEY ("id"));
CREATE UNIQUE INDEX "organization_role_permission_roleId_permission_key" ON "organization_role_permission"("roleId", "permission");
CREATE INDEX "organization_role_permission_permission_idx" ON "organization_role_permission"("permission");
ALTER TABLE "organization_role_permission" ADD CONSTRAINT "organization_role_permission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "organization_role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "member_role_assignment" ("id" TEXT NOT NULL, "memberId" TEXT NOT NULL, "roleId" TEXT NOT NULL, "assignedById" TEXT, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "member_role_assignment_pkey" PRIMARY KEY ("id"));
CREATE UNIQUE INDEX "member_role_assignment_memberId_roleId_key" ON "member_role_assignment"("memberId", "roleId");
CREATE INDEX "member_role_assignment_memberId_idx" ON "member_role_assignment"("memberId");
ALTER TABLE "member_role_assignment" ADD CONSTRAINT "member_role_assignment_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "member"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "member_role_assignment" ADD CONSTRAINT "member_role_assignment_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "organization_role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "member_permission_override" ("id" TEXT NOT NULL, "memberId" TEXT NOT NULL, "permission" TEXT NOT NULL, "effect" TEXT NOT NULL DEFAULT 'ALLOW', "scope" JSONB, "assignedById" TEXT, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "member_permission_override_pkey" PRIMARY KEY ("id"));
CREATE UNIQUE INDEX "member_permission_override_memberId_permission_key" ON "member_permission_override"("memberId", "permission");
CREATE INDEX "member_permission_override_memberId_effect_idx" ON "member_permission_override"("memberId", "effect");
ALTER TABLE "member_permission_override" ADD CONSTRAINT "member_permission_override_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "upload_session" ("id" TEXT NOT NULL, "organizationId" TEXT NOT NULL, "createdById" TEXT, "purpose" TEXT NOT NULL, "objectKey" TEXT NOT NULL, "expectedMimeType" TEXT NOT NULL, "expectedSize" INTEGER NOT NULL, "expectedSha256" TEXT, "status" TEXT NOT NULL DEFAULT 'PENDING', "verifiedMimeType" TEXT, "verifiedSize" INTEGER, "verifiedSha256" TEXT, "expiresAt" TIMESTAMP(3) NOT NULL, "verifiedAt" TIMESTAMP(3), "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "upload_session_pkey" PRIMARY KEY ("id"));
CREATE UNIQUE INDEX "upload_session_objectKey_key" ON "upload_session"("objectKey");
CREATE INDEX "upload_session_organizationId_status_idx" ON "upload_session"("organizationId", "status");
CREATE INDEX "upload_session_expiresAt_idx" ON "upload_session"("expiresAt");
ALTER TABLE "upload_session" ADD CONSTRAINT "upload_session_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

INSERT INTO "organization_role" ("id", "organizationId", "key", "displayName", "description", "updatedAt")
SELECT md5(o."id" || ':' || r.key), o."id", r.key, r.display_name, r.description, CURRENT_TIMESTAMP
FROM "organization" o CROSS JOIN (VALUES ('OWNER','Owner','Full agency access and ownership controls.'),('BROKER_MANAGER','Broker manager','Runs agency operations and invites team members.'),('ADMIN_STAFF','Admin staff','Operational read access with PWA access by default.'),('FIELD_AGENT','Field agent','PWA-first access for assigned field work.'),('FINANCE_OFFICER','Finance officer','Finance and statement operations without vault access.'),('VAULT_MANAGER','Vault manager','Legal document operations subject to vault grants.'),('LANDLORD','Landlord','Scoped landlord portal access only.'),('TENANT','Tenant','Scoped tenant portal access only.')) AS r(key, display_name, description)
ON CONFLICT ("organizationId", "key") DO NOTHING;

INSERT INTO "member_role_assignment" ("id", "memberId", "roleId", "updatedAt")
SELECT md5(m."id" || ':' || r."key"), m."id", r."id", CURRENT_TIMESTAMP
FROM "member" m JOIN "organization_role" r ON r."organizationId" = m."organizationId" JOIN "user" u ON u."id" = m."userId"
WHERE r."key" = CASE WHEN m."role" = 'owner' OR u."role" = 'SUPER_ADMIN' THEN 'OWNER' WHEN m."role" = 'admin' OR u."role" = 'BROKER_MANAGER' THEN 'BROKER_MANAGER' WHEN u."role" = 'FINANCE_OFFICER' THEN 'FINANCE_OFFICER' WHEN u."role" = 'LANDLORD' THEN 'LANDLORD' WHEN u."role" = 'TENANT' THEN 'TENANT' ELSE 'FIELD_AGENT' END
ON CONFLICT ("memberId", "roleId") DO NOTHING;
