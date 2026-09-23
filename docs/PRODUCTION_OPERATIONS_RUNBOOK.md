# Contour Production Operations Runbook

**Scope:** Dokploy application, Neon Postgres, MinIO object storage, Redis, Lenco webhooks  
**Owner:** Banya Labs engineering/on-call  
**Last reviewed:** 2026-09-23

## 1. Operating rules

- Never run `prisma db push` against production. Use reviewed migrations only.
- Never delete or truncate tenant data during incident response.
- Preserve correlation IDs, deployment commit, timestamps, and affected organization IDs in the incident record.
- Do not paste credentials, payment tokens, document contents, or full database URLs into tickets or chat.
- If tenant isolation is suspected, immediately restrict the affected route or deployment and escalate as a severity-1 incident.

## 2. Health checks

Check these endpoints first:

```text
GET https://contour.banyalabs.com/api/health
GET https://contour.banyalabs.com/api/ready
```

`/api/health` confirms the process is responding. `/api/ready` confirms production dependencies: Neon, Redis, and MinIO. A `503` is an operational failure, not a reason to bypass checks or enable development mode.

## 3. Release and rollback

1. Record the deployed Git commit and the candidate commit.
2. Run locally/CI: `pnpm test`, `pnpm exec tsc --noEmit --incremental false`, `git diff --check`, and `pnpm build`.
3. Confirm the migration list and backup point before deployment.
4. Deploy the immutable commit through Dokploy.
5. Verify `/api/health`, `/api/ready`, sign-in, dashboard, `/agent`, public listings, and billing summary.
6. If the release is unhealthy, stop new traffic or roll back to the previous known-good commit. Do not make ad-hoc production edits.
7. After rollback, verify both application health and database compatibility. Never roll back application code across an irreversible schema change without the migration owner’s approval.

## 4. Neon backup and restore

### Before a migration

- Confirm Neon point-in-time restore coverage and the target timestamp.
- Record the migration names to be applied and the current `_prisma_migrations` state.
- Export a non-sensitive schema snapshot if required by the change review.
- Apply first to an isolated/staging database and run the relevant integration tests.

### Restore procedure

1. Declare a severity-1 incident and stop writes if corruption is ongoing.
2. Identify the last known-good Neon timestamp before the incident.
3. Create a restored branch/database; do not overwrite the live branch first.
4. Run Prisma validation and read-only tenant/data integrity checks against the restore.
5. Compare organization, member, payment, webhook, and audit-log counts with the incident window.
6. Obtain owner approval before switching application `DATABASE_URL`.
7. Deploy/restart the application, verify `/api/ready`, then resume writes.
8. Record data loss window, recovery point, and customer communication.

## 5. MinIO recovery

- Keep PostgreSQL object metadata and MinIO bytes backed up independently.
- Restore the bucket to a new recovery prefix/bucket first; preserve original object keys.
- Verify tenant prefix, MIME type, checksum metadata, and private bucket policy.
- Re-run authorized presigned download checks for a representative title deed, mandate, and property image.
- Never make the bucket public to repair a broken download path.
- If object bytes are unavailable but metadata remains, place affected documents into a visible “recovery required” state and notify the tenant owner.

## 6. Redis failure

Redis supports rate limiting and cache acceleration; it is not the source of truth for tenant or payment data.

- A Redis outage must cause `/api/ready` to fail in production.
- Keep the application available only if the incident owner explicitly accepts the rate-limit risk and has applied a temporary ingress limit.
- Do not silently treat a production Redis outage as a healthy state.
- After recovery, clear only known-safe cache/rate-limit keys; never flush the shared Redis database without confirming namespace ownership.

## 7. Lenco payment incidents

- Verify webhook signature failures before examining business state.
- Check `WebhookEvent.dedupeKey`, `Payment.reference`, provider status, and audit events.
- Duplicate webhook deliveries must be acknowledged without duplicate entitlement changes.
- A failed event must not downgrade a payment already marked `SUCCESS`.
- If provider status is ambiguous, leave the payment pending and reconcile through the provider; do not manually activate a plan from a screenshot or email.
- Reconcile settled payments against organization entitlement state before contacting the customer.

## 8. Severity matrix

| Severity | Example | First response | Customer action |
|---|---|---|---|
| SEV-1 | Cross-tenant exposure, payment corruption, unrecoverable data loss | Immediately restrict route/deploy, page engineering owner | Notify affected customers with verified facts |
| SEV-2 | Login outage, MinIO outage, billing checkout unavailable | Start incident channel, investigate health/readiness and logs | Publish service update and workaround |
| SEV-3 | One workflow broken, delayed sync, non-critical UI regression | Ticket and assign owner during business hours | Support response with workaround |
| SEV-4 | Cosmetic issue or documentation defect | Normal backlog | No broad notice required |

## 9. Incident record template

```text
Incident ID:
Start/end time (Africa/Johannesburg):
Severity:
Detected by:
Affected organizations/surfaces:
Deployed commit:
Correlation IDs:
What happened:
Containment:
Data integrity assessment:
Recovery action:
Customer communication:
Follow-up owner and due date:
```

## 10. Launch acceptance gate

Commercial launch is blocked until the team has completed one supervised restore rehearsal, one application rollback rehearsal, one MinIO object-recovery check, and one Lenco duplicate-webhook reconciliation exercise, with evidence attached to the release record.

