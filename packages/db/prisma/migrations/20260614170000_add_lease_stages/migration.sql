CREATE TYPE "LeaseStage" AS ENUM (
  'enquiry_received',
  'viewing_scheduled',
  'viewing_completed',
  'application_received',
  'screening',
  'lease_draft',
  'active_tenancy',
  'closed'
);

ALTER TABLE "rental_leases"
  ADD COLUMN "lease_stage" "LeaseStage" NOT NULL DEFAULT 'enquiry_received';

UPDATE "rental_leases"
SET "lease_stage" = CASE
  WHEN "lease_name" LIKE 'Lusaka West 14%' THEN 'enquiry_received'::"LeaseStage"
  WHEN "lease_name" LIKE 'Woodlands 09%' THEN 'viewing_scheduled'::"LeaseStage"
  WHEN "lease_name" LIKE 'Ndola North 24%' THEN 'viewing_completed'::"LeaseStage"
  WHEN "lease_name" LIKE 'Livingstone Plot 88%' THEN 'application_received'::"LeaseStage"
  WHEN "lease_name" LIKE 'Chalala Ridge 07%' THEN 'screening'::"LeaseStage"
  WHEN "lease_name" LIKE 'Kabulonga Gardens 12%' THEN 'lease_draft'::"LeaseStage"
  WHEN "lease_name" LIKE 'Kitwe Central 31%' THEN 'active_tenancy'::"LeaseStage"
  WHEN "lease_name" LIKE 'Kabwe Hill 18%' THEN 'closed'::"LeaseStage"
  ELSE "lease_stage"
END;
