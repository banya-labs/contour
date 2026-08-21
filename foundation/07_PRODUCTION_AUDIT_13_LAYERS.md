# 07 — 13-Layer Production Audit Scorecard: Contour

**Target Deployment**: Self-hosted Dokploy Container Cluster (Contabo / Hostinger)  
**Standard**: Banya Labs 13-Layer AI-Directed Engineering Production Matrix  
**Author**: Foundation Architect (Banya Labs)  

---

## 1. Pre-Flight Engineering Audit Matrix

```
[Layer 1: Frontend]           PASS (App Router, Responsive PWA, Error Boundaries, No Hydration mismatch)
[Layer 2: APIs & Backend]     PASS (Typed Zod Schemas, Standardized Error Handlers, No Leaked Stacktraces)
[Layer 3: DB & Storage]       PASS (PostgreSQL 16 + pgvector, Organization Foreign Keys, Composite Indexes)
[Layer 4: Auth & RBAC]        PASS (Better Auth Server Verification, Strict organizationId Scoping)
[Layer 5: Hosting & Deploy]   PASS (Multi-Stage Dockerfile Node 20 Alpine, Standalone Output, Dokploy Webhook)
[Layer 6: Compute & Queues]   PASS (BullMQ Rent Arrears Workers, 30s Timeouts, 3x Exponential Backoff)
[Layer 7: CI/CD & Git]        PASS (GitHub Actions Lint, Typecheck, Test, Dokploy Auto-Trigger)
[Layer 8: Security & RLS]     PASS (server-only module barriers, Landlord PII Masking from Field Agents)
[Layer 9: Rate Limiting]      PASS (Redis Sliding-Window Rate Limiting on /api/mcp and Auth routes)
[Layer 10: Caching & CDN]     PASS (Redis Cache-Aside for Property Catalog, WebP Photo Optimization)
[Layer 11: Load & Scaling]    PASS (Stateless Container Model, /api/health Liveness, /api/ready Readiness)
[Layer 12: Logging & Error]   PASS (Pino JSON Structured Logs, Request Correlation IDs, Masked PII)
[Layer 13: Backup & Recovery] PASS (Daily Automated Postgres WAL / pg_dump S3/R2 Backup Scripts)
```

---

## 2. Layer-by-Layer Verification Criteria

### Layer 1: Frontend, Forms & UX
- [x] Responsive layout tested from 375px mobile viewport up to 4K desktop monitor.
- [x] Leaflet map dynamically loads with SSR disabled (`next/dynamic` with `ssr: false`).
- [x] **Client-Side Form Validation**: All interactive modals validate inputs (empty checks, min lengths, positive numbers, regex patterns) with instant user-friendly feedback before network dispatch.
- [x] Global error boundaries implemented via `src/app/error.tsx` and `src/app/global-error.tsx`.

### Layer 2: APIs, Backend & Contract Safety
- [x] **Dual-Layer Validation Standard**: All mutating API endpoints validate payloads with canonical Zod schemas (`src/lib/validations/banya-standards.ts`) before database execution.
- [x] Centralized API handler wraps all routes with sanitized error responses (no raw Prisma or database errors leaked).

### Layer 3: Database & Multi-Tenancy
- [x] Every query enforces `where: { organizationId: session.organizationId }`.
- [x] Composite indexes applied on `[organizationId, status]` and `[organizationId, suburb]`.
- [x] `pgvector` enabled for 1536-dimensional semantic property matching.

### Layer 4: Authentication & Landlord Privacy (RBAC)
- [x] Better Auth handles session tokens with secure HTTP-only cookies.
- [x] Field Agent role (`FIELD_AGENT`) cannot query Landlord banking details or phone numbers.
- [x] Dev Mode bypass enabled only when `NEXT_PUBLIC_DEV_MODE="true"`.

### Layer 5: Dokploy Deployment & Containers
- [x] Production `Dockerfile` uses Node 20 Alpine with non-root user execution.
- [x] Next.js configured with `output: "standalone"`.
- [x] Dokploy health check probes configured for `/api/health`.

### Layer 6: Background Jobs (BullMQ)
- [x] Rent arrears scheduled check runs daily at 06:00 AM UTC with job ID deduplication.
- [x] Worker timeouts hardcoded to 30s to prevent memory leaks.

### Layer 7: CI/CD Pipeline
- [x] Automated workflow runs `pnpm lint`, `pnpm typecheck`, and `pnpm test` on PR.
- [x] Webhook triggers Dokploy rebuild upon merge to `main`.

### Layer 8: Security & POPIA Compliance
- [x] `"server-only"` enforced on all database client and auth utility files.
- [x] Access to landlord statements and title deeds recorded in `AuditLog`.

### Layer 9: Rate Limiting
- [x] Public property listing pages capped at 60 requests/minute per IP.
- [x] `/api/mcp` endpoint throttled to 120 requests/minute per API key.

### Layer 10: Caching
- [x] Property inventory catalog cached in Redis with 5-minute TTL, invalidated on property mutation.

### Layer 11: High Availability & Readiness
- [x] `/api/health` returns status 200 with database ping.
- [x] `/api/ready` confirms Redis connectivity and schema migration state.

### Layer 12: Observability & Logging
- [x] Pino JSON logger outputs structured logs with `traceId`, `tenantId`, and masked customer phone numbers.

### Layer 13: Disaster Recovery
- [x] Automated PostgreSQL backup script runs nightly to S3/Cloudflare R2 storage.
