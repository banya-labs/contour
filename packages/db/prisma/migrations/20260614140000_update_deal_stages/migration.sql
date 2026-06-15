DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_enum
    JOIN pg_type ON pg_type.oid = pg_enum.enumtypid
    WHERE pg_type.typname = 'DealStage'
      AND pg_enum.enumlabel = 'new'
  ) AND NOT EXISTS (
    SELECT 1
    FROM pg_enum
    JOIN pg_type ON pg_type.oid = pg_enum.enumtypid
    WHERE pg_type.typname = 'DealStage'
      AND pg_enum.enumlabel = 'new_enquiry'
  ) THEN
    ALTER TYPE "DealStage" RENAME VALUE 'new' TO 'new_enquiry';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM pg_enum
    JOIN pg_type ON pg_type.oid = pg_enum.enumtypid
    WHERE pg_type.typname = 'DealStage'
      AND pg_enum.enumlabel = 'viewing'
  ) AND NOT EXISTS (
    SELECT 1
    FROM pg_enum
    JOIN pg_type ON pg_type.oid = pg_enum.enumtypid
    WHERE pg_type.typname = 'DealStage'
      AND pg_enum.enumlabel = 'site_visit'
  ) THEN
    ALTER TYPE "DealStage" RENAME VALUE 'viewing' TO 'site_visit';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM pg_enum
    JOIN pg_type ON pg_type.oid = pg_enum.enumtypid
    WHERE pg_type.typname = 'DealStage'
      AND pg_enum.enumlabel = 'contract'
  ) AND NOT EXISTS (
    SELECT 1
    FROM pg_enum
    JOIN pg_type ON pg_type.oid = pg_enum.enumtypid
    WHERE pg_type.typname = 'DealStage'
      AND pg_enum.enumlabel = 'closing'
  ) THEN
    ALTER TYPE "DealStage" RENAME VALUE 'contract' TO 'closing';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM pg_enum
    JOIN pg_type ON pg_type.oid = pg_enum.enumtypid
    WHERE pg_type.typname = 'DealStage'
      AND pg_enum.enumlabel = 'closed_won'
  ) AND NOT EXISTS (
    SELECT 1
    FROM pg_enum
    JOIN pg_type ON pg_type.oid = pg_enum.enumtypid
    WHERE pg_type.typname = 'DealStage'
      AND pg_enum.enumlabel = 'won'
  ) THEN
    ALTER TYPE "DealStage" RENAME VALUE 'closed_won' TO 'won';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM pg_enum
    JOIN pg_type ON pg_type.oid = pg_enum.enumtypid
    WHERE pg_type.typname = 'DealStage'
      AND pg_enum.enumlabel = 'closed_lost'
  ) AND NOT EXISTS (
    SELECT 1
    FROM pg_enum
    JOIN pg_type ON pg_type.oid = pg_enum.enumtypid
    WHERE pg_type.typname = 'DealStage'
      AND pg_enum.enumlabel = 'lost'
  ) THEN
    ALTER TYPE "DealStage" RENAME VALUE 'closed_lost' TO 'lost';
  END IF;
END $$;

ALTER TYPE "DealStage" ADD VALUE IF NOT EXISTS 'qualified' AFTER 'new_enquiry';
ALTER TYPE "DealStage" ADD VALUE IF NOT EXISTS 'offer_made' AFTER 'site_visit';
ALTER TYPE "DealStage" ADD VALUE IF NOT EXISTS 'document_check' AFTER 'negotiating';
