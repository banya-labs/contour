# Rollback

Run only after the application no longer reads or writes boundary provenance:

```sql
DROP TABLE IF EXISTS "boundary_evidence_event";
DROP TABLE IF EXISTS "property_boundary";
DROP TYPE IF EXISTS "PropertyBoundaryStatus";
DROP TYPE IF EXISTS "PropertyBoundarySourceType";
```
