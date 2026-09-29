DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'PipelineOutcome'
      AND e.enumlabel = 'CANCELLED'
  ) THEN
    ALTER TYPE "PipelineOutcome" ADD VALUE 'CANCELLED';
  END IF;
END
$$;

ALTER TABLE "Inquiry"
  ADD COLUMN IF NOT EXISTS "cancellationReason" TEXT;
