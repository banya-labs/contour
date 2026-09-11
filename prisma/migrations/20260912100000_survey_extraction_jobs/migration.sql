CREATE TABLE "survey_extraction_job" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "propertyId" TEXT NOT NULL,
  "sourceDocumentId" TEXT NOT NULL,
  "idempotencyKey" TEXT,
  "status" TEXT NOT NULL DEFAULT 'QUEUED',
  "engine" TEXT,
  "engineVersion" TEXT,
  "pageCount" INTEGER,
  "processedPages" INTEGER NOT NULL DEFAULT 0,
  "rawOcrObjectKey" TEXT,
  "extractionJson" JSONB,
  "errorCode" TEXT,
  "errorMessage" TEXT,
  "createdById" TEXT NOT NULL,
  "reviewedById" TEXT,
  "reviewedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "survey_extraction_job_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "survey_extraction_job_organizationId_status_idx" ON "survey_extraction_job"("organizationId", "status");
CREATE INDEX "survey_extraction_job_organizationId_propertyId_idx" ON "survey_extraction_job"("organizationId", "propertyId");
CREATE INDEX "survey_extraction_job_sourceDocumentId_idx" ON "survey_extraction_job"("sourceDocumentId");
CREATE UNIQUE INDEX "survey_extraction_job_organizationId_idempotencyKey_key" ON "survey_extraction_job"("organizationId", "idempotencyKey");
ALTER TABLE "survey_extraction_job" ADD CONSTRAINT "survey_extraction_job_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "survey_extraction_job" ADD CONSTRAINT "survey_extraction_job_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "property"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "survey_extraction_job" ADD CONSTRAINT "survey_extraction_job_sourceDocumentId_fkey" FOREIGN KEY ("sourceDocumentId") REFERENCES "vault_document"("id") ON DELETE CASCADE ON UPDATE CASCADE;
