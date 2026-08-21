# AGENTS.md — Developer & AI Agent Guide for Contour (Banya Labs)

Welcome to **Contour**, the Real Estate Operations & Field Agent Operating System for Southern Africa.

---

## 🏛️ Operating Doctrine: The Venture Architect Pushback Rule

> **MANDATORY WORKING AGREEMENT WITH SEWARD (BANYA LABS)**:  
> As a high-rigor Venture Architect and Systems Partner, you are **NOT a passive "yes-man"**.  
> If Seward (or any prompt) proposes an architectural choice, dependency, or feature that introduces:
> 1. **Anti-Patterns & Database Bloat** (e.g. storing binary files in MongoDB instead of dedicated MinIO S3 object storage).
> 2. **Unneeded Dual-Database Complexity** (e.g. running multiple databases when PostgreSQL + pgvector handles it cleanly).
> 3. **Scope Sprawl & Overengineering** (e.g. building complex bespoke subsystems when Dokploy/standard primitives exist).
> 4. **Tenant Isolation / Security / POPIA Violations**.
>
> **YOU MUST IMMEDIATELY PUSH BACK BEFORE WRITING CODE**:
> - State the exact technical and operational risk (backup bloat, maintenance debt, failure modes, cost).
> - Present the canonical, battle-tested standard (e.g. *"MinIO S3 Presigned URLs provide direct client-to-bucket streaming, immutable CDN caching, and 15-min POPIA download tokens without touching server RAM"*).
> - Explicitly ask Seward to confirm whether he truly wishes to override before proceeding.

---

## 🏛️ System Overview & Multi-Surface Architecture

Contour is built on the **Banya Boilerplate v4.0** standard with 5 distinct surfaces:

1. **Public Marketing Surface** (`/` and `/p/[slug]`):
   - Landing page explaining 5% commission revenue transparency, ROI calculator, and Paystack ZMW/USD pricing.
   - Public shareable listing card with direct 1-click WhatsApp trigger (`https://wa.me/...`).
2. **Operations Dashboard** (`/dashboard`):
   - Executive Command Center: **Daily Work Queue ("What Needs to Happen Today")**, Lead Sources Attribution, Cashflow KPIs.
   - Interactive Lusaka Property Map (`/dashboard/map`) with Leaflet GPS pins and synchronized card slider.
   - Deal Pipeline Kanban (`/dashboard/pipeline`) with velocity tracking.
   - Properties Catalog (`/dashboard/properties`) separating Company-Owned vs Managed listings.
   - Property Sales & Title Registry (`/dashboard/sales`) tracking buyers, NRC/Passport numbers, and Ministry Lands references.
   - Rentals & Leases (`/dashboard/leases`) with automated WhatsApp arrears nudges (4-day cooldown key).
   - Landlord Statements (`/dashboard/statements`) with **The DocuSign Human Seam**.
   - Client CRM (`/dashboard/clients`) with **30-Day Anti-Poaching Lock**.
3. **Field Agent Mobile PWA** (`/kiosk`):
   - Lightweight, high-contrast mobile view (`390x844`) for Lusaka field agents.
   - 1-Click WhatsApp Listing Flyer generator with masked landlord PII.
4. **Legal & Compliance Documents Vault** (`/dashboard/documents`):
   - Encrypted custody for Certificates of Title, NRC ID copies, Mandates, and Leases.
5. **Machine & MCP Control Plane** (`/admin/mcp` and `/api/mcp`):
   - JSON-RPC 2.0 Model Context Protocol tools protected by user-scoped Bearer tokens with 1-click compromise revocation.

---

## 🗄️ Storage & Database Tier

1. **Relational & Vector Data**: Self-hosted **PostgreSQL** with `pgvector` managed via **Prisma ORM** (`prisma/schema.prisma`).
2. **Block & Object Storage Engine**: **Self-Hosted MinIO (S3-Compatible Object Storage)**:
   - Partitioned S3 bucket paths: `s3://contour-vault/{organizationId}/{category}/{timestamp}_{filename}`.
   - Presigned Upload & Download URLs (zero web server RAM bottleneck).
   - Time-limited 15-minute presigned tokens for confidential POPIA legal custody (Title Deeds & NRC scans).
3. **Offline Field Replication**: **PowerSync** logical replication syncing Postgres WAL streams to client-side local SQLite for spotty network resilience.

---

## 🛡️ Mandatory Form & Input Validation Standard

All Banya Boilerplate vertical ventures enforce strict **Dual-Layer Validation**:
1. **Layer 1: Client-Side Interactive Form Validation**:
   - Every modal and input form (`Add Listing`, `Record Sale`, `Create Lease`, `Upload Document`, `Register Client`, `Create Deal`) MUST validate inputs before network requests.
   - Inline visual errors: Empty string checks, min-length limits, positive monetary amounts, and regex formatting for regional identifiers (Zambian NRC `######/##/#`, SA ID, phone numbers).
2. **Layer 2: Server-Side Zod Schema Enforcement**:
   - Every API route and `/api/mcp` tool wraps payloads in `createApiHandler()` with Zod schemas from `src/lib/validations/banya-standards.ts` and `src/lib/validations/index.ts`.
   - Rejects malformed requests with structured 400 Bad Request responses before database execution.

---

## 🔒 Rate Limiting & Machine Surface Security Standard (Layer 9)

All machine endpoints (`/api/mcp`, `/api/mcp/sse`) MUST enforce **3-Layer Sliding Window Rate Limiting** using `src/lib/rate-limiter.ts`:

1. **IP Rate Limit**: 30 GET / 60 POST requests per minute (`mcp:ip:{ip}`). Protects against unauthenticated discovery flooding.
2. **Bearer API Key Rate Limit**: 60 tool calls per minute (`mcp:key:{tokenHash}`). Prevents token abuse, runaway Dify agent loops, and leaked key exploits.
3. **Tenant Organization Rate Limit**: 120 aggregate tool calls per minute (`mcp:org:{tenantId}`). Protects downstream database connection pools and MinIO S3 bandwidth.

**Storage Tier**: Uses atomic Lua scripts on **Redis** (`ioredis` via `src/lib/redis.ts`) in Dokploy production environments. Gracefully degrades to an in-memory sliding window map during local development or when `REDIS_URL` is omitted.
**Error Response**: Returns HTTP `429 Too Many Requests` with JSON-RPC error code `-32029` and standard `Retry-After` header.

---

## 🚀 Commands & Development Workflow

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Build production bundle
pnpm build

# Start production server
pnpm start

# Run comprehensive Playwright E2E surface tests
npx tsx scripts/test-all-surfaces.ts

# Run modal and form validation tests
npx tsx scripts/test-all-forms.ts

# Run AI Copilot E2E test
npx tsx scripts/test-ai-copilot.ts
```
