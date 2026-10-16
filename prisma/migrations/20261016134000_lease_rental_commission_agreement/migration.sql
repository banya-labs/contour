-- Freeze the approved rental-property commission terms on each lease.
-- Property configuration edits therefore affect future leases only.
CREATE TABLE "lease_rental_commission_agreement" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "leaseId" TEXT NOT NULL,
    "sourceConfigId" TEXT,
    "sourceConfigRevision" INTEGER,
    "mode" "RentalAgencyCommissionMode" NOT NULL,
    "basis" "RentalAgencyCommissionBasis",
    "fixedAmount" DECIMAL(12,2),
    "monthsOfRent" DECIMAL(5,2),
    "percentage" DECIMAL(5,2),
    "durationMonths" INTEGER,
    "untilLeaseEnd" BOOLEAN NOT NULL DEFAULT false,
    "currency" "Currency" NOT NULL,
    "frozenMonthlyRent" DECIMAL(12,2) NOT NULL,
    "targetAmount" DECIMAL(12,2),
    "effectiveFrom" DATE NOT NULL,
    "effectiveUntil" DATE,
    "approvedById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lease_rental_commission_agreement_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "lease_rental_commission_agreement_leaseId_key"
    ON "lease_rental_commission_agreement"("leaseId");
CREATE INDEX "lease_rental_commission_agreement_organizationId_leaseId_idx"
    ON "lease_rental_commission_agreement"("organizationId", "leaseId");
CREATE INDEX "lease_rental_commission_agreement_organizationId_sourceConfigId_idx"
    ON "lease_rental_commission_agreement"("organizationId", "sourceConfigId");

ALTER TABLE "lease_rental_commission_agreement"
    ADD CONSTRAINT "lease_rental_commission_agreement_organizationId_fkey"
    FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "lease_rental_commission_agreement"
    ADD CONSTRAINT "lease_rental_commission_agreement_leaseId_fkey"
    FOREIGN KEY ("leaseId") REFERENCES "lease"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "lease_rental_commission_agreement"
    ADD CONSTRAINT "lease_rental_commission_agreement_sourceConfigId_fkey"
    FOREIGN KEY ("sourceConfigId") REFERENCES "property_rental_commission_config"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "lease_rental_commission_agreement"
    ADD CONSTRAINT "lease_rental_commission_agreement_approvedById_fkey"
    FOREIGN KEY ("approvedById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
