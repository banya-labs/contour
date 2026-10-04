# Matching and Agent PWA Parity Design

Date: 2026-10-04
Status: Implemented locally; release checks and runtime limitations are recorded in the verification document.
Baseline: eaa457efb79890b5d9f9fd0b0d8aa2e80e100e94

## Outcome

An agent sees real matching buyer/renter inquiries on a property card and inside its full record. Either entry opens the same property-filtered matching view with fit scores, reasons, contact context, and explicit next actions. PWA Contacts and Inquiries follow the desktop model: a Contact is identity; an Inquiry is a particular request attached to that Contact. One contact can have several inquiries.

User requirements:
- Show matching buyers/renters and their percentages automatically in the opened property record.
- Show a clickable match count on the property card; clicking goes directly to the results for that property.
- Inquiries uses Add inquiry; Contacts uses Add contact.
- Inquiry creation selects a contact and stores contactId, consistently with desktop.
- Address all correctness, performance, permission, notification, and offline gaps found in the matching audit.

Navigation interpretation: the requested buyers page is a focused matching results view inside the existing PWA, reachable from property cards, property details, and map properties. Do not add an unrelated global Buyers tab. Label rental results Matching renters and mixed listing results Matching inquiries.

## Chosen approach and alternatives

Use one deterministic matching policy/service and focused PWA components, with on-demand paginated results and lightweight summaries. This fixes divergent rules without introducing infrastructure.

Patching each surface independently is initially smaller but preserves drift in weights, lifecycle filters, and profile fields. Persisting every inquiry/property score in a new match table adds invalidation and data-growth complexity before measurements justify it. Neither is the selected approach.

## Domain and eligibility

- Contact stores name, phone, email, and contact-level notes. Inquiry stores intent, requirements, agent ownership, stage, outcome, and property attachment.
- Never merge inquiries just because their contact or phone is the same. Preserve existing inquiry idempotency keys through outbox retries.
- Active inquiry excludes CLOSED, CLOSED_WON, and CLOSED_LOST. Cancellation remains the existing typed terminal outcome.
- New-opportunity matching uses AVAILABLE properties. UNDER_OFFER can appear only in an explicit alternative-inventory view with a status warning and no new attachment action. Desktop, PWA, vault, and notifications use the same eligibility contract.
- Property summaries count active inquiries without propertyId. Agent assignment does not disqualify them. Already attached inquiries are shown in a separate Linked inquiries section and are not counted as new opportunities.
- An attached inquiry opens its linked property by default; changing property is an explicit re-match action. Terminal history remains visible through contact history but offers no attach action.
- No automatic property attachment or pipeline advancement.

## Matching policy

- Retain PROPERTY_MATCH_THRESHOLD = 70 and qualify only score > 70 with no hard failures.
- Keep existing weights initially. Scores represent fit points, not probability; label the percentage Fit.
- Hard gates: specified intent, currency, property type, plus explicit mustHave feature requirements. A must-have not confirmed in property metadata produces an explained failure rather than guessed satisfaction.
- Budget, area, bedroom, bathroom, and plot size remain soft preferences unless marked strict in optional matchingProfile.strictRequirements. Defaults are false to preserve existing inquiry intent. An explicitly strict unmet or unknown requirement fails qualification.
- Strict flags: budgetMax, preferredAreas, bedroomsMin, bathroomsMin, areaMinSqm. Display them as Required checkboxes on the corresponding inquiry fields on desktop and PWA; do not silently reinterpret legacy inquiries as strict.
- BOTH property pricing uses inquiry intent: renter -> rentalPrice; buyer -> askingPrice. Unknown inquiry intent must be selected before scoring BOTH; never guess between incompatible prices.
- Numeric fields come from persisted typed columns, with explicit Decimal-to-number conversion. JSON adds strict flags/features; it cannot overwrite updated structured budget/location/type fields.
- Normalize case, whitespace, and blank areas once. nearbyAreas is an explicit alias list. Name substring resemblance is a soft partial-area signal, never proof of a geographic distance or satisfaction of a strict area requirement.
- Preserve soft-default scoring for compatibility but return missingData and unmetPreferences. Explain the existing 10%-over-budget band as Within 10% above budget rather than Within budget.
- Nice-to-have features/keywords earn bonuses; do not double-count duplicates. Unknown values are distinct from zero.
- Return positive reasons, unmet preferences, hard failures, missing-data warnings, and effective price. A result over 70 with failed strict constraints is still rejected.
- Include a policyVersion identifier in cached result envelopes. No AI call is required; the unused extractor is not enabled by this work.

## Shared results and PWA interaction

Property card: clickable N matching buyers/renters badge when count > 0. Badge click does not trigger the surrounding card action. Counts refer to the same eligible, authorized inquiry population as the matching view.

Full property record: load a small matching preview automatically, ordered by fit descending; show names, linked contacts, percentages, and reasons. Include View all matches. Distinguish loading, no matches, permission denied, stale offline data, and request failure. Do not display errors as zero matches.

Matching results view: property header and filters remain visible; default Qualifying, optional Near matches. Query state preserves selected property and view on back navigation. Both buyers and renters use the same component. Deduplicate by inquiry ID, not contact ID.

Actions: Open inquiry; Open contact; Attach property; WhatsApp pitch. Attachment uses server-side atomic eligibility/reassignment checks and updates propertyId and matchStatus together. It does not advance stage. A separate Mark contacted action uses the transition endpoint after actual contact. WhatsApp opens a draft; it is not evidence of sent or delivered outreach.

Inquiry results: same result contract and explanatory labels. Provide Open property and Attach property when eligible. Near matches show rejection reasons and do not offer an invalid attachment.

Contact/inquiry creation: select an existing contact before saving an inquiry, matching desktop. Offer Create contact as a distinct action that returns to the inquiry and selects the saved contact. Do not edit contact identity through duplicated inquiry name/phone fields. Contact identity changes use contact endpoints. Reuse existing inquiry snapshots for display where required by current schema.

## Permissions and tenant boundaries

Risk: this work touches authorization and client PII. pwa.access must not grant broad organization-wide lead visibility.

- Add a field-scoped pwa.inquiries.read permission to FIELD_AGENT and explicit PWA read routes. Desktop leads.read behavior stays separate.
- PWA inquiry/matching population is assigned-to-current-agent OR unassigned-to-agent. Viewing/attaching other agents' inquiries requires the existing management/lead assignment authority; the 30-day ownership lock is enforced server-side.
- Apply that visibility predicate to summary counts, results, notifications, contact lookup, and contact history. PWA contacts are visible when created by the current agent according to existing audit provenance, linked to one of their visible inquiries, or explicitly available to management. Verify existing audit provenance before implementation; no contact-wide read permission shortcut.
- Use focused PWA contact/inquiry endpoints backed by shared CRM services. They return only the identity/detail fields needed for these workflows, deriving organizationId/userId from session.
- Unauthorized records cannot be inferred from counts. Foreign-tenant contact/property/inquiry IDs fail lookup without exposing details.
- Mutations retain existing management access and enforce agent ownership and property eligibility inside a transaction. No blanket grant of leads.read or broad properties/vault access to field agents.

## Performance, notifications, and offline

- Score only one property for property-specific reverse lookup. Filter eligible/scoped inquiries in the database first. Use exact hard-gate prefilters when semantically safe; never filter away a valid soft near-match.
- Ranked result requests: pageSize 20 by default, max 100, positive integer page; return total/page/hasMore. Stable order: score descending, ID ascending. Obtain the complete eligible population before ranking; do not silently truncate to the latest 100/500 records. Global exact sorting still costs O(candidate count); document that and measure it.
- List endpoints return counts and small previews, not every pair. Support explicit includeMatching=false for consumers that do not need matching. Cache summaries by tenant, visibility scope, policy version, and data revision/short TTL; invalidate on requirement, property, ownership, attachment, or terminal-state changes.
- Use maps for result hydration; no repeated array find/some scans. One normalized profile per inquiry, one normalized candidate per property.
- Both inquiry creation and property creation use the same scorer. Updates trigger refresh/reconciliation for the changed entity. Notifications use active/unattached eligibility, recipient ownership, and existing pair uniqueness. Read/delivery state is not reset by a read-only recalculation.
- Filter stale notifications at read time; do not count closed inquiries or unavailable properties. Agent-null notifications must respect visible-inquiry scope. Read state for shared notifications must not silently act as per-agent delivery proof.
- The PWA consumes the notification endpoint through a focused match inbox/count, linking to the same results view. No push infrastructure or automatic WhatsApp delivery is added.
- Cache match previews/results by tenant, user, property/inquiry, query, and policy version with lastUpdated. Offline: show cached results as stale; otherwise say Connect to check matches. Do not calculate unverified scores from partial local inventory. Pending outbox inquiries say Available after sync and never request a server match using a temporary ID.
- Clear scoped match caches on sign-out/tenant switch. Cancel/ignore superseded fetches so an old property's response cannot populate a new view.

## Delivery constraints

- Existing Next.js/React, Prisma/PostgreSQL, Zod, Vitest, and local-first cache; no new dependencies or second matching database.
- Draft design expects no new relational tables. Existing JSON can hold strict flags. If contact provenance or per-agent notification read state needs a schema change, present the exact evidence and additive migration separately before executing it; no production migration is authorized.
- Retain existing route compatibility for desktop/MCP callers. Do not rename /api/clients merely to fix UI wording.
- Existing tests: 9 matching unit tests passed during the audit. This does not establish route, PWA, or production correctness.

## Success criteria

The same inquiry/property pair produces the same score and eligibility in every surface. PWA property count, automatic detail preview, and opened results agree for the current user. A default field agent can complete the authorized workflow; another tenant and another agent's locked records remain inaccessible. A contact can have two distinct inquiries, both independently matchable. Attachment and contacted transitions are separate, auditable operations. Offline and failed requests do not masquerade as zero matches. No silent inventory cutoffs remain.
