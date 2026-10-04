CREATE TABLE "ai_insight_snapshot" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "periodFrom" TIMESTAMP(3) NOT NULL,
    "periodTo" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL,
    "insights" JSONB,
    "errorMessage" TEXT,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_insight_snapshot_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ai_insight_snapshot_organizationId_periodFrom_periodTo_key" ON "ai_insight_snapshot"("organizationId", "periodFrom", "periodTo");
CREATE INDEX "ai_insight_snapshot_organizationId_updatedAt_idx" ON "ai_insight_snapshot"("organizationId", "updatedAt");
ALTER TABLE "ai_insight_snapshot" ADD CONSTRAINT "ai_insight_snapshot_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
