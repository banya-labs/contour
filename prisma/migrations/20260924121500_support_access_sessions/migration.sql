CREATE TABLE "support_access_session" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "startedByUserId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "mode" TEXT NOT NULL DEFAULT 'VIEW_ONLY',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "support_access_session_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "support_access_session_organizationId_expiresAt_idx" ON "support_access_session"("organizationId", "expiresAt");
CREATE INDEX "support_access_session_startedByUserId_createdAt_idx" ON "support_access_session"("startedByUserId", "createdAt");
ALTER TABLE "support_access_session" ADD CONSTRAINT "support_access_session_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "support_access_session" ADD CONSTRAINT "support_access_session_startedByUserId_fkey" FOREIGN KEY ("startedByUserId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
