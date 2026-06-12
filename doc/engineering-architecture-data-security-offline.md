# Engineering Architecture, Data, Security, and Offline

Source: https://app.notion.com/p/59b09b8e14844aed9a9a041d03d57c2d

## Purpose

This page is the technical implementation contract for the system. The fixed decisions below should be treated as requirements unless a known incompatibility is proven during implementation.

## Fixed Decisions

- Hosting/runtime: Vercel with Next.js.
- Auth: Clerk.
- Cloud database: Neon Postgres.
- Desktop offline app: Electron using the same UI as the web app.
- Document storage: Vercel Blob.
- Analytics: SQL-first and event-driven.
- Every meaningful action emits an append-only `events` row.
- Analytics produce `insights`.
- Insights produce `work_items`.

## Distribution and Deployment

Every push/build must:

- Deploy the web app to Vercel.
- Build and publish a new Windows desktop `.exe` artifact for Electron.
- Preserve the Neon database across deployments. Deployments must never reset production data.

## Connectivity Indicator

The app must always show a connectivity indicator in the top corner:

- Green: online.
- Grey: offline.

Offline behavior:

- App remains fully usable for read and write using last-synced local data.
- Writes are queued locally and synced when connectivity returns.

## System Components

### Web App

- Next.js on Vercel.
- Canonical UI.
- Uses Clerk sessions for all authenticated requests.

### Desktop App

- Electron wrapper around the same UI.
- Includes local offline database and sync engine.
- Must match the web app visually and functionally.

### API Layer

- Vercel functions for CRUD endpoints.
- Sync endpoints for push and pull.
- Analytics endpoints for dashboards and insight queues.

### Cloud Data Layer

- Neon Postgres as definitive system of record.
- Stores operational records and analytics workflow tables: `events`, `insights`, and `work_items`.

### Blob Storage

- Vercel Blob stores document bytes.
- Postgres stores metadata and blob links.

## Data Categories

### Mutable Operational Records

Tables:

- `listings`
- `clients`
- `deals`
- `payment_plans`
- `rental_leases`
- `documents`

Rule:

- Use upserts with `updated_at` and conflict detection.

### Append-Only Facts

Tables:

- `events`
- `interactions`
- `payments`
- `rental_charges`
- `installment_schedule_items`

Rule:

- Use inserts with client-generated UUIDs.
- Server rejects duplicates.

## Security and Governance

- Enforce role-based access using Clerk roles/claims.
- Roles: admin, agent, finance, legal, auditor.
- Treat KYC fields as restricted data.
- Only authorized roles can view or edit KYC fields.
- All KYC changes emit `client_kyc_updated` events.
- All create/update/delete actions on critical entities emit events for auditability.

## Role Permissions

### Admin

- Create/disable users and assign roles.
- Full access to all data, including KYC.
- Configure operational settings.
- View analytics dashboards, insights, and work items.
- Override and resolve sync conflicts.

### Agent

- Create/update listings.
- Change listing availability status.
- Create/update clients subject to KYC policy.
- Log interactions and schedule follow-ups.
- Create/update deals and move deals through stages.
- Upload documents and link them to listings, clients, and deals.
- View analytics relevant to assigned inventory/deals and assigned work items.

### Finance

- Create/update payments and receipts.
- Create/update rental charges and installment schedule corrections.
- View arrears, aging, reconciliation, and collections insights.
- Create/close finance-related work items.

### Legal

- View document compliance dashboards.
- Verify documents by setting `documents.is_verified`.
- View delinquency-related insights and work items.
- Access KYC fields where required for compliance.

### Auditor

- Read-only operational data access.
- Read-only `events` and `audit_log` access.
- Read-only analytics dashboards and evidence.

## Required Product Surfaces

- Inventory dashboard and Listings CRUD.
- Client profiles with KYC access control.
- Interactions timeline logging per client/deal/listing.
- Deals pipeline kanban by `stage`.
- Documents upload, checklist categories, and verification.
- Insights inbox for open insights.
- Work queue for `work_items`.
