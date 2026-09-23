# Commercial Launch Status

Updated: 2026-09-23

## Current gate

The application is not yet commercially launch-ready. The live service responds
to `/api/health`, but `/api/ready` returns `503` because the production Redis
dependency is unavailable.

Live dependency evidence:

- Database: healthy
- Object storage (MinIO/S3): healthy
- Redis: unavailable / not configured

## Required release action

Configure `REDIS_URL` in the production deployment, redeploy, and verify:

```text
GET /api/health -> 200
GET /api/ready  -> 200 with database=true, redis=true, objectStorage=true
```

Do not declare commercial launch until this gate passes and the payment,
authentication, tenant-isolation, and recovery rehearsals in
`docs/PRODUCTION_OPERATIONS_RUNBOOK.md` are complete.
