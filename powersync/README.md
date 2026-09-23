# Contour PowerSync

PostgreSQL remains authoritative. The PowerSync service uses `sync-rules.yaml`
to replicate only organization-scoped operational data to an authenticated
device. The application signs a short-lived HS256 token at
`/api/powersync/token`; production must set a dedicated `POWERSYNC_JWT_SECRET`
of at least 32 characters.

Before deploying the service:

1. Confirm the PowerSync connector uses the production PostgreSQL connection.
2. Apply the sync rules through the PowerSync deployment process.
3. Configure the service to validate `iss=contour-auth` and `aud=powersync`.
4. Verify agent filtering with two users in one organization and two separate organizations.
5. Keep vault, identity, banking, payment, and destructive administration flows online-only.

The YAML is deployment configuration, not a replacement for server-side
authorization. Every write still passes through Contour's authenticated API.
