ALTER TABLE "lease" ADD COLUMN "inquiryId" TEXT;
CREATE UNIQUE INDEX "lease_inquiryId_key" ON "lease"("inquiryId");
ALTER TABLE "lease" ADD CONSTRAINT "lease_inquiryId_fkey" FOREIGN KEY ("inquiryId") REFERENCES "inquiry"("id") ON DELETE SET NULL ON UPDATE CASCADE;
