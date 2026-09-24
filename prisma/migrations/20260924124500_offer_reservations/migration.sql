ALTER TABLE "organization_offer" ADD COLUMN "reservedPaymentId" TEXT;
ALTER TABLE "organization_offer" ADD COLUMN "reservedAt" TIMESTAMP(3);
CREATE UNIQUE INDEX "organization_offer_reservedPaymentId_key" ON "organization_offer"("reservedPaymentId");
