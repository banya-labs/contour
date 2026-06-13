-- Canonical Contour schema expansion
-- Additive migration: preserves current app tables/columns and adds the full
-- product schema required by the Notion canonical DDL.

CREATE TYPE "ListingType" AS ENUM ('property', 'vacant_land');
CREATE TYPE "AvailabilityStatus" AS ENUM ('available', 'reserved', 'under_maintenance', 'rented', 'sold');
CREATE TYPE "CurrencyCode" AS ENUM ('ZMW', 'USD');
CREATE TYPE "ZoningType" AS ENUM ('residential', 'commercial', 'agricultural', 'mixed', 'other');
CREATE TYPE "LandDesignation" AS ENUM ('state_land', 'customary_land');
CREATE TYPE "ClientSegment" AS ENUM ('prospective_buyer', 'active_tenant', 'land_owner_seller', 'past_lead');
CREATE TYPE "InteractionType" AS ENUM ('call', 'site_visit', 'whatsapp', 'email', 'negotiation', 'other');
CREATE TYPE "CanonicalDealType" AS ENUM ('sale', 'rental', 'installment');
CREATE TYPE "PlanFrequency" AS ENUM ('monthly', 'quarterly', 'custom');
CREATE TYPE "PlanStatus" AS ENUM ('active', 'completed', 'cancelled');
CREATE TYPE "ScheduleItemStatus" AS ENUM ('due', 'paid', 'overdue');
CREATE TYPE "LeaseStatus" AS ENUM ('active', 'ended');
CREATE TYPE "DocumentCategory" AS ENUM ('title_deed', 'offer_letter', 'survey_diagram', 'site_plan', 'contract_of_sale', 'lease_agreement', 'other');
CREATE TYPE "InsightSeverity" AS ENUM ('info', 'warn', 'critical');
CREATE TYPE "InsightStatus" AS ENUM ('open', 'acknowledged', 'resolved', 'dismissed');
CREATE TYPE "WorkStatus" AS ENUM ('to_do', 'doing', 'done', 'blocked');
CREATE TYPE "WorkPriority" AS ENUM ('low', 'medium', 'high');
CREATE TYPE "UtilityType" AS ENUM ('water', 'electricity', 'sewer', 'internet');

ALTER TABLE "listings"
  ADD COLUMN IF NOT EXISTS "listing_code" text,
  ADD COLUMN IF NOT EXISTS "type" "ListingType",
  ADD COLUMN IF NOT EXISTS "availability_status" "AvailabilityStatus",
  ADD COLUMN IF NOT EXISTS "location_area" text,
  ADD COLUMN IF NOT EXISTS "address" text,
  ADD COLUMN IF NOT EXISTS "asking_price_amount" numeric(14,2),
  ADD COLUMN IF NOT EXISTS "asking_price_currency" "CurrencyCode",
  ADD COLUMN IF NOT EXISTS "bedrooms" integer,
  ADD COLUMN IF NOT EXISTS "bathrooms" integer,
  ADD COLUMN IF NOT EXISTS "land_size_ha" numeric(12,4),
  ADD COLUMN IF NOT EXISTS "zoning" "ZoningType",
  ADD COLUMN IF NOT EXISTS "land_designation" "LandDesignation",
  ADD COLUMN IF NOT EXISTS "assigned_agent_user_id" uuid,
  ADD COLUMN IF NOT EXISTS "internal_notes" text,
  ADD COLUMN IF NOT EXISTS "last_modified_by_user_id" uuid,
  ADD COLUMN IF NOT EXISTS "deleted_at" timestamptz;

ALTER TABLE "clients"
  ADD COLUMN IF NOT EXISTS "segment" "ClientSegment",
  ADD COLUMN IF NOT EXISTS "nrc_number" text,
  ADD COLUMN IF NOT EXISTS "passport_number" text,
  ADD COLUMN IF NOT EXISTS "tpin" text,
  ADD COLUMN IF NOT EXISTS "nationality" text,
  ADD COLUMN IF NOT EXISTS "budget_min_amount" numeric(14,2),
  ADD COLUMN IF NOT EXISTS "budget_max_amount" numeric(14,2),
  ADD COLUMN IF NOT EXISTS "budget_currency" "CurrencyCode",
  ADD COLUMN IF NOT EXISTS "notes" text,
  ADD COLUMN IF NOT EXISTS "last_modified_by_user_id" uuid,
  ADD COLUMN IF NOT EXISTS "deleted_at" timestamptz;

ALTER TABLE "deals"
  ADD COLUMN IF NOT EXISTS "deal_name" text,
  ADD COLUMN IF NOT EXISTS "deal_type" "CanonicalDealType",
  ADD COLUMN IF NOT EXISTS "offer_amount" numeric(14,2),
  ADD COLUMN IF NOT EXISTS "offer_currency" "CurrencyCode",
  ADD COLUMN IF NOT EXISTS "expected_close_at" timestamptz,
  ADD COLUMN IF NOT EXISTS "agent_user_id" uuid,
  ADD COLUMN IF NOT EXISTS "commission_percent" numeric(5,2),
  ADD COLUMN IF NOT EXISTS "commission_amount" numeric(14,2),
  ADD COLUMN IF NOT EXISTS "last_modified_by_user_id" uuid,
  ADD COLUMN IF NOT EXISTS "deleted_at" timestamptz;

ALTER TABLE "work_items"
  ADD COLUMN IF NOT EXISTS "work_type" text,
  ADD COLUMN IF NOT EXISTS "description" text,
  ADD COLUMN IF NOT EXISTS "priority" "WorkPriority",
  ADD COLUMN IF NOT EXISTS "owner_user_id" uuid,
  ADD COLUMN IF NOT EXISTS "related_insight_id" uuid,
  ADD COLUMN IF NOT EXISTS "entity_type" "EntityType",
  ADD COLUMN IF NOT EXISTS "entity_id" uuid,
  ADD COLUMN IF NOT EXISTS "completed_at" timestamptz,
  ADD COLUMN IF NOT EXISTS "last_modified_by_user_id" uuid,
  ADD COLUMN IF NOT EXISTS "deleted_at" timestamptz;

CREATE TABLE IF NOT EXISTS "listing_utilities" (
  "listing_id" uuid NOT NULL REFERENCES "listings"("id") ON DELETE CASCADE,
  "utility" "UtilityType" NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY ("listing_id", "utility")
);

CREATE TABLE IF NOT EXISTS "client_preferred_locations" (
  "client_id" uuid NOT NULL REFERENCES "clients"("id") ON DELETE CASCADE,
  "location_area" text NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY ("client_id", "location_area")
);

CREATE TABLE IF NOT EXISTS "deal_listings" (
  "deal_id" uuid NOT NULL REFERENCES "deals"("id") ON DELETE CASCADE,
  "listing_id" uuid NOT NULL REFERENCES "listings"("id") ON DELETE RESTRICT,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY ("deal_id", "listing_id")
);

CREATE TABLE IF NOT EXISTS "interactions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "summary" text NOT NULL,
  "client_id" uuid NOT NULL REFERENCES "clients"("id") ON DELETE RESTRICT,
  "listing_id" uuid REFERENCES "listings"("id") ON DELETE SET NULL,
  "deal_id" uuid REFERENCES "deals"("id") ON DELETE SET NULL,
  "type" "InteractionType" NOT NULL,
  "outcome" text,
  "interaction_at" timestamptz NOT NULL,
  "next_step" text,
  "next_follow_up_at" timestamptz,
  "agent_user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE RESTRICT,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  "deleted_at" timestamptz
);

CREATE TABLE IF NOT EXISTS "payment_plans" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "plan_name" text NOT NULL,
  "deal_id" uuid NOT NULL REFERENCES "deals"("id") ON DELETE RESTRICT,
  "client_id" uuid NOT NULL REFERENCES "clients"("id") ON DELETE RESTRICT,
  "principal_amount" numeric(14,2) NOT NULL,
  "down_payment_amount" numeric(14,2) NOT NULL,
  "currency" "CurrencyCode" NOT NULL,
  "frequency" "PlanFrequency" NOT NULL,
  "periods" integer NOT NULL,
  "start_date" date NOT NULL,
  "status" "PlanStatus" NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  "last_modified_by_user_id" uuid,
  "deleted_at" timestamptz
);

CREATE TABLE IF NOT EXISTS "installment_schedule_items" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "payment_plan_id" uuid NOT NULL REFERENCES "payment_plans"("id") ON DELETE CASCADE,
  "installment_number" integer NOT NULL,
  "due_date" date NOT NULL,
  "amount_due" numeric(14,2) NOT NULL,
  "amount_paid" numeric(14,2) NOT NULL DEFAULT 0,
  "paid_at" timestamptz,
  "status" "ScheduleItemStatus" NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "installment_schedule_items_unique_number" UNIQUE ("payment_plan_id", "installment_number")
);

CREATE TABLE IF NOT EXISTS "rental_leases" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "lease_name" text NOT NULL,
  "tenant_client_id" uuid NOT NULL REFERENCES "clients"("id") ON DELETE RESTRICT,
  "listing_id" uuid NOT NULL REFERENCES "listings"("id") ON DELETE RESTRICT,
  "start_date" date NOT NULL,
  "end_date" date,
  "rent_amount" numeric(14,2) NOT NULL,
  "currency" "CurrencyCode" NOT NULL,
  "billing_day" integer NOT NULL,
  "deposit_amount" numeric(14,2),
  "status" "LeaseStatus" NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  "last_modified_by_user_id" uuid,
  "deleted_at" timestamptz,
  CONSTRAINT "rental_leases_billing_day_range" CHECK ("billing_day" >= 1 AND "billing_day" <= 28)
);

CREATE TABLE IF NOT EXISTS "rental_charges" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "lease_id" uuid NOT NULL REFERENCES "rental_leases"("id") ON DELETE CASCADE,
  "period_month" date NOT NULL,
  "due_date" date NOT NULL,
  "amount" numeric(14,2) NOT NULL,
  "currency" "CurrencyCode" NOT NULL,
  "status" "ScheduleItemStatus" NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "rental_charges_unique_month" UNIQUE ("lease_id", "period_month")
);

CREATE TABLE IF NOT EXISTS "payments" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "receipt_number" text UNIQUE,
  "client_id" uuid NOT NULL REFERENCES "clients"("id") ON DELETE RESTRICT,
  "deal_id" uuid REFERENCES "deals"("id") ON DELETE SET NULL,
  "payment_plan_id" uuid REFERENCES "payment_plans"("id") ON DELETE SET NULL,
  "installment_schedule_item_id" uuid REFERENCES "installment_schedule_items"("id") ON DELETE SET NULL,
  "lease_id" uuid REFERENCES "rental_leases"("id") ON DELETE SET NULL,
  "rental_charge_id" uuid REFERENCES "rental_charges"("id") ON DELETE SET NULL,
  "paid_at" timestamptz NOT NULL,
  "amount" numeric(14,2) NOT NULL,
  "currency" "CurrencyCode" NOT NULL,
  "method" text,
  "notes" text,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  "recorded_by_user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS "documents" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "document_name" text NOT NULL,
  "category" "DocumentCategory" NOT NULL,
  "listing_id" uuid REFERENCES "listings"("id") ON DELETE SET NULL,
  "client_id" uuid REFERENCES "clients"("id") ON DELETE SET NULL,
  "deal_id" uuid REFERENCES "deals"("id") ON DELETE SET NULL,
  "blob_url" text NOT NULL,
  "blob_key" text,
  "mime_type" text,
  "file_size_bytes" bigint,
  "is_verified" boolean NOT NULL DEFAULT false,
  "verified_at" timestamptz,
  "verified_by_user_id" uuid REFERENCES "users"("id") ON DELETE SET NULL,
  "notes" text,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  "uploaded_by_user_id" uuid REFERENCES "users"("id") ON DELETE SET NULL,
  "deleted_at" timestamptz
);

CREATE TABLE IF NOT EXISTS "sync_devices" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "device_id" text NOT NULL UNIQUE,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE RESTRICT,
  "device_type" text NOT NULL,
  "app_version" text,
  "last_seen_at" timestamptz,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "sync_state" (
  "device_id" uuid PRIMARY KEY REFERENCES "sync_devices"("id") ON DELETE CASCADE,
  "last_sync_token" text,
  "last_sync_at" timestamptz,
  "last_error_code" text,
  "last_error_at" timestamptz,
  "consecutive_failures" integer NOT NULL DEFAULT 0,
  "updated_at" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "insights" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "insight_type" text NOT NULL,
  "severity" "InsightSeverity" NOT NULL,
  "title" text NOT NULL,
  "description" text,
  "owner_user_id" uuid REFERENCES "users"("id") ON DELETE SET NULL,
  "status" "InsightStatus" NOT NULL,
  "entity_type" "EntityType",
  "entity_id" uuid,
  "evidence" jsonb,
  "recommended_action" text,
  "due_at" timestamptz,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE "events" ALTER COLUMN "metadata" TYPE jsonb USING "metadata"::jsonb;

CREATE INDEX IF NOT EXISTS "listings_listing_code_idx" ON "listings" ("listing_code");
CREATE INDEX IF NOT EXISTS "listings_type_idx" ON "listings" ("type");
CREATE INDEX IF NOT EXISTS "listings_availability_status_idx" ON "listings" ("availability_status");
CREATE INDEX IF NOT EXISTS "listings_location_area_idx" ON "listings" ("location_area");
CREATE INDEX IF NOT EXISTS "listings_assigned_agent_user_id_idx" ON "listings" ("assigned_agent_user_id");
CREATE INDEX IF NOT EXISTS "listings_deleted_at_idx" ON "listings" ("deleted_at") WHERE "deleted_at" IS NULL;

CREATE INDEX IF NOT EXISTS "clients_segment_idx" ON "clients" ("segment");
CREATE INDEX IF NOT EXISTS "clients_tpin_idx" ON "clients" ("tpin");
CREATE INDEX IF NOT EXISTS "clients_nrc_number_idx" ON "clients" ("nrc_number");
CREATE INDEX IF NOT EXISTS "clients_deleted_at_idx" ON "clients" ("deleted_at") WHERE "deleted_at" IS NULL;

CREATE INDEX IF NOT EXISTS "deals_deal_type_idx" ON "deals" ("deal_type");
CREATE INDEX IF NOT EXISTS "deals_expected_close_at_idx" ON "deals" ("expected_close_at");
CREATE INDEX IF NOT EXISTS "deals_deleted_at_idx" ON "deals" ("deleted_at") WHERE "deleted_at" IS NULL;

CREATE INDEX IF NOT EXISTS "work_items_priority_idx" ON "work_items" ("priority");
CREATE INDEX IF NOT EXISTS "work_items_owner_user_id_idx" ON "work_items" ("owner_user_id");
CREATE INDEX IF NOT EXISTS "work_items_related_insight_id_idx" ON "work_items" ("related_insight_id");
CREATE INDEX IF NOT EXISTS "work_items_deleted_at_idx" ON "work_items" ("deleted_at") WHERE "deleted_at" IS NULL;

CREATE INDEX IF NOT EXISTS "listing_utilities_utility_idx" ON "listing_utilities" ("utility");
CREATE INDEX IF NOT EXISTS "client_preferred_locations_location_area_idx" ON "client_preferred_locations" ("location_area");
CREATE INDEX IF NOT EXISTS "deal_listings_listing_id_idx" ON "deal_listings" ("listing_id");
CREATE INDEX IF NOT EXISTS "interactions_client_id_idx" ON "interactions" ("client_id");
CREATE INDEX IF NOT EXISTS "interactions_listing_id_idx" ON "interactions" ("listing_id");
CREATE INDEX IF NOT EXISTS "interactions_deal_id_idx" ON "interactions" ("deal_id");
CREATE INDEX IF NOT EXISTS "interactions_interaction_at_idx" ON "interactions" ("interaction_at");
CREATE INDEX IF NOT EXISTS "payment_plans_status_idx" ON "payment_plans" ("status");
CREATE INDEX IF NOT EXISTS "installment_schedule_items_due_date_idx" ON "installment_schedule_items" ("due_date");
CREATE INDEX IF NOT EXISTS "installment_schedule_items_status_idx" ON "installment_schedule_items" ("status");
CREATE INDEX IF NOT EXISTS "rental_leases_status_idx" ON "rental_leases" ("status");
CREATE INDEX IF NOT EXISTS "rental_charges_due_date_idx" ON "rental_charges" ("due_date");
CREATE INDEX IF NOT EXISTS "payments_paid_at_idx" ON "payments" ("paid_at");
CREATE INDEX IF NOT EXISTS "documents_category_idx" ON "documents" ("category");
CREATE INDEX IF NOT EXISTS "documents_is_verified_idx" ON "documents" ("is_verified");
CREATE INDEX IF NOT EXISTS "sync_devices_user_id_idx" ON "sync_devices" ("user_id");
CREATE INDEX IF NOT EXISTS "insights_status_idx" ON "insights" ("status");
CREATE INDEX IF NOT EXISTS "insights_severity_idx" ON "insights" ("severity");
CREATE INDEX IF NOT EXISTS "work_items_status_idx" ON "work_items" ("status");

ALTER TABLE "listings"
  ADD CONSTRAINT "listings_assigned_agent_user_id_fkey" FOREIGN KEY ("assigned_agent_user_id") REFERENCES "users"("id") ON DELETE SET NULL,
  ADD CONSTRAINT "listings_last_modified_by_user_id_fkey" FOREIGN KEY ("last_modified_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL;

ALTER TABLE "clients"
  ADD CONSTRAINT "clients_last_modified_by_user_id_fkey" FOREIGN KEY ("last_modified_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL;

ALTER TABLE "deals"
  ADD CONSTRAINT "deals_agent_user_id_fkey" FOREIGN KEY ("agent_user_id") REFERENCES "users"("id") ON DELETE SET NULL,
  ADD CONSTRAINT "deals_last_modified_by_user_id_fkey" FOREIGN KEY ("last_modified_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL;

ALTER TABLE "work_items"
  ADD CONSTRAINT "work_items_owner_user_id_fkey" FOREIGN KEY ("owner_user_id") REFERENCES "users"("id") ON DELETE SET NULL,
  ADD CONSTRAINT "work_items_related_insight_id_fkey" FOREIGN KEY ("related_insight_id") REFERENCES "insights"("id") ON DELETE SET NULL,
  ADD CONSTRAINT "work_items_entity_id_check" CHECK ("entity_id" IS NULL OR "entity_type" IS NOT NULL);

