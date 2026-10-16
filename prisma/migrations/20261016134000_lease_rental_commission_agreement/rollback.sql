-- Development-only rollback. Preserve lease commission history after use.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM "lease_rental_commission_agreement") THEN
    RAISE EXCEPTION 'Refusing rollback: lease commission snapshots exist';
  END IF;
  DROP TABLE IF EXISTS "lease_rental_commission_agreement";
END $$;
