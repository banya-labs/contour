-- Development-only rollback. Never remove approved commission history from a
-- database that has been used for financial records; roll forward instead.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM "property_rental_commission_config" WHERE "status" = 'APPROVED') THEN
    RAISE EXCEPTION 'Refusing rollback: approved rental commission history exists';
  END IF;
  DROP TABLE IF EXISTS "property_rental_commission_config";
  DROP TYPE IF EXISTS "RentalAgencyCommissionStatus";
  DROP TYPE IF EXISTS "RentalAgencyCommissionBasis";
  DROP TYPE IF EXISTS "RentalAgencyCommissionMode";
END $$;
