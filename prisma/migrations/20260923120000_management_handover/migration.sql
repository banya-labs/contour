ALTER TYPE "InquiryStatus" ADD VALUE IF NOT EXISTS 'MANAGEMENT_HANDOVER';

ALTER TABLE "inquiry"
  ADD COLUMN "managementCloseRequestedAt" TIMESTAMP(3),
  ADD COLUMN "managementCloseRequestedById" TEXT;

CREATE INDEX "inquiry_managementCloseRequestedAt_idx" ON "inquiry"("managementCloseRequestedAt");

ALTER TABLE "inquiry"
  ADD CONSTRAINT "inquiry_managementCloseRequestedById_fkey"
  FOREIGN KEY ("managementCloseRequestedById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
