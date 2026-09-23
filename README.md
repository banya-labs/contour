# Contour — Real Estate Operations & Field Agent Operating System

> **"The Real Estate Operating System for Lusaka & Southern Africa."**  
> A high-performance, multi-tenant vertical SaaS venture by **Banya Labs**.

---

## 🏛️ Key Capabilities

- **Interactive Geospatial Lusaka Map**: Leaflet GPS map with color-coded pins (🔴 Sale, 🟡 Rent, 🟢 Sold, 🔵 Rented), popups, and synchronized bottom card carousel.
- **Contour AI Broker Copilot (Dify Connected)**: Grounded natural language property search, 5% revenue explanations, arrears tracking, and smart WhatsApp alerts.
- **True 5% Agency Revenue Calculation**: Explicitly separates gross inventory value from actual earned brokerage commission revenue and 50% agent splits.
- **Daily Action Queue**: Proactive operational tasks (WhatsApp arrears reminders, client dialer nudges, DocuSign statement sign-offs, Ministry folio lookups).
- **5-Stage Deal Pipeline Kanban**: Tracks deals from inquiry through viewing, negotiation, offer, and closing with average velocity metrics.
- **Self-Hosted MinIO S3 Object Storage**: High-performance presigned URL binary storage for property photography, Certificates of Title, NRC ID scans, and cadastral survey plans.
- **Landlord Remittance Engine with DocuSign Seam**: Automated `Gross Rent` − `10% Fee` − `Audited Maintenance` = `Net Remittance` formula with non-negotiable human manager approval.
- **Client CRM with 30-Day Anti-Poaching Lock**: Prevents internal deal poaching by exclusively binding clients to closing agents.
- **Field Agent Mobile PWA (`/kiosk`)**: 1-Click WhatsApp flyer generator with masked landlord PII for Lusaka field agents on the move.
- **Machine & MCP Control Plane (`/api/mcp`)**: JSON-RPC 2.0 endpoint with user-scoped token management and 1-click compromise revocation.

---

## 🛠️ Tech Stack

- **Framework**: Next.js 15 (App Router), TypeScript (Strict Mode)
- **Design System**: Warm Paper (`#fdfbfa`), Ink Charcoal (`#27251e`), Burgundy (`#FA3600`), TailwindCSS
- **Database**: PostgreSQL with `pgvector` (Prisma ORM)
- **Object Storage**: **Self-Hosted MinIO (S3-Compatible)**
- **Authentication**: Better Auth (Multi-tenancy & API Key plugins)
- **Payments**: Lenco Zambia
- **AI Backend**: Dify Agent Runtime
- **Testing**: Playwright End-to-End Test Suite

---

## 🚀 Quick Start

```bash
# Clone & install
pnpm install

# Run dev server
pnpm dev

# Generate Prisma client
pnpm db:generate

# Apply committed migrations in a deployment or staging environment
pnpm db:migrate:deploy

# Build production bundle
pnpm build
```

### Verification

```bash
# Unit and route regression tests
pnpm test

# Cross-tenant integration test against an isolated PostgreSQL database
TEST_DATABASE_URL="postgresql://..." pnpm test -- tests/integration/dify-tenant-isolation.integration.test.ts
```

The integration test is skipped when `TEST_DATABASE_URL` is not configured.
Use a disposable database created from the committed Prisma migrations; never
point it at production.

### Production storage and database

Production recovery, rollback, backup, and incident procedures are documented in [`docs/PRODUCTION_OPERATIONS_RUNBOOK.md`](docs/PRODUCTION_OPERATIONS_RUNBOOK.md).

Contour requires an S3-compatible bucket for document storage. Configure
`S3_BUCKET_NAME`, `S3_REGION`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, and
optionally `S3_ENDPOINT` for MinIO, Dokploy storage, or another compatible
provider. Presigned uploads and downloads expire after 15 minutes; the
application never accepts a client-supplied organization ID for protected
storage operations.

Run `pnpm db:migrate:deploy` as a Dokploy release/deploy command after setting
`DATABASE_URL`. Do not use `pnpm db:push` against production because it bypasses
the committed migration history.

### One-time baseline for an existing database

If the database was originally created with `prisma db push` or another schema
tool, it is not empty and Prisma will report `P3005` when it sees the initial
create-schema migration. After verifying the existing database matches the
initial migration and taking a backup, mark only the initial migration as
already applied, then deploy the remaining migrations:

```bash
pnpm exec prisma migrate resolve --applied 20260911000000_initial_schema
pnpm db:migrate:deploy
```

The resolve command records migration history; it does not recreate or delete
existing tables. Do not mark `20260911010000_billing_idempotency` as applied,
because that migration still needs to create the billing and webhook tables.

### Lenco webhook signing

Lenco does not issue a separate webhook secret. It derives the signing key from
`LENCO_API_KEY` using SHA-256, then signs the raw webhook body with HMAC-SHA512.
Keep `LENCO_API_KEY` private and configure the webhook URL through Lenco.
