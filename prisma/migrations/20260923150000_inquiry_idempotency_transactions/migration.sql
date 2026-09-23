ALTER TABLE "inquiry" ADD COLUMN "idempotencyKey" TEXT;
CREATE UNIQUE INDEX "inquiry_organizationId_idempotencyKey_key" ON "inquiry"("organizationId", "idempotencyKey");

ALTER TABLE "transaction" ADD COLUMN "inquiryId" TEXT;
CREATE UNIQUE INDEX "transaction_inquiryId_key" ON "transaction"("inquiryId");
ALTER TABLE "transaction" ADD CONSTRAINT "transaction_inquiryId_fkey" FOREIGN KEY ("inquiryId") REFERENCES "inquiry"("id") ON DELETE SET NULL ON UPDATE CASCADE;
