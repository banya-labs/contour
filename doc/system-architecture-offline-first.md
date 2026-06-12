# System Architecture Offline-First

Source: https://app.notion.com/p/8d8f4f4d2a7141639b56184d54f0e398

## Architecture Goals

- Work offline for field agents.
- Provide fast local search and filtering.
- Sync safely when online.
- Preserve clear auditability.
- Enforce access control.

## Logical Components

### Client App

- Local database, likely SQLite for Electron.
- Local full-text search index.
- Background sync queue.

### Sync Service

- Auth and device identity.
- Change-set upload and download.
- Conflict resolution rules.

### Core Backend

- API gateway.
- Domain services for Listings, CRM, Deals, Payments, Documents, Analytics, and Work Items.
- Notifications and reminders for arrears and follow-ups.

### Data Stores

- Neon Postgres for relational system-of-record data.
- Vercel Blob for document files.
- SQL views/materialized views for analytics. Optional warehouse can wait until scale demands it.

### Admin and Reporting

- Dashboards.
- Exports.
- Audit and evidence views.

## Offline-First Sync Model

- Record-level versioning and last-write-wins for simple mutable fields.
- Conflict log when server and client changed the same mutable row since last sync.
- Append-only ledgers for money, charges, interactions, and events to avoid destructive conflict handling.
- Reconciliation views detect financial and operational inconsistencies.

## Security and Compliance

- Encrypt KYC fields at rest.
- Use role-based permissions for admin, agent, finance, legal, and auditor.
- Maintain audit logs for create/update/delete on financial and KYC records.

## Implementation Direction

Use a shared TypeScript domain layer across web and Electron where practical. The web app talks to API routes directly. Electron uses the same UI but routes data access through a local store and sync queue. Treat sync as a product surface with visible status, queued write count, error state, and manual retry.
