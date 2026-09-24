# Rollback guidance

This migration only adds PostgreSQL enum values. PostgreSQL enum values must not be removed during an application rollback because doing so can invalidate persisted values and require a destructive database operation.

The separate inquiry backfill is intentionally not reversible from the final status alone:

- `CONTACTED` becomes `QUALIFIED`.
- `VIEWING_SCHEDULED` and `OFFER_MADE` both become `VIEWING_OR_OFFER`.
- `MANAGEMENT_HANDOVER` becomes `VERIFICATION_CLOSING`.

Before applying `scripts/migrate-pipeline-stages.ts --apply` in staging, capture an approved database snapshot or export the organization/status/outcome mapping. If the application rollout must be reverted, keep the additive enum values and restore records from that snapshot only after reviewing the affected inquiry set.

The guarded backfill refuses writes unless `CONTOUR_ENV=staging` and `CONTOUR_PIPELINE_MIGRATION_ALLOW_WRITE=true` are both present.
