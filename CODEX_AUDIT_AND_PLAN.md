# Codex Audit And Implementation Plan

Date: 2026-09-11  
Project: Contour  
Target: Reliable multi-tenant SaaS for Zambian real-estate operators

Current position: Phase 6 — Testing, CI, documentation, and reference-verified cleanup.
Phase 6 progress: ESLint CLI migration is in place; the unused Better Auth CLI was removed; Next.js is upgraded to patched 15.5.24; targeted lint and the unit/route test suite pass.
Current verification blocker: full ESLint, TypeScript, and production build processes remain silent for several minutes on Windows and require CI/clean-run investigation.

## 1. Executive decision

The current repository is a feature-rich but mixed-state prototype. It contains active product work, demo fallbacks, competing authentication systems, copied design assets, legacy documentation, and incomplete production integrations.

The next phase is stabilization, not another feature expansion.

Canonical target:

- Better Auth as the only authentication system.
- Google OAuth plus email/password sign-in and sign-up through Better Auth.
- PostgreSQL/Prisma as the canonical application database.
- Real private S3-compatible object storage; no fake URL-based storage.
- Lenco Zambia as the only payment gateway.
- Explicit organization-scoped authorization on every protected read and write.
- Versioned Prisma migrations.
- Testable domain services behind thin Next.js route handlers.
- A small, authoritative documentation and asset set.

No existing working-tree change should be reverted as part of this plan. Cleanup happens only after dependency/reference checks and after the current baseline is committed.

## 2. Current repository baseline

The working tree is on `main` and contains a large uncommitted change set spanning dashboard and kiosk UI, vault and client-upload flows, Lenco billing, Better Auth-facing routes, existing Clerk middleware, deleted AI/test files, new marketing assets, and schema changes without a `prisma/migrations` directory.

The first repository action is to commit and push this complete baseline to `origin/main`. That commit is a checkpoint, not a declaration that the system is production-ready.

### Phase 0 checkpoint

- Baseline commit: `622f11905edab638fd4352ca73f01970c3d4b1ab`
- Commit subject: `Update by Antigavity to handver to Codex`
- Branch: `main`
- Working tree: clean after the manual commit.
- Local tracking state: `HEAD` matches the local `origin/main` reference.
- Remote verification: the environment could not reach GitHub over HTTPS, so the remote server was not independently queried during this session.

### Phase 1 implementation checkpoint

Implemented in the working tree:

- Removed Clerk runtime usage from the root layout, middleware, auth pages, dashboard navigation, mobile navigation, marketing navigation, and settings.
- Removed the Clerk theme module and direct `@clerk/nextjs` dependency declaration.
- Added Better Auth Next.js handlers at `/api/auth/*`.
- Added Google social-provider configuration with optional server-only credentials.
- Added custom Better Auth email/password and Google sign-in/sign-up UI.
- Replaced Clerk middleware with Better Auth session validation using the Node.js runtime.
- Added Google OAuth environment placeholders to `.env.example`.
- Changed the development-mode default from enabled to disabled.

Verification:

- `pnpm exec tsc --noEmit --pretty false --incremental false`: passes.
- `pnpm build`: still fails with the existing local Windows `spawn EPERM` process error.

Required credentials before Google OAuth can be tested:

```text
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
```

Google redirect URIs:

```text
http://localhost:3000/api/auth/callback/google
https://<production-domain>/api/auth/callback/google
```

Do not commit these credentials. Add them to the local environment and deployment secret store only.

### Phase 2 implementation checkpoint — tenant and authorization hardening

Implemented in the working tree:

- Added a centralized Better Auth tenant-context resolver in `src/lib/tenant-context.ts`.
- Removed the API-handler demo organization and development super-admin bypass.
- Made `createApiHandler` protected by default and require an active organization membership.
- Changed tenant resolution to use Better Auth's `activeOrganizationId` and verify the `Member` record in PostgreSQL.
- Secured the legacy document metadata endpoint and direct storage upload endpoint with the authenticated tenant context.
- Prevented clients from selecting arbitrary `organizationId` values for document uploads.
- Restricted Better Auth trusted origins to the configured application URL.
- Added protected organization onboarding after signup, including slug generation, active-organization selection, and safe internal redirect handling.
- Mapped Better Auth organization owners/admins to Contour's organization-scoped broker roles.
- Added tenant-context and authorization unit tests covering unauthenticated requests, missing memberships, tenant identity, and role policy.

Verification:

- `pnpm exec tsc --noEmit --pretty false --incremental false`: passes.
- Remaining tenant hardening work: add database-backed cross-tenant integration tests against an isolated test database.

### Phase 3 implementation checkpoint — database and storage reliability

Implemented in the working tree:

- Generated the initial Prisma migration at `prisma/migrations/20260911000000_initial_schema/migration.sql` without connecting to or changing a live database.
- Added explicit `db:migrate`, `db:migrate:deploy`, and `db:migrate:status` scripts.
- Replaced placeholder S3 URLs with AWS SDK v3 presigned PUT and GET URLs compatible with MinIO, Dokploy storage, Cloudflare R2, and AWS S3.
- Added server-side direct object upload through the S3 client and removed silent storage-success fallbacks.
- Capped presigned URL lifetime at 15 minutes and retained tenant-prefixed object keys.
- Changed storage viewing to return an authenticated presigned redirect instead of exposing raw bucket URLs.

Verification:

- `pnpm exec tsc --noEmit --pretty false --incremental false`: passes.
- `pnpm test`: passes with 9 tests.
- Dokploy must run `pnpm db:migrate:deploy` as a release/deploy command against the intended production database.
- S3 credentials and bucket policy must be configured before upload/download can be exercised.
- Existing databases created before Prisma Migrate require a one-time baseline using `prisma migrate resolve --applied 20260911000000_initial_schema` before deploying subsequent migrations.

### Phase 4 implementation checkpoint — Lenco billing reliability

Implemented in the working tree:

- Added durable `Payment` records with unique payment references and idempotency keys.
- Added durable `WebhookEvent` records with deduplication keys and processing timestamps.
- Required an `Idempotency-Key` on checkout requests and handled concurrent duplicate requests safely.
- Removed production payment simulation when Lenco is unconfigured; simulation is now limited to non-production development mode.
- Added transactional payment completion handling so a verified payment updates both the payment and organization subscription together.
- Required valid constant-time Lenco HMAC-SHA512 webhook verification using the SHA-256-derived API-token signing key; missing API tokens no longer bypass security.
- Re-queried Lenco transaction status before accepting successful webhook events.
- Prevented late failed webhooks from downgrading an already successful payment.
- Removed the unused Paystack integration and remaining Paystack-facing copy.

Verification:

- `pnpm exec tsc --noEmit --pretty false --incremental false`: passes.
- `pnpm test`: passes with 11 tests.
- Production verification still requires Lenco sandbox credentials and a signed webhook delivery.

### Phase 5 implementation checkpoint — AI and MCP data integrity

Implemented in the working tree:

- Removed fabricated production fallbacks from the Dify property, arrears, commission, inquiry, and document tools.
- Changed Dify document retrieval to read real, non-deleted tenant-scoped vault records before generating presigned URLs.
- Changed MCP property, arrears, and commission tools to return database-backed results only.
- Changed MCP inquiry creation to persist a real tenant-scoped `Inquiry` record with the 30-day anti-poaching lock.
- Added basic JSON-RPC 2.0 envelope validation for MCP requests.
- Added shared Zod schemas for all Dify/MCP tool argument shapes, including bounded limits, numeric coercion, supported enums, and budget-range validation.
- Added consistent invalid-argument responses for Dify tools and MCP `-32602` errors before database access.
- Added Vitest path-alias configuration and a Dify route regression suite proving client-supplied organization IDs cannot override authenticated tenant scope.
- Added request correlation IDs through middleware and machine-endpoint error responses, without exposing internal exception details to callers.
- Added bounded machine reads: property search is capped at 50 records and vault/MCP document retrieval is capped at 50 records.
- Updated Dify documentation and adversarial tests to use `BETTER_AUTH_SECRET` after removing the retired optional Dify secret variable.

Verification:

- Static search confirms no retired Dify environment variable names remain in active configuration or source.
- `git diff --check` passes.
- Full TypeScript/Vitest verification was attempted but stalled without diagnostic output in the current Windows process environment; it requires a follow-up run in a clean process or CI.
- Focused validation and tenant-isolation tests pass: 5 tests across 2 files.
- Correlation-ID regression tests pass as part of the focused suite.
- Isolated PostgreSQL verification completed on 2026-09-11: both committed migrations applied and the Dify cross-tenant integration test passed.
- Full Vitest verification completed on 2026-09-11: 8 test files and 20 tests passed with `TEST_DATABASE_URL` configured.

## 3. Verified quality baseline

- TypeScript strict type-check: passes.
- Production build: currently fails locally with `spawn EPERM`; investigate the Windows/process-environment issue before treating the build as verified.
- Lint: not operational; `next lint` enters interactive setup.
- Vitest: no test files are discovered.
- Prisma migrations: missing.
- Production storage signing: not implemented; current storage code constructs URLs.
- Authentication: Better Auth and Clerk are both present.
- Development bypass: `NEXT_PUBLIC_DEV_MODE` defaults to true and affects server authorization.

## 4. Architecture decisions

### Authentication: Better Auth only

The existing Prisma schema and API session code already align with Better Auth, making removal of Clerk the lower-risk path.

Actions:

1. Remove `@clerk/nextjs`, Clerk middleware, Clerk theme code, and Clerk-specific environment variables.
2. Replace middleware with Better Auth session checks.
3. Configure Google OAuth with server-only `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `BETTER_AUTH_URL`, and `BETTER_AUTH_SECRET`.
4. Keep email/password enabled.
5. Use Better Auth organization membership as the tenant boundary.
6. Resolve roles and permissions from membership, never from client input.
7. Remove all production authorization behavior based on `NEXT_PUBLIC_DEV_MODE`.
8. Keep development fixtures behind test-only or explicitly local-only configuration that cannot be enabled in production.

### Payments: Lenco Zambia only

Actions:

1. Remove Paystack runtime code, environment variables, UI references, and documentation.
2. Persist a checkout/payment record before initiating a gateway request.
3. Verify Lenco webhook signatures fail-closed in production.
4. Store webhook event IDs and reject duplicate events.
5. Verify amount, currency, organization, plan, and checkout reference before activation.
6. Update subscription state transactionally.

### Storage: real S3-compatible object storage

The storage interface may support MinIO, Cloudflare R2, or another S3-compatible provider through configuration, but production must use real presigned PUT and GET operations.

Required behavior:

- Private bucket and tenant-prefixed object keys.
- Presigned upload and download URLs.
- MIME, size, extension, and checksum validation.
- Upload-completion verification and orphan cleanup.
- Vault authorization rechecked during download.
- Audit events for upload, view, download, verification, and deletion.

## 5. Critical security work

### Tenant isolation

Create one shared tenant context and require it in every protected service call. Every query and mutation must include `organizationId` in its database predicate for properties, leases, payments, transactions, inquiries, statements, documents, vault grants, billing, audit logs, Dify tools, and MCP tools.

Resource relationships must also be checked. A lease, document, visit, or transaction must never reference a related record belonging to another organization.

### Vault access

The vault download route must apply the same access-grant rules as the vault listing route. Checking only document ID and organization ID is insufficient.

Access must consider role, membership, assigned property, explicit vault grant, document classification, and verify/delete permissions.

### Public upload links

Public document-request links are capability credentials and must be treated as sensitive. Implement hashed tokens where practical, strict expiry, PIN attempt limits, per-token/IP rate limiting, Zod validation, maximum file count/size, MIME sniffing, a malware-scanning hook, consent/retention policy, and safe error responses.

### Sensitive data

Never expose owner bank details, NRC/passport data, raw payment payloads, storage credentials, stack traces, or internal organization data through public APIs or logs.

## 6. Database and domain model plan

1. Create an initial Prisma migration from the current schema.
2. Stop using `prisma db push` for production deployment.
3. Add payment and webhook event entities with idempotency constraints.
4. Keep financial records append-only where possible.
5. Add explicit subscription, checkout, and webhook status enums.
6. Add tenant-scoped uniqueness and indexes.
7. Add data-retention and soft-delete rules for legal documents.
8. Validate cross-entity organization relationships in services and transactions.
9. Keep seed data under a clearly named development seed command.

## 7. API and service-layer plan

Route handlers should only authenticate, resolve tenant context, validate input, call a domain service, and return a typed response.

Create server modules for:

```text
src/server/auth
src/server/tenancy
src/server/properties
src/server/inquiries
src/server/leases
src/server/payments
src/server/billing
src/server/vault
src/server/storage
src/server/audit
src/server/mcp
```

Remove `any` from shared API context and handler types. Add typed error classes, consistent error envelopes, correlation IDs, pagination, bounded list queries, and centralized logging.

## 8. AI, Dify, and MCP plan

Production AI and MCP routes must never return fabricated business data.

1. Remove mock fallbacks from production routes.
2. Keep fixtures under test-only directories.
3. Validate JSON-RPC envelopes and tool arguments with Zod.
4. Enforce API-key organization scope.
5. Define read/write permissions per tool.
6. Implement actual database writes for inquiry tools.
7. Add bounded result limits and timeouts.
8. Audit sensitive tool calls.
9. Return empty results when data is absent rather than mock records.

## 9. Offline and kiosk plan

Do not complete true PowerSync synchronization until the online system has stable authorization and conflict rules.

Near-term: keep the kiosk functional with explicit local-cache behavior, document cached data and staleness, and prevent cached sensitive documents without an approved security design.

Later: define syncable entities, conflict resolution, offline mutation queues, idempotency, reconnection behavior, duplicate-write handling, and tenant switching tests.

## 10. Testing and CI plan

Create a real test layout:

```text
src/**/*.test.ts
tests/integration
tests/security
tests/e2e
```

Required regression coverage includes Better Auth email/password and Google OAuth, organization isolation, roles and vault permissions, property CRUD, public listing privacy, upload token expiry/rate limits, real storage signing, Lenco checkout/webhook idempotency, MCP/Dify authorization, rate limiting, and financial calculations.

Replace the interactive `next lint` script with non-interactive ESLint. CI must run lint, type-check, unit tests, integration tests, and production build.

## 11. Documentation cleanup

Create one authoritative documentation set:

```text
README.md
docs/architecture.md
docs/security.md
docs/database.md
docs/api.md
docs/deployment.md
docs/runbooks/
docs/adr/
CHANGELOG.md
```

Disposition rules:

- Consolidate overlapping root Markdown files into canonical documents.
- Move `documentation_legacy` out of the active source of truth after review.
- Archive completed `docs/superpowers` plans.
- Review `docs/affine` and `foundation` for unique decisions before archiving or consolidating.
- Keep legal/privacy documents only in reviewed authoritative locations.
- Keep `AGENTS.md` and `GEMINI.md` until their ownership is explicitly resolved.

## 12. Asset cleanup

Before deleting media, generate a source-reference inventory. Then remove generated screenshots, duplicate hero assets, copied design-system dumps, unused video variants, and source archives. Move large source media to a design repository or external storage, optimize retained assets, use descriptive filenames, and add asset-size checks to CI.

Likely candidates, subject to reference verification:

- `.artifacts/`
- `.test-screenshots/`
- copied `solidroad` assets
- duplicate hero images
- generated frame sequences
- large videos
- `contour.rar`

## 13. Delivery phases

### Phase 0 — Baseline checkpoint

- Commit and push the current working tree to `main`.
- Preserve all existing changes.
- Add this plan.
- Record the exact baseline commit.

### Phase 1 — Authentication consolidation

- Remove Clerk.
- Configure Better Auth Google OAuth.
- Verify email/password signup and sign-in.
- Replace middleware and session handling.
- Remove the server-side development bypass.

### Phase 2 — Tenant and authorization hardening

- Centralize tenant context.
- Scope every query and mutation.
- Fix vault download authorization.
- Add cross-tenant security tests.

### Phase 3 — Database and storage reliability

- Add Prisma migrations.
- Implement real S3-compatible storage.
- Add upload verification and cleanup.
- Add sensitive-document audit events.

### Phase 4 — Lenco billing reliability

- Remove Paystack.
- Add checkout persistence.
- Add webhook idempotency and verification.
- Add reconciliation and subscription-state tests.

### Phase 5 — API and AI hardening

- Extract services.
- Remove production mocks.
- Validate MCP and Dify inputs.
- Add consistent errors, pagination, and observability.

### Phase 6 — Testing, CI, docs, and cleanup

- Add automated test suites.
- Fix lint and build verification.
- Consolidate documentation.
- Remove unused files and assets after reference analysis.

### Phase 7 — Production readiness

- Staging verification.
- Backup and restore test.
- Monitoring and alerting.
- Security review.
- Deployment rollback rehearsal.

## 14. Definition of done

- Only Better Auth is installed and used.
- Google and email/password authentication work in staging.
- No production route depends on a development bypass.
- Cross-tenant access tests pass.
- Vault downloads enforce access grants.
- Real private storage is used.
- Lenco webhooks are signed, idempotent, and reconciled.
- Prisma migrations run from a clean database.
- Production routes contain no mock business fallbacks.
- Lint, type-check, tests, and build run non-interactively.
- Canonical documentation is current.
- Unused files and assets are removed only after reference verification.

## 15. Immediate next actions

1. Replace the interactive `next lint` script with non-interactive ESLint CLI configuration.
2. Resolve and document the Windows production-build process issue.
3. Expand integration/security coverage to MCP reads/writes, vault access, and upload-link controls.
4. Consolidate canonical documentation and perform reference-verified asset/file cleanup.
5. Add CI gates for lint, type-check, unit/integration tests, and production build.

Phase 6 dependency note: `pnpm audit --audit-level high` no longer reports the prior
critical Better Auth or Next.js findings. Nine moderate/high transitive findings
remain in `sharp`, PostCSS, and Prisma-related tooling and require follow-up before
production release.
