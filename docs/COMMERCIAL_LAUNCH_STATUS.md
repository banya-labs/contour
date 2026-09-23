# Commercial Launch Status

Updated: 2026-09-23

## Current gate

The infrastructure readiness gate is now passing. The live service responds to
both `/api/health` and `/api/ready`, with all required production dependencies
healthy. Commercial launch still requires the payment, authentication,
tenant-isolation, and recovery rehearsals below.

Live dependency evidence:

- Database: healthy
- Object storage (MinIO/S3): healthy
- Redis: healthy (dedicated persistent `contour-redis` service)

## Completed infrastructure action

Redis was deployed on the shared Docker Swarm network with persistent storage,
an authentication password, and an authenticated `REDIS_URL` on the Contour
service. Verified live:

```text
GET /api/health -> 200
GET /api/ready  -> 200 with database=true, redis=true, objectStorage=true
```

Do not declare commercial launch until this gate passes and the payment,
authentication, tenant-isolation, and recovery rehearsals in
`docs/PRODUCTION_OPERATIONS_RUNBOOK.md` are complete.
