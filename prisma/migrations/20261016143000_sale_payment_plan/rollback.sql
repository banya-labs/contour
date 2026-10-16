-- Guarded rollback: run only after confirming all dependent application code and data are removed.
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'sale_payment_plan') THEN
    RAISE EXCEPTION 'Rollback blocked: sale payment history exists or table is still installed; use a reviewed archival migration.';
  END IF;
END $$;
