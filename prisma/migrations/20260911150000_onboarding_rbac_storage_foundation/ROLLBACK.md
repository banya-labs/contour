# Rollback note

This migration is additive and intentionally has no automatic destructive rollback. Existing Better Auth columns and legacy role data remain usable while the application is rolled back.

If deployment must be reverted, deploy the previous application version and leave these tables/columns in place. A later, separately reviewed cleanup migration may remove them only after all role assignments, onboarding profiles, assets, and upload sessions have been migrated or archived. Do not drop these tables during an incident rollback because that would destroy authorization and audit evidence.
