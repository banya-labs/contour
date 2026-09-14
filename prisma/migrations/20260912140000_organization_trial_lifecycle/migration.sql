-- Persist the organization trial boundary so it cannot be silently reset from
-- the organization's current createdAt value on every billing request.
ALTER TABLE "organization"
ADD COLUMN "trialEndsAt" TIMESTAMP(3);

UPDATE "organization"
SET "trialEndsAt" = "createdAt" + INTERVAL '14 days'
WHERE "trialEndsAt" IS NULL;
