# Contour Admin Control Plane

## Navigation

The control plane is organized around agencies, not separate people or inquiry records:

- `/admin/agencies` — bounded agency directory with owner name/email, subscription state, member count, and property count.
- `/admin/agencies/[id]` — agency workspace containing owner, people, payment history, subscription timing, activity, and governed actions.
- `/admin/subscriptions` — subscription tiers, subscriber distribution, gross successful collections, editable pricing, and Lenco connection status.
- `/admin/offers` — audited platform offers and grants.
- `/admin/staff` — platform staff access and role status.
- `/admin/mcp` — MCP studio and machine-surface controls.

Inquiry data remains available to operational workflows but is not a standalone control-plane menu item.

## Agency actions

Agency state changes, support access, deletion scheduling, and pricing changes require platform authorization and an operator reason. Deletion scheduling is recovery-aware; it does not immediately delete agency data. Support access is time-bound and must remain visibly labelled as view-only or act-as access.

## Subscription tiers

Tier configuration is persisted in `subscription_tier` and seeded with Starter, Growth, and Enterprise. New checkout prices and billing summaries resolve from this catalog, with a static-plan fallback for environments that have not been seeded. Historical `Payment` amounts are immutable records and are not recalculated after a tier price change.

## Lenco credentials

The browser shows only provider, environment, API URL, configured state, and a masked key. The raw `LENCO_API_KEY` remains deployment-managed and is never returned to client code or stored in the browser. The connection test is non-mutating and reports only redacted status information.

## Verification

Run:

```powershell
pnpm prisma migrate status
pnpm exec tsc --noEmit
pnpm vitest run src/lib/admin-control-plane/formatters.test.ts src/lib/lenco.test.ts src/app/api/webhooks/lenco/route.test.ts
```

Do not claim production readiness from these checks alone; browser workflow and `/api/ready` verification remain separate release gates.
