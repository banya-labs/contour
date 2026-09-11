# Rollback

Run only after the application no longer reads or writes survey extraction jobs:

```sql
DROP TABLE IF EXISTS "survey_extraction_job";
```
