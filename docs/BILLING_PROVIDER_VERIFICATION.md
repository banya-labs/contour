# Billing Provider Verification Gate

This document separates automated local evidence from real Lenco settlement evidence.

## Current evidence

- Unit/webhook tests cover signature rejection, missing references, duplicate delivery, successful settlement, and late failure events.
- `scripts/test-lenco-gateway.ts` covers plan pricing, the implemented HMAC-SHA512 verifier, and explicitly labeled development simulation.
- Development simulation is enabled only when `NODE_ENV !== production` and `NEXT_PUBLIC_DEV_MODE=true`.
- No real Lenco authorization, mobile-money approval, card settlement, or provider callback has been verified in this workspace.

## Authorized provider run

Run only against a disposable organization and an authorized Lenco sandbox/live environment:

1. Confirm `LENCO_API_KEY` and `LENCO_API_URL` are configured by presence only; never print values.
2. Confirm the webhook URL is configured in Lenco and points to `/api/webhooks/lenco`.
3. Disable development simulation and create one low-value test checkout with a unique idempotency key.
4. Record only the payment reference, HTTP result, provider status, webhook HTTP result, and resulting ledger state.
5. Replay the same webhook and confirm no duplicate invoice/subscription effect.
6. Send or observe a failure event after settlement and confirm the successful payment remains successful.
7. Reconcile the provider status against `Payment`, `Subscription`, and `Invoice` before deleting the disposable organization.

## Release rule

Passing local tests must be reported as local evidence, not as proof of live payment readiness. Commercial billing is not ready until the authorized provider run succeeds and `/api/ready` is healthy for database, Redis, and object storage.
