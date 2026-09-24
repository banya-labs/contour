ALTER TABLE "landlord_statement"
  ADD COLUMN "rentDue" DECIMAL(12,2) NOT NULL DEFAULT 0.0,
  ADD COLUMN "arrearsBroughtForward" DECIMAL(12,2) NOT NULL DEFAULT 0.0,
  ADD COLUMN "arrearsClosing" DECIMAL(12,2) NOT NULL DEFAULT 0.0;

CREATE UNIQUE INDEX "landlord_statement_organizationId_propertyId_statementYear_statementMonth_key"
  ON "landlord_statement"("organizationId", "propertyId", "statementYear", "statementMonth");
