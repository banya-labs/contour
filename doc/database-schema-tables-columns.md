# Database Schema Tables and Columns

Source: https://app.notion.com/p/62d2896b9f2f4182ac5542cc0654ed83

## Status

This page captures the product-level table model. The normalized DDL in [Canonical Neon Postgres DDL](./database-schema-ddl-neon-postgres.md) is the implementation authority where this page differs.

## Fixed Tech Decisions

- Hosting/runtime: Vercel with Next.js.
- Auth: Clerk.
- Primary cloud database: Neon Postgres.
- Desktop app: Electron wrapper using the same UI as the web app.
- Offline local store: local database plus sync queue/outbox.
- Object storage: Vercel Blob.

## Non-Negotiable Behavior

- Every push/build deploys the web app to Vercel.
- Every push/build produces a Windows desktop `.exe`.
- Cloud database persists across deployments.
- Connectivity indicator is always visible: green online, grey offline.
- Offline reads and writes are always allowed in the desktop app using last-synced data.
- Sync must upload local writes and pull server changes when online.
- Sync must be idempotent and must never duplicate ledger/event rows.

## Schema Conventions

- Primary keys are `uuid`.
- Timestamps are UTC `timestamptz`.
- Money is `numeric(14,2)` plus currency.
- All tables include `created_at` and `updated_at`.
- Mutable operational tables include `last_modified_by_user_id`.

## Product Tables

### `users`

Purpose: internal user records used for attribution and analytics. Clerk remains the authentication provider.

Fields:

- `id`
- `clerk_user_id`
- `email`
- `full_name`
- `role`
- `is_active`
- `created_at`
- `updated_at`

### `listings`

Purpose: centralized inventory for properties and vacant land.

Fields:

- `id`
- `listing_code`
- `type`
- `availability_status`
- `location_area`
- `address`
- `asking_price_amount`
- `asking_price_currency`
- `bedrooms`
- `bathrooms`
- `land_size_ha`
- `zoning`
- `land_designation`
- `assigned_agent_user_id`
- `internal_notes`
- `created_at`
- `updated_at`
- `last_modified_by_user_id`

Canonical DDL change:

- `utilities` must be normalized into `listing_utilities`, not stored as a text array.

### `clients`

Purpose: CRM, KYC vault, segmentation, and buyer preferences.

Fields:

- `id`
- `full_name`
- `phone`
- `email`
- `segment`
- `nrc_number`
- `passport_number`
- `tpin`
- `nationality`
- `budget_min_amount`
- `budget_max_amount`
- `budget_currency`
- `notes`
- `created_at`
- `updated_at`
- `last_modified_by_user_id`

Canonical DDL change:

- `preferred_locations` must be normalized into `client_preferred_locations`, not stored as a text array.

### `interactions`

Purpose: timeline of calls, site visits, WhatsApp messages, email, negotiations, and other client/deal/listing touchpoints.

Fields:

- `id`
- `summary`
- `client_id`
- `listing_id`
- `deal_id`
- `type`
- `outcome`
- `interaction_at`
- `next_step`
- `next_follow_up_at`
- `agent_user_id`
- `created_at`
- `updated_at`

### `deals`

Purpose: sales pipeline and agent attribution.

Fields:

- `id`
- `deal_name`
- `stage`
- `deal_type`
- `client_id`
- `offer_amount`
- `offer_currency`
- `expected_close_at`
- `closed_at`
- `agent_user_id`
- `commission_percent`
- `commission_amount`
- `notes`
- `created_at`
- `updated_at`
- `last_modified_by_user_id`

Canonical DDL change:

- `primary_listing_id` must be replaced by the many-to-many `deal_listings` table.

### `payment_plans`

Purpose: installment and hire-purchase plans.

Fields:

- `id`
- `plan_name`
- `deal_id`
- `client_id`
- `principal_amount`
- `down_payment_amount`
- `currency`
- `frequency`
- `periods`
- `start_date`
- `status`
- `created_at`
- `updated_at`
- `last_modified_by_user_id`

### `installment_schedule_items`

Purpose: amortization ledger and arrears analytics.

Fields:

- `id`
- `payment_plan_id`
- `installment_number`
- `due_date`
- `amount_due`
- `amount_paid`
- `paid_at`
- `status`
- `created_at`
- `updated_at`

### `rental_leases`

Purpose: rental contracts.

Fields:

- `id`
- `lease_name`
- `tenant_client_id`
- `listing_id`
- `start_date`
- `end_date`
- `rent_amount`
- `currency`
- `billing_day`
- `deposit_amount`
- `status`
- `created_at`
- `updated_at`
- `last_modified_by_user_id`

### `rental_charges`

Purpose: monthly rental billing matrix.

Fields:

- `id`
- `lease_id`
- `period_month`
- `due_date`
- `amount`
- `currency`
- `status`
- `created_at`
- `updated_at`

### `payments`

Purpose: actual cash receipts for reconciliation analytics.

Fields:

- `id`
- `receipt_number`
- `client_id`
- `deal_id`
- `payment_plan_id`
- `installment_schedule_item_id`
- `lease_id`
- `rental_charge_id`
- `paid_at`
- `amount`
- `currency`
- `method`
- `notes`
- `created_at`
- `updated_at`
- `recorded_by_user_id`

### `documents`

Purpose: document vault and checklists. File bytes live in Vercel Blob.

Fields:

- `id`
- `document_name`
- `category`
- `listing_id`
- `client_id`
- `deal_id`
- `blob_url`
- `blob_key`
- `mime_type`
- `file_size_bytes`
- `is_verified`
- `verified_at`
- `verified_by_user_id`
- `notes`
- `created_at`
- `updated_at`
- `uploaded_by_user_id`

### `events`

Purpose: analytics-first event stream.

Fields:

- `id`
- `event_type`
- `occurred_at`
- `actor_user_id`
- `entity_type`
- `entity_id`
- `metadata`

### `insights`

Purpose: analytics outputs that create operational work.

Fields:

- `id`
- `insight_type`
- `severity`
- `title`
- `description`
- `owner_user_id`
- `status`
- `entity_type`
- `entity_id`
- `evidence`
- `recommended_action`
- `due_at`
- `created_at`
- `updated_at`

### `work_items`

Purpose: actionable workflow tasks generated from insights or manually created.

Fields:

- `id`
- `work_type`
- `title`
- `description`
- `status`
- `priority`
- `owner_user_id`
- `related_insight_id`
- `entity_type`
- `entity_id`
- `due_at`
- `completed_at`
- `created_at`
- `updated_at`
