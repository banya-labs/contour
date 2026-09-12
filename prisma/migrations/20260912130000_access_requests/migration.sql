CREATE TABLE "access_request_link" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "tokenHash" TEXT NOT NULL,
  "createdById" TEXT NOT NULL,
  "revokedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "access_request_link_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "access_request_link_organizationId_key" ON "access_request_link"("organizationId");
CREATE UNIQUE INDEX "access_request_link_tokenHash_key" ON "access_request_link"("tokenHash");
CREATE INDEX "access_request_link_createdById_idx" ON "access_request_link"("createdById");
ALTER TABLE "access_request_link" ADD CONSTRAINT "access_request_link_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "access_request_link" ADD CONSTRAINT "access_request_link_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "access_request" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "firstName" TEXT NOT NULL,
  "lastName" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "roleKey" TEXT NOT NULL DEFAULT 'FIELD_AGENT',
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "reviewedById" TEXT,
  "reviewedAt" TIMESTAMP(3),
  "declineReason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "access_request_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "access_request_organizationId_userId_key" ON "access_request"("organizationId", "userId");
CREATE INDEX "access_request_organizationId_status_createdAt_idx" ON "access_request"("organizationId", "status", "createdAt");
ALTER TABLE "access_request" ADD CONSTRAINT "access_request_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "access_request" ADD CONSTRAINT "access_request_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
