BEGIN;
-- Historical migration SQL used a long literal name that PostgreSQL truncated.
-- Prisma's generated schema uses a different 63-character name. Both identify
-- the old four-column uniqueness constraint; remove either before revisions.
DROP INDEX IF EXISTS "landlord_statement_organizationId_propertyId_statementYear__key";
DROP INDEX IF EXISTS "landlord_statement_organizationId_propertyId_statementYear_stat";

-- AlterTable
ALTER TABLE "lease" ADD COLUMN     "openingBalance" DECIMAL(12,2),
ADD COLUMN     "openingBalanceMonth" INTEGER,
ADD COLUMN     "openingBalanceVerifiedAt" TIMESTAMP(3),
ADD COLUMN     "openingBalanceVerifiedById" TEXT,
ADD COLUMN     "openingBalanceYear" INTEGER,
ADD COLUMN     "terminatedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "landlord_statement" ADD COLUMN     "revision" INTEGER NOT NULL DEFAULT 1;

-- CreateTable
CREATE TABLE "statement_payment_instruction" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "method" "PaymentMethod" NOT NULL,
    "details" JSONB NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "statement_payment_instruction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "statement_document" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "leaseId" TEXT,
    "transactionId" TEXT,
    "agentId" TEXT,
    "createdById" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "seriesKey" TEXT NOT NULL,
    "revision" INTEGER NOT NULL,
    "snapshot" JSONB NOT NULL,
    "generationInput" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "statement_document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sale_closing_request" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "inquiryId" TEXT NOT NULL,
    "input" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sale_closing_request_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "statement_payment_instruction_organizationId_active_idx" ON "statement_payment_instruction"("organizationId", "active");

-- CreateIndex
CREATE INDEX "statement_document_organizationId_createdAt_idx" ON "statement_document"("organizationId", "createdAt");

-- CreateIndex
CREATE INDEX "statement_document_leaseId_idx" ON "statement_document"("leaseId");

-- CreateIndex
CREATE INDEX "statement_document_transactionId_idx" ON "statement_document"("transactionId");

-- CreateIndex
CREATE INDEX "statement_document_organizationId_agentId_idx" ON "statement_document"("organizationId", "agentId");

-- CreateIndex
CREATE UNIQUE INDEX "statement_document_organizationId_idempotencyKey_key" ON "statement_document"("organizationId", "idempotencyKey");

-- CreateIndex
CREATE UNIQUE INDEX "statement_document_organizationId_seriesKey_revision_key" ON "statement_document"("organizationId", "seriesKey", "revision");

-- CreateIndex
CREATE INDEX "sale_closing_request_inquiryId_idx" ON "sale_closing_request"("inquiryId");

-- CreateIndex
CREATE UNIQUE INDEX "sale_closing_request_organizationId_idempotencyKey_key" ON "sale_closing_request"("organizationId", "idempotencyKey");

-- CreateIndex
CREATE UNIQUE INDEX "landlord_statement_organizationId_propertyId_statementYear__key" ON "landlord_statement"("organizationId", "propertyId", "statementYear", "statementMonth", "revision");

-- AddForeignKey
ALTER TABLE "statement_payment_instruction" ADD CONSTRAINT "statement_payment_instruction_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "statement_document" ADD CONSTRAINT "statement_document_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "statement_document" ADD CONSTRAINT "statement_document_leaseId_fkey" FOREIGN KEY ("leaseId") REFERENCES "lease"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "statement_document" ADD CONSTRAINT "statement_document_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "transaction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sale_closing_request" ADD CONSTRAINT "sale_closing_request_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sale_closing_request" ADD CONSTRAINT "sale_closing_request_inquiryId_fkey" FOREIGN KEY ("inquiryId") REFERENCES "inquiry"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

COMMIT;
