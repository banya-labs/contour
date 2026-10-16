-- Purchase-only installment ledger. Additive migration; do not apply to production without review.
CREATE TYPE "SalePaymentPlanStatus" AS ENUM ('DRAFT','ACTIVE','COMPLETED','CANCELLED');
CREATE TYPE "SaleInstallmentKind" AS ENUM ('DEPOSIT','INSTALLMENT','FULL_PAYMENT');
CREATE TYPE "SalePaymentEventKind" AS ENUM ('RECEIPT','CONFIRM','REJECT','REVERSAL','REFUND');
CREATE TYPE "SalePaymentCustodian" AS ENUM ('AGENCY','SELLER','CONVEYANCER');

CREATE TABLE "sale_payment_plan" (
  "id" TEXT NOT NULL, "organizationId" TEXT NOT NULL, "inquiryId" TEXT NOT NULL,
  "transactionId" TEXT, "buyerContactId" TEXT NOT NULL, "price" DECIMAL(14,2) NOT NULL,
  "currency" "Currency" NOT NULL, "status" "SalePaymentPlanStatus" NOT NULL DEFAULT 'DRAFT',
  "currentRevision" INTEGER NOT NULL DEFAULT 0, "version" INTEGER NOT NULL DEFAULT 1,
  "approvedById" TEXT, "approvedAt" TIMESTAMP(3), "evidenceReference" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "sale_payment_plan_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "sale_payment_plan_inquiryId_key" ON "sale_payment_plan"("inquiryId");
CREATE UNIQUE INDEX "sale_payment_plan_transactionId_key" ON "sale_payment_plan"("transactionId");
CREATE INDEX "sale_payment_plan_organizationId_status_updatedAt_idx" ON "sale_payment_plan"("organizationId","status","updatedAt");
CREATE INDEX "sale_payment_plan_organizationId_transactionId_idx" ON "sale_payment_plan"("organizationId","transactionId");

CREATE TABLE "sale_plan_revision" (
  "id" TEXT NOT NULL, "organizationId" TEXT NOT NULL, "planId" TEXT NOT NULL,
  "revision" INTEGER NOT NULL, "effectiveDate" DATE NOT NULL, "reason" VARCHAR(500),
  "approvedById" TEXT, "approvedAt" TIMESTAMP(3), "supersedesId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "sale_plan_revision_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "sale_plan_revision_org_plan_revision_key" ON "sale_plan_revision"("organizationId","planId","revision");
CREATE INDEX "sale_plan_revision_org_plan_effective_idx" ON "sale_plan_revision"("organizationId","planId","effectiveDate");

CREATE TABLE "sale_installment" (
  "id" TEXT NOT NULL, "organizationId" TEXT NOT NULL, "revisionId" TEXT NOT NULL,
  "sequence" INTEGER NOT NULL, "kind" "SaleInstallmentKind" NOT NULL,
  "amount" DECIMAL(14,2) NOT NULL, "dueDate" DATE NOT NULL,
  "carriedPaidAmount" DECIMAL(14,2) NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "sale_installment_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "sale_installment_org_revision_sequence_key" ON "sale_installment"("organizationId","revisionId","sequence");
CREATE INDEX "sale_installment_org_dueDate_idx" ON "sale_installment"("organizationId","dueDate");

CREATE TABLE "sale_payment_event" (
  "id" TEXT NOT NULL, "organizationId" TEXT NOT NULL, "planId" TEXT NOT NULL,
  "kind" "SalePaymentEventKind" NOT NULL, "amount" DECIMAL(14,2) NOT NULL,
  "currency" "Currency" NOT NULL, "paymentDate" DATE NOT NULL, "postedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "custodian" "SalePaymentCustodian" NOT NULL, "paymentMethod" "PaymentMethod",
  "referenceNumber" TEXT, "evidenceReference" TEXT, "sourceEventId" TEXT,
  "idempotencyKey" TEXT NOT NULL, "payloadHash" TEXT NOT NULL, "recordedById" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "sale_payment_event_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "sale_payment_event_org_idempotency_key" ON "sale_payment_event"("organizationId","idempotencyKey");
CREATE INDEX "sale_payment_event_org_plan_posted_idx" ON "sale_payment_event"("organizationId","planId","postedAt","id");
CREATE INDEX "sale_payment_event_org_source_idx" ON "sale_payment_event"("organizationId","sourceEventId");

CREATE TABLE "sale_payment_allocation" (
  "id" TEXT NOT NULL, "organizationId" TEXT NOT NULL, "eventId" TEXT NOT NULL,
  "installmentId" TEXT NOT NULL, "amount" DECIMAL(14,2) NOT NULL, "reversedAllocationId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "sale_payment_allocation_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "sale_payment_allocation_org_event_installment_key" ON "sale_payment_allocation"("organizationId","eventId","installmentId");
CREATE INDEX "sale_payment_allocation_org_installment_created_idx" ON "sale_payment_allocation"("organizationId","installmentId","createdAt");

ALTER TABLE "sale_payment_plan" ADD CONSTRAINT "sale_payment_plan_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "sale_payment_plan" ADD CONSTRAINT "sale_payment_plan_inquiryId_fkey" FOREIGN KEY ("inquiryId") REFERENCES "inquiry"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "sale_payment_plan" ADD CONSTRAINT "sale_payment_plan_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "transaction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "sale_payment_plan" ADD CONSTRAINT "sale_payment_plan_buyerContactId_fkey" FOREIGN KEY ("buyerContactId") REFERENCES "contact"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "sale_plan_revision" ADD CONSTRAINT "sale_plan_revision_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "sale_plan_revision" ADD CONSTRAINT "sale_plan_revision_planId_fkey" FOREIGN KEY ("planId") REFERENCES "sale_payment_plan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "sale_plan_revision" ADD CONSTRAINT "sale_plan_revision_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "sale_installment" ADD CONSTRAINT "sale_installment_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "sale_installment" ADD CONSTRAINT "sale_installment_revisionId_fkey" FOREIGN KEY ("revisionId") REFERENCES "sale_plan_revision"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "sale_payment_event" ADD CONSTRAINT "sale_payment_event_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "sale_payment_event" ADD CONSTRAINT "sale_payment_event_planId_fkey" FOREIGN KEY ("planId") REFERENCES "sale_payment_plan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "sale_payment_event" ADD CONSTRAINT "sale_payment_event_recordedById_fkey" FOREIGN KEY ("recordedById") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "sale_payment_allocation" ADD CONSTRAINT "sale_payment_allocation_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "sale_payment_allocation" ADD CONSTRAINT "sale_payment_allocation_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "sale_payment_event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "sale_payment_allocation" ADD CONSTRAINT "sale_payment_allocation_installmentId_fkey" FOREIGN KEY ("installmentId") REFERENCES "sale_installment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
