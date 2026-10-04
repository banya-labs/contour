# Matching and Agent PWA Parity Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans to implement this plan task-by-task. No subagent dispatch unless the user selects that execution method. Steps use checkbox syntax for tracking.

**Goal:** Make matching correct and consistent across Contour, expose useful property matches in the Agent PWA, and align PWA contacts/inquiries with desktop.

**Architecture:** One pure matching policy plus a tenant/visibility-aware query service feeds summaries, ranked results, and notifications. Focused PWA match and inquiry components reuse existing CRM records and mutations. Matching suggestions, attachment, pipeline transitions, and WhatsApp drafts remain distinct actions.

**Tech Stack:** Existing Next.js, React, TypeScript, Prisma/PostgreSQL, Zod, Vitest, PowerSync/local-first cache.

**Spec:** ../specs/2026-10-04-matching-pwa-parity-design.md

## Global constraints

- PROPERTY_MATCH_THRESHOLD = 70; qualification is strictly score > 70 and no hard failures.
- Default new-opportunity property status AVAILABLE; exclude CLOSED, CLOSED_WON, CLOSED_LOST inquiries.
- Contact identity belongs to Contact; inquiry requirements belong to Inquiry; multiple inquiries per contact are valid.
- Field agent scope is own-agent OR agent-unassigned inquiries; management access is explicit and server checked.
- No new dependencies, automated WhatsApp delivery, automatic stage advancement, or production migrations.
- pageSize defaults 20, maximum 100; stable score-descending/ID-ascending ordering; no silent latest-record cutoff.
- Existing API compatibility must be maintained; updates to default eligibility require regression review across desktop/vault/MCP callers.

## Review focus

1. BOTH rental property with missing rentalPrice must not use sale price (Task 1).
2. Two inquiries for one contact must retain separate IDs through retries and matching (Task 5).
3. Agent ownership/tenant changes must not reuse another scope's counts or cache (Tasks 2 and 8).
4. A property becoming unavailable between review and attachment must reject the mutation (Task 6).
5. A slow response for property A must not overwrite property B results (Tasks 4 and 8).

## Task 1: Canonical profiles, policy, and explanations

**Modify:** src/lib/matching/types.ts, score.ts, inquiry-profile.ts, inquiry-property-match.ts and their existing tests; src/lib/validations/index.ts. Inspect schema exports before editing validation contracts.
**Create:** src/lib/matching/policy.ts, property-profile.ts, policy.test.ts.
**Interfaces:** buildInquiryMatchingProfile(source) -> InquiryMatchingProfile; buildPropertyMatchingCandidate(source) -> MatchingCandidate; scorePropertyForInquiry(profile, candidate) -> MatchResult; isQualifyingMatch(result) -> boolean. Extend MatchResult with effectivePrice, unmetPreferences, missingData; profile with strictRequirements; policy exports active status predicates and MATCH_POLICY_VERSION.

- [ ] Add failing cases: 70 is rejected, 71 qualifies absent hard failures; BOTH rent uses rentalPrice; missing rent never uses askingPrice; strict budget/area rejects; default soft budget retains current weights; unknown must-have rejects; duplicates earn one feature bonus; repeated spaces and blank locations normalize; typed columns outrank stale JSON.
- [ ] Run `pnpm exec vitest run src/lib/matching` and confirm failures expose the intended defects.
- [ ] Implement normalized numeric profiles, intent-aware price, hard constraints, accurate budget reason labels, missing-data explanations, and deterministic tie ordering. Keep the old simple matcher only as a temporary adapter to canonical qualification until all consumers are migrated.
- [ ] Add strict flag validation and persistence to inquiry create/update paths; never allow raw JSON to override typed identity/requirements.
- [ ] Re-run matching tests and validation tests; expected all targeted cases pass. Commit `fix(matching): unify scoring and eligibility policy`.

## Task 2: Field-scoped read permissions and shared query contracts

**Modify:** src/lib/authorization.ts, src/lib/tenant-context.ts as needed for preset resolution; src/lib/crm/contact-service.ts.
**Create:** src/lib/matching/service.ts, visibility.ts, service.test.ts, visibility.test.ts; src/app/api/agent/inquiries/route.ts; src/app/api/agent/contacts/route.ts; src/app/api/agent/contacts/[id]/route.ts; src/app/api/agent/matching/properties/[id]/route.ts; src/app/api/agent/matching/inquiries/[id]/route.ts.
**Interfaces:** MatchingScope { organizationId, userId, permissions }; getPropertyInquiryMatches(scope, propertyId, { page, pageSize, view }) and getInquiryPropertyMatches(scope, inquiryId, query) -> { results, total, page, pageSize, hasMore, threshold, policyVersion, calculatedAt }. view = qualifying | near. Results hydrate minimal property/inquiry/contact summaries using maps. scoped inquiry/contact list responses retain fields consumed by the existing provider.

- [ ] Add failing route/service tests for default FIELD_AGENT access, unauthenticated rejection, foreign tenant IDs, hidden other-agent inquiry/count, management access, own/unassigned visibility, contact history scoping, and invalid pagination.
- [ ] Verify contact-creation audit provenance supports the spec's contact visibility predicate. If it cannot reliably identify ownership, stop this task and present an exact additive ownership proposal; do not substitute tenant-wide access.
- [ ] Add pwa.inquiries.read to the field preset and explicit PWA read routes. Reuse shared CRM query logic; do not grant leads.read. Preserve existing desktop routes and their permission boundaries.
- [ ] In the reverse service fetch only the selected property, then score the full eligible scoped inquiry population. Apply pagination after exact qualification/ranking; filter stale status and attached records.
- [ ] Run new tests plus authorization/tenant tests discovered in the repo. Assert one property candidate scored per visible inquiry in reverse requests, and fixtures beyond 100 inquiries/500 properties remain discoverable. Commit `fix(pwa): authorize scoped matching and crm reads`.

## Task 3: Consistent summaries and all existing matching consumers

**Modify:** src/app/api/clients/route.ts; src/app/api/clients/[id]/matches/route.ts; src/app/api/matching/unassigned/route.ts; src/app/api/properties/route.ts; src/app/api/vault/documents/route.ts; src/lib/powersync.tsx; src/lib/matching/service.ts; src/lib/cache.ts if new invalidation tags are necessary.
**Create:** src/app/api/agent/matching/summaries/route.ts; src/lib/matching/consistency.test.ts.
**Interfaces:** getMatchingSummaries(scope, propertyIds, inquiryIds) -> { propertySummaries, inquirySummaries, calculatedAt, policyVersion }; summary { id, qualifyingCount, topMatches } with at most two preview results. Validate at most 100 IDs per request; caller batches visible items. includeMatching=false skips legacy list expansion.

- [ ] Pin identical score/eligibility across inquiry list, inquiry detail, property detail, reverse feed, creation responses, and vault. Cover budgetMin, bedroomsMin, bathroomsMin, areaMinSqm and JSON preference fields.
- [ ] Replace independent profile construction/simple matching with canonical service calls. Separate linked inquiries from new-opportunity counts; use explicit AVAILABLE default everywhere.
- [ ] Switch PWA refresh to scoped inquiry/contact APIs and lightweight matching summaries, preserving existing provider return shape and active filtering. Request no legacy full pair lists for the PWA.
- [ ] Bound list APIs with compatible pagination; update every caller to consume pagination or summaries. Return explicit completeness metadata rather than silently cutting off old records. Add role/data revision to summary cache keys and mutation invalidation.
- [ ] Run consistency tests and inspect all consumers with `rg -n 'inquiryMatchesProperty|scorePropertyForInquiry|scoreAllPropertiesForInquiry|matchingInquiryCount|matchingProperties' src`. Only canonical adapters/service may contain policy decisions. Commit `refactor(matching): share summaries across surfaces`.

## Task 4: Property card, automatic record preview, and results navigation

**Modify:** src/app/(kiosk)/agent/page.tsx; src/components/properties/property-360-detail-modal.tsx; src/components/matching/inquiry-match-modal.tsx.
**Create:** src/components/matching/property-inquiry-match-view.tsx; src/components/matching/match-preview.tsx; src/hooks/use-property-inquiry-matches.ts.
**Interfaces:** usePropertyInquiryMatches(propertyId, query) exposes loading/error/results/pagination/staleness; PropertyInquiryMatchView consumes shared envelopes and callbacks openInquiry/openContact/attachProperty/pitch. PWA URL state uses matchPropertyId and matchView; closing removes only match state and restores originating property/tab.

- [ ] Build the shared property-filtered results view with buyer/renter labels, percentages marked Fit, reasons, qualifying/near views, and explicit empty/error states.
- [ ] Make property card match badge clickable without bubbling to the card. Full record automatically loads a preview and offers View all matches. Both open the same property-filtered view.
- [ ] Route the map button through the same loader/navigation function; eliminate setMatchedProperty-only entry paths. Protect against late responses using abort/request identity checks.
- [ ] Show linked inquiries separately; never inflate opportunity counts. Inquiry match modal exposes near results, Open property, and explicit attachment eligibility.
- [ ] Browser-check card -> results, record -> automatic preview -> results, map -> correct results, renter labels, no matches, denied access, failed fetch, and rapid A/B selection. Record screenshots. Commit `feat(pwa): expose property matching workflow`.

## Task 5: Contact-linked inquiry capture with desktop parity

**Modify:** src/app/(kiosk)/agent/page.tsx; src/app/(dashboard)/dashboard/clients/page.tsx; src/app/(dashboard)/dashboard/contacts/page.tsx where shared behavior changes; src/lib/powersync.tsx; src/app/api/clients/route.ts; src/app/api/clients/[id]/route.ts; src/lib/validations/index.ts.
**Create:** src/components/pwa/inquiry-capture-form.tsx; src/lib/crm/inquiry-capture.ts and inquiry-capture.test.ts.
**Interfaces:** buildInquiryCapturePayload(form, selectedContact) -> validated inquiry body, preserving contactId, typed requirements, strict flags, idempotencyKey and creationSurface. Shared validation follows existing Zod contracts.

- [ ] Add failing payload assertions: minimum bedrooms is numeric bedroomsMin, every typed criterion survives capture/outbox, missing contact blocks save, repeated submission uses the same logical mutation key, separate inquiries for one contact remain separate.
- [ ] Replace Add Client/create/edit-client wording with Add inquiry/Edit inquiry where editing requests. Contacts retains Add contact/Edit contact. Show linked contact and Open contact in inquiry details.
- [ ] Require contact selection; load searchable contacts regardless of the entry tab. Provide a distinct Create contact action that saves via the existing contact mutation and returns/selects it. Prefill identity read-only; edit identity through contact endpoints.
- [ ] Add contact -> Add inquiry entry with preselection. Expose the same budget, location, type, bedroom, bathroom, size, required flags and request-notes meanings on desktop/PWA. Keep contact notes separate from inquiry notes.
- [ ] Remove phone-based suppression of distinct pending inquiries. Preserve payload/snapshot fields through local cache and match pending status; online-only contact creation is explicit until a confirmed contactId exists.
- [ ] Test two inquiries for one contact, no duplicate contact creation, retained contact on validation failure, and local capture/retry. Commit `fix(pwa): align contact and inquiry capture`.

## Task 6: Atomic attachment and explicit follow-up actions

**Modify:** src/app/api/clients/[id]/route.ts; src/app/api/clients/[id]/transition/route.ts only if authorization/scoping needs correction; src/components/matching/unassigned-match-panel.tsx; new match views and relevant dashboard property matching actions.
**Create:** src/lib/matching/attach-property.ts and attach-property.test.ts.
**Interfaces:** attachPropertyToInquiry(scope, { inquiryId, propertyId, expectedPropertyId }) -> updated inquiry; transaction checks current organization, active state, availability, agent ownership/lock, and expected attachment. propertyId/matchStatus update together. Failure is a structured 403/404/409 with no partial write.

- [ ] Write failing cases for stale attachment, property now SOLD/RENTED/UNDER_OFFER, terminal inquiry, other-agent lock, foreign tenant, successful attachment with unchanged stage, and concurrent competing property choices.
- [ ] Implement the transactional service; route both PWA and desktop attachment through it. Reassignment requires an explicit expected attachment; refresh on conflicts.
- [ ] Add Attach property actions; refresh counts, linked records and selected inquiry after success without losing context. Rename misleading Assign & Contact to Attach property; remove copy claiming automatic Contacted advancement.
- [ ] Keep Mark contacted as a separate existing transition request. Pitch opens WhatsApp draft and never sets SENT/delivery or advances stage. Add audit details for old/new property attachment IDs.
- [ ] Run attachment and existing pipeline tests; browser-check attach -> linked property -> explicit contact transition. Commit `fix(matching): make attachment explicit and atomic`.

## Task 7: Notification generation, reconciliation, and PWA consumption

**Modify:** src/lib/matching/inquiry-match-notifications.ts; src/app/api/notifications/matches/route.ts; src/app/api/inquiries/route.ts; src/app/api/clients/route.ts; src/app/api/clients/[id]/route.ts; src/app/api/properties/route.ts and any dedicated property mutations found by caller audit.
**Create:** src/lib/matching/notifications.test.ts; src/components/matching/match-notification-inbox.tsx.
**Interfaces:** reconcileMatchNotifications(scope, { inquiryId? , propertyId? }) uses the canonical matching service and pair uniqueness; read queries apply current scope/lifecycle eligibility. Inbox links to matchPropertyId results and includes last refreshed state.

- [ ] Add failing tests proving property-first and inquiry-first produce identical qualified pairs; repeated calls do not duplicate/reset read state; changed requirements/ownership/status change visible notifications; terminal/unavailable pairs disappear from active unread counts.
- [ ] Use shared normalized candidates including plotSizeSqm and all inquiry requirements. Replace quadratic property/result lookup with maps/sets. Wire successful create/update/attachment/terminal changes to reconcile or filter/invalidate as applicable.
- [ ] Bound notifications with real pagination and compute unread count across eligible visible notifications, not only the latest page. Keep historical records and status strings backward compatible; no pretend delivery evidence.
- [ ] Add PWA match inbox/count and view-results navigation; own/unassigned notification visibility follows Task 2. Flag shared read-state limitation honestly; do not implement per-agent reads without the separate additive schema decision described in the spec.
- [ ] Run notification/service tests; verify no scorer divergence on mutation paths. Commit `fix(matching): reconcile and expose match notifications`.

## Task 8: Offline cache, stale state, and request safety

**Modify:** src/lib/powersync.tsx; src/lib/local-first/cache.ts; src/hooks/use-property-inquiry-matches.ts; PWA match views.
**Create:** src/lib/matching/result-cache.ts and result-cache.test.ts.
**Interfaces:** cache key includes tenant/user/entity/query/policyVersion; cached envelope includes calculatedAt. Cache writes require current scope/request identity. Use existing local-first storage; never persist tokens or expanded unneeded PII.

- [ ] Test different tenants/users cannot share cached results; policy version changes miss cache; sign-out/scope switch clears results; pending IDs never hit server APIs; late A responses cannot populate B.
- [ ] Cache successful result pages/previews only. Offline fallback says Cached matches, last checked <time>; no cached result says Connect to check matches. Do not locally score partial inventory or show synthetic zero-match success.
- [ ] Refresh on reconnect, successful inquiry/property/attachment mutation, and explicit refresh. Preserve the selected property/contact/inquiry; refresh permission failures visibly rather than silently retaining another scope's data.
- [ ] Browser-check offline cached and uncached paths, queued inquiry upload, sign-out, tenant switch, and reconnect. Commit `fix(pwa): preserve truthful offline match state`.

## Task 9: Regression, performance evidence, and handoff

**Modify:** existing surface/form test scripts only where necessary; this plan's verification record.

- [ ] Run `pnpm exec vitest run src/lib/matching` plus focused CRM, authorization, PWA inquiry, outbox, and pipeline suites. Record exact commands/results.
- [ ] Run `pnpm typecheck`, targeted ESLint, `pnpm build`, `pnpm exec prisma validate`, and `git diff --check` separately. Distinguish pre-existing diagnostics, hangs, and unverified checks from passing evidence.
- [ ] Fixture-smoke a tenant with >500 properties and >100 inquiries. Verify stable paging, all discoverable candidates, and agreement of counts/previews/results. Measure server scoring time, request payload size, and request count against the audit baseline; report observations rather than asserting unmeasured latency targets.
- [ ] Authenticate as default field agent, management, and a second tenant. Verify both authorized actions and denials; test contact history without resurrecting terminal inquiries into active matching.
- [ ] Browser-smoke all acceptance criteria in the spec at mobile width and desktop. Capture property card, automatic record pr eview, results, contact-linked creation, and offline state screenshots.
- [ ] Complete whole-diff correctness/security review; document any scope/migration decisions and unresolved pre-existing failures. No production deployment, production migration, or push to main is part of this plan request.

## Delivery order and review decisions

Tasks 1-3 establish trusted matching/data contracts. Tasks 4-6 deliver the requested PWA property and contact/inquiry workflow. Tasks 7-8 complete notifications and offline behavior. Task 9 provides release evidence.

Proposed policy choices to review before application implementation: AVAILABLE-only default; strict flags opt-in for legacy compatibility; confirmed must-haves as hard constraints; own/unassigned agent visibility; reuse existing PWA navigation for the buyers/renters results view. These choices are explicit in the spec rather than hidden in implementation.

Plan self-review: all audit findings mapped to tasks; user requirements mapped to Tasks 4 and 5; performance to Tasks 2/3/9; identity/permission/cache/atomic-mutation risks have dedicated assertions. The document is a plan, not proof of implemented behavior.


## Execution record — 2026-10-04

Tasks 1-8 have been implemented locally. Task 9 has local unit, schema, source, lint and browser-fixture evidence, with production build and live tenant/database verification still pending. The checklist above is the original execution contract; unchecked runtime requirements must not be interpreted as passing evidence. Changes are consolidated on the existing dedicated branch rather than split into nine task commits.

See [verification record](2026-10-04-matching-pwa-parity-verification.md) for delivered behavior, actual checks, the independent review fixes and release limitations.
