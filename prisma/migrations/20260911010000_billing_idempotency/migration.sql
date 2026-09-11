-- Create billing and webhook idempotency records.
CREATE TYPE "LencoPaymentStatus" AS ENUM ('PENDING', 'SUCCESS', 'FAILED');

CREATE TABLE "payment" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'LENCO',
    "providerTransactionId" TEXT,
    "planId" TEXT NOT NULL,
    "billingCycle" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" "Currency" NOT NULL,
    "status" "LencoPaymentStatus" NOT NULL DEFAULT 'PENDING',
    "failureReason" TEXT,
    "checkoutUrl" TEXT,
    "metadata" JSONB,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "webhook_event" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "dedupeKey" TEXT NOT NULL,
    "eventId" TEXT,
    "eventType" TEXT NOT NULL,
    "reference" TEXT,
    "payload" JSONB NOT NULL,
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "webhook_event_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "payment_reference_key" ON "payment"("reference");
CREATE UNIQUE INDEX "payment_idempotencyKey_key" ON "payment"("idempotencyKey");
CREATE INDEX "payment_organizationId_status_idx" ON "payment"("organizationId", "status");
CREATE INDEX "payment_organizationId_createdAt_idx" ON "payment"("organizationId", "createdAt");

CREATE UNIQUE INDEX "webhook_event_dedupeKey_key" ON "webhook_event"("dedupeKey");
CREATE INDEX "webhook_event_provider_reference_idx" ON "webhook_event"("provider", "reference");
CREATE INDEX "webhook_event_provider_createdAt_idx" ON "webhook_event"("provider", "createdAt");

ALTER TABLE "payment"
ADD CONSTRAINT "payment_organizationId_fkey"
FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
