# Sync Protocol: Electron Offline to Neon

Source: https://app.notion.com/p/0df01ef171b946d7a91d24d86580016e

## Purpose

Define definitive sync behavior between the offline Electron app and Neon Postgres.

## Non-Negotiables

- Desktop app is fully usable offline using last-synced data.
- Sync is idempotent and safe to retry.
- Sync never creates duplicate append-only rows for events, interactions, payments, rental charges, or installment schedule items.
- Connectivity indicator is always visible.
- Online state is green.
- Offline state is grey and includes last sync date/time.

## Data Categories

### Mutable Records

Tables:

- `listings`
- `clients`
- `deals`
- `payment_plans`
- `rental_leases`
- `documents`

Rule:

- Upload as upserts with `updated_at` and conflict detection.

### Append-Only Facts

Tables:

- `events`
- `interactions`
- `payments`
- `rental_charges`
- `installment_schedule_items`

Rule:

- Upload as inserts with client-generated UUIDs.
- Server rejects duplicate IDs.

## Required Sync Columns

All syncable tables include:

- `id`
- `created_at`
- `updated_at`
- `last_modified_by_user_id` where applicable

## Sync Endpoints

### `POST /sync/push`

Payload:

- `device_id`
- `user_id`
- table batches
- `last_sync_token`

Server behavior:

- Validate Clerk session and device identity.
- Apply mutable upserts and append-only inserts.
- Return acknowledgements and a new sync token.
- Reject duplicate append-only facts by ID without failing the whole retryable batch.

### `POST /sync/pull`

Payload:

- `device_id`
- `user_id`
- `sync_token`

Server behavior:

- Return changed rows since token.
- Include deletes as tombstones where tables use `deleted_at`.
- Return a new sync token.

## Conflict Rules

- Mutable records use last-write-wins by `updated_at`.
- If both server and client changed since the last sync token, write a conflict log.
- Admins can override and resolve sync conflicts.
- Append-only rows are never overwritten.
- Corrections are new rows with metadata linking to prior rows.

## Sync Health Analytics

Required events:

- `sync_started`
- `sync_completed`
- `sync_failed`

Required metadata:

- Error codes.
- Rows pushed.
- Rows pulled.
- Device ID.
- App version where available.

## UX Requirements

- Offline icon/banner is grey.
- Online icon/banner is green.
- Offline mode allows all edits.
- Offline mode shows queued writes count.
- Online mode runs background sync periodically and on demand.

## Implementation Notes

- Use client-generated UUIDs in Electron for all records created offline.
- Store an outbox table locally for pending writes.
- Store a local `sync_state` row per device.
- Treat sync errors as user-visible operational problems when they persist.
