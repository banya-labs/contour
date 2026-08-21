# Analytics Spec: KPIs, Events, Insights, and Workflows

Source: https://app.notion.com/p/d6bc91b6859444a2864b2536c5774a84

## Purpose

Analytics must turn operational data into insights and then into work items. Reporting is not a passive dashboard layer; it is a workflow engine.

## Non-Negotiables

- Every meaningful action emits an append-only `events` row.
- Every dashboard metric is defined as a SQL query or view and should be source-controlled.
- Every insight maps to a workflow by creating or updating a `work_items` task.

## Event Envelope

Each event includes:

- `event_type`
- `occurred_at`
- `actor_user_id`
- `entity_type`
- `entity_id`
- `metadata`

## Canonical Event Taxonomy

### Listings

- `listing_created`
- `listing_updated`
- `listing_status_changed`, metadata: from, to
- `listing_agent_assigned`, metadata: agent_user_id

### Clients and KYC

- `client_created`
- `client_updated`
- `client_segment_changed`, metadata: from, to
- `client_kyc_updated`, metadata: fields_changed

### Interactions

- `interaction_logged`, metadata: type, outcome
- `follow_up_scheduled`, metadata: follow_up_at

### Deals

- `deal_created`
- `deal_stage_changed`, metadata: from, to
- `deal_closed_won`
- `deal_closed_lost`

### Documents

- `document_uploaded`, metadata: category
- `document_verified`, metadata: verified=true

### Offline and Sync Health

- `sync_started`
- `sync_completed`, metadata: rows_pushed, rows_pulled
- `sync_failed`, metadata: error_code

## KPI Definitions

### Organization and Operations

- Record coverage: listing, client, deal, and interaction counts over time.
- Data freshness: percentage of listings updated in the last 7 and 30 days.

### Inventory Control

- Inventory counts by `availability_status`.
- Portfolio value: sum of `asking_price_amount` by location and currency.
- Time-on-market proxy: days since created or last status change.

### Sales Management

- Pipeline stage counts.
- Stage conversion rates.
- Days-in-stage, median and p95 by stage.
- Close rate by agent and location.

### Collections

- Expected vs actual variance across installments and rentals.
- Aging buckets: 15/30/60+ overdue counts and totals.

### Client Management

- Prospects without interaction in 3, 7, and 14 days.
- Buyer matcher coverage: percentage of clients with preferences filled.

### Document Security

- Missing-document rate by category.
- Verification rate.
- Days since last verification.

## Insight Catalog

### Stale Listing

- Trigger: listing `updated_at` older than default 30 days.
- Work item: `data_cleanup` titled "Review listing for accuracy".
- Resolution: listing updated or dismissed with reason.

### Deal Stuck in Stage

- Trigger: stage duration exceeds stage SLA.
- Work item: `follow_up` titled "Move deal forward / close out".
- Resolution: stage changed or deal closed.

### Follow-Up Gap

- Trigger: prospective buyer has no interaction in 7 days and has an open deal.
- Work item: `follow_up` titled "Contact prospect".
- Resolution: new interaction logged or follow-up scheduled.

### Missing Critical Document

- Trigger: deal/listing missing title deed or contract when stage is contract or later.
- Work item: `document_request` titled "Request/Upload missing document".
- Resolution: document uploaded and linked.

### Duplicate Client Suspicion

- Trigger: same phone/email or fuzzy name match.
- Work item: `audit_check` titled "Merge / dedupe client records".
- Resolution: resolved with selected master record.

## Dashboard Actions

- Inventory dashboard: create listing or fix stale listings.
- Pipeline dashboard: view stuck deals or assign follow-ups.
- Arrears dashboard: create collection follow-ups.
- Document dashboard: request missing documents.
