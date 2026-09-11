# Contour Onboarding, Agency RBAC, Branding, and Secure Storage Plan

**Status:** Implementation in progress — Phase A/B foundation and the first Phase C/D/E enforcement slice are implemented locally; production migration and remaining team/storage workflows are still pending.

### Current implementation trace

- Phase A: permission catalog, fixed role presets, onboarding Zod contracts, and authorization tests added.
- Phase B: additive Prisma schema and forward migration added for profiles, assets, roles, assignments, overrides, invitations, and upload sessions; legacy role compatibility retained.
- Phase C: profile completion API and onboarding market/currency/agency fields added.
- Phase D/E slice: server-side permission checks added to PWA/dashboard middleware, vault routes, storage routes, and core property/client mutations; object keys are opaque and direct uploads are HEAD-verified with size/type/checksum metadata.
- Verification: `prisma validate` and `tsc --noEmit` pass. Vitest is currently blocked by Windows `esbuild` worker spawn `EPERM` in this checkout.

**Project:** Contour — Real Estate Operations & Field Agent Operating System

**Date:** 2026-09-11

## 1. Decision summary

Build one guided agency onboarding flow on top of Better Auth organizations, then enforce application permissions from the authenticated organization membership on every server route and UI surface.

Use the existing MinIO/S3-compatible object-storage boundary for agency logos and legal documents. Store only object metadata and object keys in PostgreSQL. Never store presigned URLs as durable database values, and never expose MinIO credentials or unrestricted bucket URLs to the browser.

The recommended first release uses a fixed Contour permission catalog and role templates. It does **not** begin with arbitrary user-created roles or per-record ACLs. That keeps authorization reviewable and prevents a complex permissions builder from becoming a security liability. Custom roles can be added after the fixed policy has been exercised in real agencies.

## 2. Current repository evidence

The codebase already has useful foundations, but the user-facing workflow is incomplete:

- Better Auth is configured with the organization and bearer plugins in `src/lib/auth.ts`.
- `/onboarding` currently asks only for organization name and slug, then selects the first organization.
- `Organization` already has `name`, `slug`, `logo`, subscription fields, and an organization relation graph.
- Better Auth `Member` currently stores a free-form `role` string. `resolveApplicationRole()` maps only `owner` to `SUPER_ADMIN`, `admin` to `BROKER_MANAGER`, and everything else to the user's global role.
- The global `User.role` enum contains `SUPER_ADMIN`, `BROKER_MANAGER`, `FIELD_AGENT`, `FINANCE_OFFICER`, `LANDLORD`, and `TENANT`. This is not sufficient as the primary agency authorization source because one user can belong to multiple organizations.
- `createApiHandler()` resolves an active organization and checks membership, but `requireRoles` is coarse-grained and many routes still need explicit permission enforcement.
- The sidebar hides some dashboard items for non-principal roles, but UI hiding is not authorization.
- `/agent` is the field-agent PWA surface, but the route policy needs an explicit server-side role/permission rule.
- The vault has organization-scoped documents, vault grants, 15-minute presigned downloads, and direct presigned uploads.
- `S3StorageService` supports MinIO/S3-compatible storage and tenant-prefixed object keys.
- The public document portal supports token links, optional PINs, direct presigned uploads, consent capture, and vault record creation.
- The public upload route currently trusts client-supplied object keys and file metadata after presigning; it does not verify the uploaded object with a server-side HEAD/checksum/size check.
- Upload PINs are currently compared using an unsalted SHA-256 hash, without attempt throttling or lockout.
- Vault download authorization currently checks organization and document existence but does not apply the same assigned-property/classification grant rules used by vault listing.
- `Organization.logo` is currently just a string; no secure logo upload workflow is wired to MinIO.
- Existing settings copy still says organization administration will be enabled in the tenancy phase.

## 3. Product objectives

### Must be true after implementation

1. A new agency can create its organization without needing support.
2. Onboarding captures the minimum operational profile needed to configure Contour.
3. An agency can upload an optional logo with type, size, checksum, and storage validation.
4. The first organization creator becomes the organization owner and cannot accidentally be downgraded by normal staff actions.
5. Owners and permitted administrators can invite users, assign an approved role, resend/revoke invitations, deactivate members, and review an audit trail.
6. Field agents and admin staff default to the PWA only; dashboard, vault, financial, and administrative access is denied unless a permission is explicitly granted by policy.
7. Every protected API checks both organization membership and a permission, not only a client-supplied role or hidden navigation item.
8. Legal documents remain private in MinIO, use tenant-scoped object keys, and are accessed through short-lived authorized presigned URLs.
9. Uploads cannot create database records pointing to objects that were never uploaded, exceed policy limits, or belong to another organization.
10. A failed upload, expired invite, revoked member, or expired document link has a clear recovery path and an auditable event.

### Explicit non-goals for the first release

- Arbitrary customer-authored policy languages.
- Per-row ACLs for every property field.
- Encrypting files in browser JavaScript with an agency password. That would create key-recovery and lost-password failure modes; MinIO server-side encryption plus strict authorization is the safer baseline.
- Making the entire MinIO bucket public for convenience.
- Allowing a client to choose `organizationId`, `uploadedById`, vault classification, or object key as an authority-bearing field.

## 4. Architecture challenge and recommendation

### Decision

Use organization-scoped membership roles plus a fixed permission catalog, with Better Auth remaining the identity and organization-membership source of truth.

### Current choice to avoid

Do not treat `User.role` as the complete RBAC model. It is global to a user, while agency access is organization-specific. A broker could be a manager in one agency and a field agent in another.

### Alternatives considered

| Option | Benefit | Risk | Decision |
|---|---|---|---|
| Global `User.role` only | Smallest schema | Cross-agency privilege leakage; cannot model different agency responsibilities | Reject |
| Better Auth `owner/admin/member` only | Native organization support | Too coarse for finance, legal, field, and PWA-only policies | Reject as the complete model |
| Fixed Contour roles + permission catalog | Reviewable, fast to ship, easy to test, supports agency workflows | Requires a central policy map and migration of existing roles | Recommend |
| Fully custom roles and arbitrary permission builder | Flexible for enterprise customers | High complexity, difficult UX, easy privilege escalation, difficult support | Defer |

### Recommended policy shape

- Better Auth membership establishes whether the user belongs to the active organization.
- A Contour membership role establishes the agency responsibility.
- A fixed permission catalog determines each role's capabilities.
- Optional scoped grants are used only for the vault and assigned properties, where the existing domain already requires them.
- The server is authoritative. React components may hide controls for usability but cannot grant access.
- Every authorization decision records actor, organization, action, target type, target ID where available, and outcome for sensitive actions.

## 5. Onboarding experience

### Step 0 — Authentication completion

After email/password or Google authentication, route the user to an onboarding state machine rather than directly to `/dashboard`.

States:

- `AUTHENTICATED_NO_ORGANIZATION`
- `ORGANIZATION_PROFILE_REQUIRED`
- `BRANDING_OPTIONAL`
- `INVITE_TEAM_OPTIONAL`
- `ONBOARDING_COMPLETE`
- `ONBOARDING_ERROR`

The server must re-check the session and active membership at every mutation. The client must not infer completion from local storage.

### Step 1 — Agency profile

Collect and validate:

- Agency/legal trading name — required.
- Unique workspace slug — required, normalized, reserved-word checked, and collision-safe.
- Country/operating market — default Zambia, but explicit for future Southern African expansion.
- Primary currency — default ZMW; support the existing allowed currencies only.
- Time zone — default `Africa/Lusaka`.
- Primary office address and city — optional at first, required before public listing/share features.
- Main contact phone and email — validate regional formats and record the authenticated owner as the source where appropriate.
- Agency type — brokerage, property management, developer, landlord, or mixed.

Use a review step before commit. Save progress server-side as an onboarding draft or make each step idempotent; do not lose the agency profile because a logo upload failed.

### Step 2 — Optional logo upload

The logo flow should:

1. Accept only approved image types: PNG, JPEG, WebP, and optionally SVG after sanitization.
2. Enforce a small maximum upload size, recommended 2 MB for the first release.
3. Validate the declared MIME type and inspect the file signature server-side.
4. Generate a cryptographically random, organization-scoped object key; never use the original filename as authority.
5. Upload directly to MinIO with a short-lived presigned PUT URL.
6. Verify the object exists with a server-side HEAD request, expected size, MIME type, and SHA-256 checksum before saving the organization reference.
7. Store `logoObjectKey`, `logoMimeType`, `logoFileSize`, `logoSha256`, and `logoUpdatedAt` (or an `OrganizationAsset` record) rather than an expiring presigned URL.
8. Replace old logos only after the new object is verified; enqueue old-object deletion after the database update succeeds.
9. Generate short-lived signed read URLs through an authenticated logo route or a narrowly scoped public branding route.
10. Strip EXIF metadata where practical and reject malformed or polyglot image files.

The logo is branding, not legal vault content. It should not receive `CONFIDENTIAL_PII` classification, but it must still be tenant-scoped and must not expose storage credentials.

### Step 3 — Team setup

Offer an optional “Invite your team” step:

- Add multiple email addresses with validation and duplicate detection.
- Assign one of the approved roles before sending.
- Show the exact access summary in plain language, especially “PWA only” for field agents.
- Allow skip and return later from Organization Settings.
- Make invites idempotent per organization/email while a pending invite exists.
- Use expiring, single-use invitation tokens and revoke/resend controls.

### Step 4 — Finish and first-run checklist

On completion, show:

- Agency name/logo.
- Current role and access summary.
- Team invitations pending.
- Setup checklist: profile, logo, first property, first team member, storage health.
- A direct path to the PWA for field agents.

Do not silently create a second organization when an existing user belongs to an organization. Show the organization selector and use the selected active organization.

## 6. RBAC model

### Permission naming convention

Use stable strings grouped by domain. Examples:

```text
org.read
org.update
org.members.read
org.members.invite
org.members.update_role
org.members.deactivate
org.billing.read
org.billing.manage

dashboard.read
properties.read
properties.create
properties.update
properties.archive
leads.read
leads.create
leads.assign
pipeline.read
pipeline.update
leases.read
leases.manage
finance.read
finance.manage
statements.read
statements.approve

vault.read
vault.upload
vault.download
vault.verify
vault.delete
vault.grant_access

pwa.access
pwa.listings.create
pwa.listings.share
pwa.inquiries.update
```

### Initial role presets

| Role | Default access | Explicit exclusions |
|---|---|---|
| `OWNER` | Full agency, team, billing, dashboard, vault, PWA, audit | Cannot be removed by normal member action; ownership transfer is a separate confirmed flow |
| `BROKER_MANAGER` | Dashboard operations, properties, pipeline, leases, team invites, PWA, approved vault operations | No ownership transfer; billing and destructive organization actions require owner |
| `ADMIN_STAFF` | Operational dashboard modules explicitly assigned by the owner/manager, team read access, PWA | No billing, vault by default, ownership, or unrestricted member-role changes |
| `FIELD_AGENT` | `pwa.access`, assigned property/lead operations, permitted listing share, assigned vault content only if granted | No dashboard, organization settings, team administration, finance, or full vault |
| `FINANCE_OFFICER` | Finance, payments, statements, relevant dashboard reporting | No vault by default, no team administration, no ownership actions |
| `VAULT_MANAGER` | Vault read/upload/verify/grant access according to classification policy | No billing, ownership, or unrelated operational mutation |
| `LANDLORD` / `TENANT` | Only explicitly scoped portal or property/lease capabilities | No agency dashboard or staff PWA unless separately granted |

“Admin staff and agents have PWA-only access unless other rights are added” becomes a server-enforced default, not a sidebar convention.

### Data-model direction

Keep Better Auth's membership row for organization membership and coarse Better Auth compatibility, then add Contour authorization data with one of these reviewed models:

**Recommended first implementation:**

- `OrganizationRole`: organization ID, stable key, display name, description, system/custom flag, active flag.
- `OrganizationRolePermission`: role ID, permission key, unique composite key.
- `MemberRoleAssignment`: member ID, role ID, assigned by, timestamps.
- `MemberPermissionOverride`: member ID, permission key, effect (`ALLOW`/`DENY`), scope metadata only where required.

For the first release, create only system role templates and do not expose arbitrary role creation in the UI. The schema can support custom roles later without forcing customers to understand them now.

Alternative lower-complexity migration: add `contourRole` and `permissions` to `Member`. This is acceptable for a short pilot but should not be the final model because permissions become difficult to audit, diff, and revoke.

## 7. Route and surface enforcement

### Shared authorization service

Add a single server-only function such as `requirePermission({ request, permission, resource })` that:

1. Resolves Better Auth session.
2. Resolves active organization.
3. Confirms membership in that organization.
4. Resolves the Contour role and effective permissions.
5. Applies resource scope checks, such as assigned property or vault grant.
6. Returns a typed denial reason without leaking cross-tenant existence.
7. Emits an audit event for sensitive denials and grants.

`requireRoles` can remain as a compatibility wrapper during migration, but new routes should use permissions.

### PWA-only policy

- Add a route-level policy for `/agent`, its server actions, and its API dependencies.
- `FIELD_AGENT` and `ADMIN_STAFF` can access the PWA only when `pwa.access` is present.
- Do not give PWA users dashboard access merely because they are authenticated.
- The PWA must still use the active organization and assigned-property scope.
- Direct navigation to `/dashboard/*`, `/admin/*`, vault APIs, finance APIs, and organization-management APIs must return a server-side 403 or redirect to `/agent` according to the surface contract.

### Migration checklist for existing routes

Audit and annotate every protected route, especially:

- Properties, inquiries, pipeline, visits, leases, statements, payments, billing, settings.
- Documents and vault access grants.
- Public upload token endpoints.
- Dify/MCP tools and API keys.
- Admin routes and member/invitation routes.

For every route, document: required permission, organization predicate, resource ownership predicate, and audit event.

## 8. Team administration flow

### Invite

- Owner or role with `org.members.invite` enters email, role, and optional note.
- Server creates a one-time expiring invitation record tied to organization and role.
- Email link contains only a random opaque token; store a hash of the token where practical.
- Invitation acceptance requires authentication as the invited email or an explicit account-linking confirmation.
- On acceptance, create membership and role assignment transactionally.
- Never accept organization ID or role from the browser during acceptance without re-resolving the invitation server-side.

### Manage member

Support:

- View effective role and permissions.
- Change role, with owner-only rules for owner transfer and owner removal.
- Add/remove allowed permission overrides.
- Grant scoped vault access.
- Deactivate membership without deleting the user identity.
- Revoke active sessions after a role downgrade or deactivation.
- View recent security/audit events.

### Guardrails

- Cannot remove the final owner.
- Cannot grant permissions the acting user does not possess.
- Cannot grant `billing.manage`, owner transfer, or unrestricted vault access unless policy allows it.
- Role changes are transactional and audited.
- Every permission change invalidates authorization/session caches.

## 9. MinIO and file-security implementation plan

### Storage topology

Use separate logical prefixes and, where operationally feasible, separate buckets:

```text
contour-branding/{organizationId}/logo/{assetId}.{ext}
contour-vault/{organizationId}/{classification}/{category}/{assetId}
```

The object key must be generated by the server from IDs, not from a user filename. Filenames are metadata only.

### Bucket policy

- Buckets private by default.
- No anonymous `GetObject` access for legal vault content.
- MinIO credentials server-only and scoped to the required bucket/actions.
- Separate read/write credentials where feasible.
- Enable MinIO server-side encryption using KMS-managed keys in production; document the development fallback clearly.
- Enable versioning or a retention strategy for legal documents where the operational policy requires it.
- Configure lifecycle cleanup for abandoned temporary uploads.
- Restrict CORS to the Contour production and local development origins only, with PUT/GET/HEAD and required headers.
- Do not expose the MinIO console or API directly through the public application domain.

### Secure upload protocol

1. Authenticated staff requests an upload session with category, MIME, size, and checksum.
2. Server validates permission, organization, resource relationship, allowed type, and maximum size.
3. Server generates an opaque object key and stores an `UploadSession` with status `PENDING`.
4. Server returns a short-lived presigned PUT URL bound to the expected content type and key.
5. Browser uploads directly to MinIO.
6. Server verifies the object with HEAD, expected size, content type, and checksum; optionally scans it asynchronously.
7. Only then create/activate the durable `VaultDocument` or organization asset record.
8. Mark failed/abandoned sessions for cleanup.

For public client upload links, add a server-side token/PIN verification session. A successful PIN check must issue a short-lived HttpOnly session cookie or signed upload capability; the client must not be able to call `presign` using only the URL token after the first check.

### Secure download protocol

1. Authenticate the user or validate the short-lived public upload/download capability.
2. Resolve organization membership and document scope.
3. Apply classification and vault-grant rules, including assigned property checks.
4. Generate a 15-minute presigned GET URL only after authorization.
5. Audit the download request without logging the URL, token, or document contents.
6. Return a generic not-found response when the caller is not allowed to learn whether a document exists.

### Current storage gaps to close

- Add server-side authorization to vault downloads using the same policy as listing.
- Do not trust client `objectKey`, `fileSize`, `mimeType`, or `fileType` during completion.
- Verify object existence and metadata before inserting `VaultDocument`.
- Enforce `maxFiles` and `maxSizeMbPerFile` from `DocumentRequest`.
- Add total request size limits and rate limits by token and IP.
- Replace unsalted SHA-256 PIN storage with a slow password hash such as scrypt/Argon2id, with constant-time verification and attempt lockout.
- Hash public capability tokens at rest and make them single-use or explicitly revocable where the workflow allows.
- Add content-type allowlists and file-signature/MIME sniffing.
- Add malware-scanning integration point before marking a document verified.
- Ensure orphan object cleanup after abandoned presign or failed completion.
- Add retention and deletion workflows that distinguish soft-delete, legal hold, and hard-delete eligibility.
- Ensure logo and vault objects never use a raw public CDN URL by default.

## 10. Database changes

Create reviewed, forward-only Prisma migrations. Do not use `prisma db push` in production.

Expected additions, subject to final schema review:

- Organization onboarding profile fields or a related `OrganizationProfile` table.
- Organization asset/logo metadata, preferably a related `OrganizationAsset` table.
- Role and permission tables, or the smaller pilot model described above.
- Member status, invitation acceptance metadata, last role change, and deactivation timestamp.
- Hashed invitation token fields and invitation audit metadata.
- Upload session/status records with expected and verified metadata.
- Storage checksum, scan status, and scan timestamps on vault/asset records.
- Public upload capability session/attempt counters and lockout fields.
- Audit event types for onboarding, branding, invitation, role change, permission grant/revoke, upload verification, download denial, and member deactivation.

Every migration must include:

- A forward migration.
- A tested rollback or documented non-reversible rationale.
- A backfill strategy for existing `User.role`, `Member.role`, `Organization.logo`, and vault records.
- Production status verification before application rollout.

## 11. Implementation phases

### Phase A — Contract and policy foundation

- Define permission catalog and role presets in a server-only module.
- Define role-to-permission matrix and denial semantics.
- Add authorization unit tests before changing routes.
- Decide whether the first release uses normalized role tables or the smaller Member extension.
- Write an onboarding/profile API contract with Zod schemas.

### Phase B — Schema and data migration

- Add onboarding profile, asset, role, membership, invitation, upload-session, and audit fields.
- Backfill existing organizations and memberships.
- Map Better Auth owner/admin/member values into Contour role presets.
- Preserve existing users and current active organizations.
- Run migration in an isolated database first, then Dokploy release migration.

### Phase C — Onboarding and branding

- Replace the current two-field onboarding page with the state-machine flow.
- Add profile validation, draft persistence, optional logo upload, preview, replacement, and removal.
- Add completion checklist and organization settings entry point.
- Add error recovery for failed uploads and slug collisions.

### Phase D — Team administration and RBAC

- Add members, invitations, role assignment, role summary, permission overrides, deactivation, and session revocation UI.
- Add server permission checks to each route and server action.
- Apply PWA-only defaults and test direct URL/API access for denied roles.
- Keep vault grants as a narrower resource-scope layer beneath role permissions.

### Phase E — MinIO hardening

- Add upload sessions and completion verification.
- Harden public upload token/PIN flows.
- Apply download authorization consistently.
- Add checksum, MIME sniffing, size/count limits, rate limits, audit, and orphan cleanup.
- Verify MinIO bucket policy, CORS, encryption, lifecycle, and credential scope in Dokploy.

### Phase F — Verification and rollout

- Run unit, route, database integration, storage integration, and Playwright E2E tests.
- Test owner, manager, admin staff, field agent, finance officer, vault manager, landlord, and tenant scenarios.
- Test cross-tenant access attempts and direct API calls, not just UI navigation.
- Deploy behind a feature flag for onboarding/RBAC if possible.
- Monitor denials, upload failures, orphan sessions, and invitation acceptance.

## 12. Test and acceptance matrix

### Onboarding

- New email signup reaches onboarding.
- New Google signup reaches onboarding.
- Existing member does not get a duplicate organization.
- Slug collision gives an actionable error.
- Refreshing each step preserves safe progress.
- Logo upload rejects oversized, unsupported, malformed, and spoofed MIME files.
- Logo replacement does not delete the old asset before the new one is verified.
- Completing onboarding sets the active organization and lands on the requested destination.

### RBAC

- Owner can invite and assign roles.
- Manager cannot transfer ownership or manage billing unless explicitly allowed.
- Admin staff without added permissions can use only the PWA.
- Field agent cannot access dashboard, vault, finance, or organization APIs by direct URL/request.
- Field agent can access assigned properties only.
- Finance officer cannot download legal vault documents by default.
- Vault manager cannot access billing or change ownership.
- A member cannot grant permissions they do not possess.
- Deactivated member loses API access and active sessions.
- Every role/permission change is audited.

### Storage

- Presign requires authorization or a verified capability session.
- Object key is server-generated and tenant-scoped.
- Completion fails when object is missing, oversized, wrong MIME, or checksum-mismatched.
- A document from organization A cannot be downloaded by organization B.
- Assigned-only users cannot download another agent's property documents.
- Presigned links expire within 15 minutes.
- Tokens, URLs, PINs, storage credentials, and PII do not appear in logs.
- Expired/abandoned uploads are cleaned up.
- Bucket is private from an anonymous request.

## 13. Operational and deployment requirements

- Add `pnpm db:migrate:deploy` to the Dokploy release/deploy workflow before starting the new app version.
- Never rely on an ad hoc `docker exec` migration as the normal release process.
- Add environment documentation for MinIO endpoint, bucket, region, access key, secret key, public origin/CORS, and encryption mode without committing values.
- Add a storage health check that validates credentials and bucket access without exposing secrets.
- Add structured audit fields: request ID, organization ID, actor ID, action, target, outcome, and timestamp.
- Configure alerting for repeated authorization denials, upload failures, token brute force, and storage connectivity failures.
- Rotate any credentials that have been exposed in chat, logs, screenshots, or source control.

## 14. Review decisions required before implementation

1. Approve fixed role presets for v1 rather than a customer-facing custom role builder.
2. Choose normalized role/permission tables versus the smaller Member extension for the first migration.
3. Confirm whether admin staff should be allowed to invite agents by default or only after `org.members.invite` is granted.
4. Confirm whether logos should be publicly viewable on public listings or served through short-lived signed branding URLs.
5. Confirm the maximum logo size and accepted formats.
6. Confirm whether MinIO server-side encryption/KMS is already configured in Dokploy.
7. Confirm the retention/legal-hold policy for title deeds, NRC/passport files, and client-uploaded documents.

## 15. Definition of done

This plan is complete only when a new agency can sign up, configure its profile and optional branding, invite staff, assign tested roles, and safely use the intended PWA/dashboard surfaces; when unauthorized direct API access is denied; and when MinIO uploads/downloads are verified, tenant-isolated, time-limited, audited, and recoverable without exposing secrets or durable public URLs.
