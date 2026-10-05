-- Manual development rollback only. Never run against production without approval.
-- Refuse to discard financial history or payment instructions. After meaningful
-- use, roll forward with a corrective migration instead of dropping these fields.
BEGIN;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM "sale_closing_request") OR EXISTS (SELECT 1 FROM "statement_document")
    OR EXISTS (SELECT 1 FROM "statement_payment_instruction")
    OR EXISTS (SELECT 1 FROM "lease" WHERE "openingBalanceVerifiedAt" IS NOT NULL OR "terminatedAt" IS NOT NULL)
    OR EXISTS (SELECT 1 FROM "landlord_statement" WHERE "revision" > 1) THEN
    RAISE EXCEPTION 'Statement data exists: preserve it and use a forward corrective migration';
  END IF;
END $$;
DROP TABLE "sale_closing_request";
DROP TABLE "statement_document";
DROP TABLE "statement_payment_instruction";
ALTER TABLE "lease" DROP COLUMN "openingBalance", DROP COLUMN "openingBalanceMonth", DROP COLUMN "openingBalanceYear", DROP COLUMN "openingBalanceVerifiedAt", DROP COLUMN "openingBalanceVerifiedById", DROP COLUMN "terminatedAt";
DROP INDEX "landlord_statement_organizationId_propertyId_statementYear__key";
ALTER TABLE "landlord_statement" DROP COLUMN "revision";
CREATE UNIQUE INDEX "landlord_statement_organizationId_propertyId_statementYear__key" ON "landlord_statement"("organizationId", "propertyId", "statementYear", "statementMonth");
COMMIT;
