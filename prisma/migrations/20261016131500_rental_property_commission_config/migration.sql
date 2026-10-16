-- Rental agency commission is configured on the rental property and versioned
-- so active leases can retain an immutable snapshot of the approved terms.
CREATE TYPE "RentalAgencyCommissionMode" AS ENUM ('NONE', 'UPFRONT', 'PERCENTAGE');
CREATE TYPE "RentalAgencyCommissionBasis" AS ENUM ('FIXED_AMOUNT', 'MONTHS_OF_RENT');
CREATE TYPE "RentalAgencyCommissionStatus" AS ENUM ('DRAFT', 'APPROVED', 'SUPERSEDED');

CREATE TABLE "property_rental_commission_config" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "revision" INTEGER NOT NULL DEFAULT 1,
    "status" "RentalAgencyCommissionStatus" NOT NULL DEFAULT 'DRAFT',
    "mode" "RentalAgencyCommissionMode" NOT NULL,
    "basis" "RentalAgencyCommissionBasis",
    "fixedAmount" DECIMAL(12,2),
    "monthsOfRent" DECIMAL(5,2),
    "percentage" DECIMAL(5,2),
    "durationMonths" INTEGER,
    "untilLeaseEnd" BOOLEAN NOT NULL DEFAULT false,
    "currency" "Currency" NOT NULL DEFAULT 'ZMW',
    "effectiveFrom" DATE NOT NULL,
    "evidenceReference" TEXT,
    "approvedById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "property_rental_commission_config_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "property_rental_commission_config_organizationId_propertyId_revision_key"
    ON "property_rental_commission_config"("organizationId", "propertyId", "revision");
CREATE INDEX "property_rental_commission_config_organizationId_propertyId_status_idx"
    ON "property_rental_commission_config"("organizationId", "propertyId", "status");
CREATE INDEX "property_rental_commission_config_organizationId_effectiveFrom_idx"
    ON "property_rental_commission_config"("organizationId", "effectiveFrom");

ALTER TABLE "property_rental_commission_config"
    ADD CONSTRAINT "property_rental_commission_config_organizationId_fkey"
    FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "property_rental_commission_config"
    ADD CONSTRAINT "property_rental_commission_config_propertyId_fkey"
    FOREIGN KEY ("propertyId") REFERENCES "property"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "property_rental_commission_config"
    ADD CONSTRAINT "property_rental_commission_config_approvedById_fkey"
    FOREIGN KEY ("approvedById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
