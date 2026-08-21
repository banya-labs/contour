# Data Quality Rules and Automated Work Item Generation

Source: https://app.notion.com/p/1bc31f900cde4501aa2a480c8bdd5d32

## Purpose

Define deterministic data-quality checks that keep the CRM trustworthy and make analytics reliable.

## Principle

Every failed check creates or updates:

- An `insights` row with type and evidence.
- A `work_items` task assigned to an owner.

## Listings Checks

### Missing Location

- Rule: `location_area` is null or empty.
- Insight: `missing_field`.
- Work item: `data_cleanup` titled "Set listing location".

### Invalid Status Transition

- Rule: `availability_status` changed from sold to available without admin override event.
- Insight: `audit_check`.
- Work item: `audit_check` titled "Review status change".

### Stale Listing

- Rule: `updated_at` older than 30 days and status is available or reserved.
- Insight: `stale_listing`.
- Work item: `data_cleanup`.

## Client Checks

### KYC Completeness

- Rule: segment is `prospective_buyer`, `active_tenant`, or `land_owner_seller` and NRC/passport or TPIN is missing.
- Insight: `kyc_incomplete`.
- Work item: `document_request` or `data_cleanup`, depending on process.

### Duplicate Detection

- Rule: same phone, email, NRC, or TPIN across multiple clients.
- Insight: `duplicate_client`.
- Work item: `audit_check` titled "Merge / dedupe clients".

## Deal Checks

### Stage Stuck

- Rule: stage duration exceeds SLA.
- Insight: `stage_stuck`.
- Work item: `follow_up`.

### Missing Next Step

- Rule: stage is viewing or offer and no scheduled follow-up exists.
- Insight: `follow_up_gap`.
- Work item: `follow_up`.

## Document Checks

### Missing Critical Documents by Stage

- Rule: deal stage is contract or later and no `contract_of_sale` or `lease_agreement` document is linked.
- Insight: `missing_document`.
- Work item: `document_request`.

### Unverified Critical Documents

- Rule: category is `title_deed`, `offer_letter`, `contract_of_sale`, or `lease_agreement`, and `is_verified=false`.
- Insight: `document_unverified`.
- Work item: `audit_check`.

## Electron and Offline Checks

- Rule: sync failed three or more times in 24 hours.
- Insight: `sync_health`.
- Work item: `data_cleanup` titled "Resolve sync error", assigned to admin.

## Implementation Notes

- Run checks in a scheduled server job and after relevant writes.
- Deduplicate open insights by `insight_type`, `entity_type`, and `entity_id`.
- Keep resolved/dismissed historical insights for audit and analytics.
- Work item resolution criteria should be machine-checkable wherever possible.
