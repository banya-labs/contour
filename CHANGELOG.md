# Changelog

All notable changes to Contour are documented here.

## Unreleased

### Production audit and feedback

- Added visible pending/error/retry states across dashboard, admin and agent actions, and measured statement/analytics PDF progress.
- Hardened vault storage, identity/invitation/machine permissions, subscription expiry, public inquiry/cache boundaries and receipt rendering.
- Made payment/offer retries transactional and protected successor leases from historical relisting actions.
- Published the 13-layer assessment in `docs/PRODUCTION_AUDIT_2026-10-05.md`, with explicit runtime and recovery verification limits.

### Commercial launch readiness

- Added production readiness checks for Neon, Redis, and MinIO.
- Added authenticated, persistent Redis deployment guidance and launch status tracking.
- Hardened tenant isolation for public listings and property updates.
- Enforced billing permissions and supported settlement currencies.
- Added Lenco webhook lifecycle coverage and production recovery runbooks.
- Added CI verification for typecheck, tests, and production builds.

