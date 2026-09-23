# ESLint Stability Remediation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove all 304 ESLint errors and 298 warnings through typed, behavior-preserving code changes so Contour has a clean lint, typecheck, test, and production-build gate without weakening rules or hiding findings.

**Architecture:** Remediate by responsibility and dependency boundary. Shared runtime contracts and API response types are fixed first; feature screens then consume those types instead of casting with `any`. Client hooks are stabilized with `useCallback` and complete dependency arrays, while media and configuration findings are handled with framework-native components and named exports.

**Tech Stack:** TypeScript strict mode, Next.js 15 App Router, React 19, Prisma 6, Vitest 5, ESLint 9 flat config, `eslint-config-next`, PowerSync, Leaflet, S3/MinIO.

**Spec:** `docs/superpowers/specs/2026-09-23-contour-loading-feedback-system-design.md` and the current repository ESLint contract in `eslint.config.mjs`.

## Global Constraints

- Preserve tenant isolation, server-derived organization scope, Better Auth session boundaries, and billing/payment idempotency.
- Do not add `eslint-disable`, loosen `no-explicit-any`, suppress warnings, or exclude application files from lint.
- Replace `any` with domain types, `unknown` plus runtime narrowing, Zod-inferred payloads, or Prisma-generated types; do not use `as unknown as T` as a shortcut.
- Preserve `/kiosk`/`/agent` offline and PowerSync behavior and the existing editorial/operations design systems.
- Keep server-only modules server-only and do not move secrets or PII into client bundles.
- Every task ends with focused lint, typecheck, relevant tests, and `git diff --check`.
- No production migration, destructive data action, or dependency major upgrade without a separate verified task.

## Review Focus

- API error payloads: malformed, unauthorized, cross-tenant, and provider-failure responses must remain bounded and typed.
- Offline sync payloads: missing fields, stale outbox records, and partial network failures must not crash the field console.
- Hook dependencies: callbacks must not capture stale organization, property, or filter state.
- Media paths: remote and user-uploaded images must retain tenant-safe URLs and accessible fallbacks.
- Sensitive documents: vault and upload flows must not expose identifiers, presigned URLs, or provider errors through client state or logs.

## Baseline Inventory

Fresh ESLint JSON inventory on `fix/stabilize-errors-warnings-security` after the compiler/security slice:

- `@typescript-eslint/no-explicit-any`: 285 errors.
- `@typescript-eslint/no-unused-vars`: 262 warnings.
- `@next/next/no-img-element`: 22 warnings.
- `react/no-unescaped-entities`: 16 errors.
- `react-hooks/exhaustive-deps`: 12 warnings.
- `import/no-anonymous-default-export`: 2 warnings.
- `@next/next/no-html-link-for-pages`: 2 errors.
- `react/no-children-prop`: 1 error.

The full baseline is 304 errors and 298 warnings. Re-run `pnpm exec eslint . -f json` after every task group; do not rely on the count alone—review new and removed rule IDs.

## File Map and Type Contracts

### Shared contracts to establish first

- Modify `src/lib/api-handler.ts`: expose a typed `ApiErrorPayload`, `ApiSuccess<T>`, and `unknown`-safe error normalization; preserve status mapping and correlation IDs.
- Modify `src/lib/cache.ts`: generic cache helpers with `unknown` serialization boundaries and explicit `CacheValue` constraints.
- Modify `src/lib/dify-auth.ts`: typed bearer/auth context and `unknown` narrowing for provider responses.
- Modify `src/lib/alerts/matchmaker.ts`: define alert/property/client match interfaces and remove mutable singleton typing.
- Modify `src/lib/analytics/report-engine.ts`: define report row and metric interfaces from Prisma/query results.
- Add or extend focused tests beside each contract to pin malformed payloads, provider errors, and empty results.

### API routes

The following routes must consume the shared response/error contracts and Zod-inferred request types rather than local `any` casts:

- `src/app/api/agent/summary/route.ts`
- `src/app/api/analytics/ai-insights/route.ts`
- `src/app/api/analytics/report/route.ts`
- `src/app/api/clients/route.ts`
- `src/app/api/clients/[id]/route.ts`
- `src/app/api/dashboard/action-queue/route.ts`
- `src/app/api/dashboard/metrics/route.ts`
- `src/app/api/dify/tools/arrears/route.ts`
- `src/app/api/dify/tools/commission/route.ts`
- `src/app/api/dify/tools/documents/route.ts`
- `src/app/api/dify/tools/inquiries/route.ts`
- `src/app/api/documents/route.ts`
- `src/app/api/inquiries/route.ts`
- `src/app/api/leases/route.ts`
- `src/app/api/mcp/route.ts`
- `src/app/api/organization/agents/route.ts`
- `src/app/api/organization/access-requests/route.ts`
- `src/app/api/organization/invitations/claim/route.ts`
- `src/app/api/organization/members/route.ts`
- `src/app/api/powersync/token/route.ts`
- `src/app/api/properties/route.ts`
- `src/app/api/properties/[id]/photos/route.ts`
- `src/app/api/properties/extract-stand-boundary/route.ts`
- `src/app/api/properties/upload-image/route.ts`
- `src/app/api/sales/route.ts`
- `src/app/api/statements/route.ts`
- `src/app/api/storage/[fileId]/route.ts`
- `src/app/api/storage/upload/route.ts`
- `src/app/api/tasks/route.ts`
- `src/app/api/tasks/[id]/route.ts`
- `src/app/api/upload/[token]/route.ts`
- `src/app/api/vault/documents/route.ts`
- `src/app/api/vault/documents/[id]/route.ts`
- `src/app/api/vault/documents/[id]/download/route.ts`
- `src/app/api/vault/documents/[id]/preview/route.ts`

### UI and field-console files

- `src/app/(kiosk)/agent/page.tsx`: split response DTOs, property/intake/sync types, and event payloads into local interfaces or a focused `src/lib/field-console-types.ts`; retain offline queue semantics.
- `src/lib/powersync.tsx`: type database rows, outbox operations, sync callbacks, and provider context; use discriminated unions for property/client/lease/sale mutations.
- `src/components/map/interactive-property-map.tsx` and `src/app/(dashboard)/dashboard/map/page.tsx`: type Leaflet map refs, property markers, and map event handlers.
- `src/components/properties/property-360-detail-modal.tsx`, `property-image-uploader.tsx`, `property-stand-editor.tsx`, `location-coordinate-picker.tsx`, `title-deed-ocr-uploader.tsx`, `location-leaflet-picker-canvas.tsx`, `property-leaflet-canvas.tsx`, `property-location-map.tsx`, and `public-property-gallery.tsx`: type property/detail/media/boundary DTOs and remove unused icon/import declarations.
- `src/components/vault/document-details-modal.tsx`, `folder-collaborators-modal.tsx`, `request-document-modal.tsx`, `upload-document-modal.tsx`, `vault-access-modal.tsx`, `vault-property-grid.tsx`, and `vault-tree.tsx`: type document/access/collaborator DTOs, narrow fetch errors, and preserve secure download behavior.
- `src/components/workspace-sidebar.tsx`: type navigation tree nodes and remove dead active-state calculations.
- `src/components/pwa/contour-splash-screen.tsx` and `pwa-install-banner.tsx`: type browser install events and remove unused visual imports.

### Dashboard and marketing pages

- Dashboard pages: `src/app/(dashboard)/dashboard/page.tsx`, `analytics/page.tsx`, `analytics/print/page.tsx`, `billing/page.tsx`, `clients/page.tsx`, `commissions/page.tsx`, `documents/page.tsx`, `documents/access/page.tsx`, `leases/page.tsx`, `pipeline/page.tsx`, `properties/page.tsx`, `sales/page.tsx`, `settings/page.tsx`, and `statements/page.tsx`.
- Map/upload/public pages: `src/app/map/[[...orgSlug]]/page.tsx`, `src/app/upload/[token]/page.tsx`, `src/app/p/[slug]/page.tsx`, `src/app/admin/mcp/page.tsx`, `src/app/admin/page.tsx`, `src/app/cookies/page.tsx`, `src/app/error.tsx`, `src/app/onboarding/page.tsx`, and `src/app/page.tsx`.
- Marketing components: `agency-interactive-map.tsx`, `agency-leaflet-canvas.tsx`, `cinematic-hero-stage.tsx`, `curated-services-bento.tsx`, `editorial-manifesto-gallery.tsx`, `editorial-market-notes.tsx`, `editorial-testimonial-card.tsx`, `field-agent-pwa-mockup.tsx`, `film-scroll-overlays.tsx`, `interactive-intent-matrix.tsx`, `layered-hero-showcase.tsx`, `luxury-hero-stage.tsx`, `popia-faq-accordion.tsx`, `pricing-matrix.tsx`, `product-features.tsx`, `property-showcase-gallery.tsx`, `roi-leak-calculator.tsx`, `social-media-card-generator-modal.tsx`, and `whatsapp-syndication-showcase.tsx`.

### Configuration and test files

- `eslint.config.mjs`: name the exported config array before export to remove anonymous-default-export.
- `postcss.config.mjs`: name the config object before export.
- `src/components/ui/loading-feedback.test.ts`: pass children as React children, not `children` prop.
- Replace internal same-app `<a>` links flagged by `@next/next/no-html-link-for-pages` with `next/link` after confirming route semantics.

## Implementation Tasks

### Task 1: Freeze baseline and add lint reporting

**Files:** Create `scripts/report-eslint.mjs`; modify `package.json` scripts only if needed.

- [ ] Add a machine-readable report command that groups findings by rule and file without changing ESLint rules.
- [ ] Capture the baseline JSON outside the repository or in an ignored artifact directory.
- [ ] Add a focused command for a changed-file set so every later task can run a short gate.
- [ ] Verify the report reproduces 304 errors, 298 warnings, and the rule counts above.
- [ ] Commit: `chore(lint): add deterministic eslint remediation report`.

### Task 2: Establish shared runtime types and tests

**Files:** `src/lib/api-handler.ts`, `src/lib/cache.ts`, `src/lib/dify-auth.ts`, `src/lib/alerts/matchmaker.ts`, `src/lib/analytics/report-engine.ts` and their tests.

- [ ] Write tests for invalid JSON, non-Error throws, provider error objects, empty report data, and cache values containing `null`/arrays.
- [ ] Replace `any` with `unknown`, explicit interfaces, Zod inference, and generic helpers.
- [ ] Ensure error normalization never serializes credentials, URLs with secrets, or raw provider response bodies.
- [ ] Run focused tests, typecheck, and ESLint for these files; expected: zero findings in the touched shared libraries.
- [ ] Commit: `refactor(types): establish safe shared runtime contracts`.

### Task 3: Remediate security-sensitive API routes

**Files:** all routes listed in the API route section, executed in groups: auth/organization, billing/financial, storage/vault, property/media, analytics/AI, and operational CRUD.

- [ ] For each route, identify the request schema, authenticated organization source, Prisma result type, and response DTO before editing.
- [ ] Replace `any` error/request/response casts with schema-inferred types and `unknown` narrowing.
- [ ] Preserve server-side tenant derivation and permission checks; add regression tests for cross-tenant IDs and malformed payloads where absent.
- [ ] Replace raw internal links only where the route is a page navigation, not webhook/provider URLs.
- [ ] Run route tests, typecheck, and per-group ESLint after each group.
- [ ] Commit one conventional commit per group: `refactor(api): type organization routes`, `refactor(api): type storage and vault routes`, `refactor(api): type property and media routes`, and `refactor(api): type analytics and operations routes`.

### Task 4: Type PowerSync and the field console

**Files:** `src/lib/powersync.tsx`, `src/app/(kiosk)/agent/page.tsx`, `src/components/pwa/pwa-install-banner.tsx`, `src/components/pwa/contour-splash-screen.tsx`.

- [ ] Define discriminated mutation types for `property`, `client`, `lease`, `sale`, and `inquiry` records.
- [ ] Type sync status, outbox entries, retry/error states, browser install events, and modal callbacks.
- [ ] Narrow data loaded from local SQLite before rendering; preserve offline-first behavior when fields are missing or stale.
- [ ] Stabilize `useEffect` dependencies by memoizing sync callbacks with `useCallback`; avoid adding unstable objects directly to dependency arrays.
- [ ] Remove unused imports and unused destructured fields only after confirming they are not required by JSX side effects.
- [ ] Add/extend offline queue and stale-record tests; run field-console focused lint, tests, typecheck, and build.
- [ ] Commit: `refactor(field): type offline sync and agent console state`.

### Task 5: Type maps, properties, and media flows

**Files:** `interactive-property-map.tsx`, dashboard map page, property detail/media/boundary files listed above.

- [ ] Create shared `PropertySummary`, `PropertyDetail`, `Boundary`, `Marker`, and upload result types.
- [ ] Type Leaflet refs and event callbacks without `any`; guard browser-only access.
- [ ] Replace user-visible `<img>` elements with `next/image` where dimensions and trusted source policy permit; retain plain `<img>` only for canvas/data/blob cases and document the reason in code.
- [ ] Ensure object URLs are revoked and failed images render an accessible fallback.
- [ ] Add tests for empty properties, missing coordinates, failed uploads, and revoked object URLs.
- [ ] Commit: `refactor(properties): type map and media workflows`.

### Task 6: Type vault and document custody flows

**Files:** all vault components and vault/document/upload API routes listed above.

- [ ] Define document metadata, access request, collaborator, presigned URL, and verification result types.
- [ ] Narrow server errors and never put raw S3/MinIO responses into client state.
- [ ] Complete hook dependency arrays by memoizing fetch functions; ensure organization/document IDs are dependencies.
- [ ] Remove unused dialog/icon props only after checking accessible labels and keyboard behavior.
- [ ] Add tests for unauthorized access, expired upload tokens, missing document IDs, and provider failure redaction.
- [ ] Commit: `refactor(vault): type secure document custody flows`.

### Task 7: Clean dashboard data and hook usage

**Files:** all dashboard pages in the dashboard section.

- [ ] Create page-local DTO types where response shapes differ; do not create one global `DashboardData` catch-all.
- [ ] Replace `any` with typed API results and safe fallback values for loading/empty/error states.
- [ ] Remove unused icons, links, setters, and derived values; preserve visible actions and analytics semantics.
- [ ] Memoize fetch/report callbacks and correct every exhaustive-deps finding by dependency analysis, not by disabling the rule.
- [ ] Add regression tests for empty API payloads, failed fetches, and filter changes that must trigger a new request.
- [ ] Commit by page family: `refactor(dashboard): type analytics and overview screens`, `refactor(dashboard): type operations screens`, and `refactor(dashboard): type billing and settings screens`.

### Task 8: Clean marketing and public pages

**Files:** all marketing components and public/admin pages listed above.

- [ ] Replace component callback/data `any` with explicit props and discriminated unions.
- [ ] Remove unused decorative imports and state setters without altering the editorial visual system.
- [ ] Replace navigational raw anchors with `next/link`; retain external/WhatsApp links as anchors with explicit security attributes where needed.
- [ ] Replace safe static image tags with `next/image`, supplying dimensions or `fill` plus a positioned parent; retain canvas-generated images only where required.
- [ ] Encode visible quote marks/apostrophes as JSX entities or text nodes to remove unescaped-entity errors.
- [ ] Add public listing, calculator, and marketing interaction smoke tests where behavior changes.
- [ ] Commit: `refactor(marketing): type public experiences and media rendering`.

### Task 9: Configuration and test hygiene

**Files:** `eslint.config.mjs`, `postcss.config.mjs`, `src/components/ui/loading-feedback.test.ts`, and any remaining two raw internal-link files.

- [ ] Name default-exported config values before export.
- [ ] Correct React test element construction so children are passed as children.
- [ ] Replace remaining internal page anchors with `Link` and verify route generation.
- [ ] Run the focused config/test lint gate and full tests.
- [ ] Commit: `chore(lint): clean configuration and test findings`.

### Task 10: Full verification and release gate

- [ ] Run `pnpm exec eslint .`; expected: 0 errors and 0 warnings.
- [ ] Run `node node_modules/typescript/bin/tsc --noEmit --pretty false --incremental false`; expected: exit 0.
- [ ] Run `pnpm test`; expected: all tests pass, with any skipped test explicitly documented and intentional.
- [ ] Run `node node_modules/next/dist/bin/next build`; expected: exit 0 with no unexpected warnings.
- [ ] Run `pnpm audit --audit-level=moderate`; expected: no known vulnerabilities.
- [ ] Run `git diff --check` and inspect the complete diff for tenant/auth/payment/storage regressions.
- [ ] Update `CHANGELOG.md` with the lint/security stabilization summary and known behavior-preservation notes.
- [ ] Commit: `chore(quality): complete lint and warning remediation`.
- [ ] Merge to `main` only after review of all task commits; push only after the final verification gate is green.

## Verification Matrix

| Task group | Focused lint | Typecheck | Tests | Build | Security |
|---|---:|---:|---:|---:|---:|
| Shared contracts | Required | Required | Contract tests | No | Error redaction review |
| API routes | Required per group | Required | Route/tenant tests | No | Tenant and secret review |
| Field console | Required | Required | Offline/sync tests | Required | PII cache review |
| Maps/media | Required | Required | Upload/map tests | Required | URL/object URL review |
| Vault | Required | Required | Access/token tests | Required | Presigned URL review |
| Dashboard | Required | Required | Empty/error/filter tests | Required | Scope review |
| Marketing/public | Required | Required | Smoke tests | Required | External link review |
| Final gate | Full | Full | Full | Full | Full audit |

## Self-Review and Gaps

- The plan covers every file reported by the fresh ESLint inventory through grouped file lists and explicit hotspot tasks.
- No rule is disabled or downgraded; all fixes must change code, types, imports, dependencies, or framework usage.
- The existing lint output does not prove every finding has a unique root cause; each task requires focused reproduction before editing.
- The current skipped Dify tenant-isolation integration test remains an explicit review item; it must be enabled with a disposable database or documented as an environment-gated test before the final gate.
- Raw `<img>` findings require case-by-case review because canvas/blob/data URLs may not be safely convertible to `next/image`.
