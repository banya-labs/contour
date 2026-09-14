CREATE TYPE "PipelineOutcome" AS ENUM ('WON', 'LOST');

CREATE TYPE "LeadSource" AS ENUM (
  'WEBSITE',
  'WHATSAPP',
  'CLIENT_REFERRAL',
  'WALK_IN',
  'SOCIAL_MEDIA',
  'PROPERTY_PORTAL',
  'PHONE',
  'OTHER'
);

ALTER TYPE "InquiryStatus" ADD VALUE IF NOT EXISTS 'CLOSED';
ALTER TYPE "InquiryStatus" ADD VALUE IF NOT EXISTS 'OFFER_MADE';

ALTER TABLE "inquiry"
  ADD COLUMN "outcome" "PipelineOutcome",
  ADD COLUMN "lostReason" TEXT,
  ADD COLUMN "closedAt" TIMESTAMP(3),
  ADD COLUMN "closedById" TEXT,
  ADD COLUMN "leadSource" "LeadSource" NOT NULL DEFAULT 'OTHER',
  ADD COLUMN "propertyId" TEXT,
  ADD COLUMN "dealValue" DECIMAL(14,2);

UPDATE "inquiry"
SET "outcome" = 'WON'::"PipelineOutcome", "closedAt" = COALESCE("updatedAt", "createdAt")
WHERE "status" = 'CLOSED_WON' AND "outcome" IS NULL;

UPDATE "inquiry"
SET "outcome" = 'LOST'::"PipelineOutcome",
    "lostReason" = COALESCE(NULLIF(TRIM("notes"), ''), 'Legacy closed-lost record: reason not recorded.'),
    "closedAt" = COALESCE("updatedAt", "createdAt")
WHERE "status" = 'CLOSED_LOST' AND "outcome" IS NULL;

UPDATE "inquiry"
SET "status" = 'CLOSED'
WHERE "status" IN ('CLOSED_WON', 'CLOSED_LOST');

CREATE INDEX "inquiry_organizationId_leadSource_idx" ON "inquiry"("organizationId", "leadSource");
CREATE INDEX "inquiry_propertyId_idx" ON "inquiry"("propertyId");

ALTER TABLE "inquiry"
  ADD CONSTRAINT "inquiry_propertyId_fkey"
  FOREIGN KEY ("propertyId") REFERENCES "property"("id") ON DELETE SET NULL ON UPDATE CASCADE;
