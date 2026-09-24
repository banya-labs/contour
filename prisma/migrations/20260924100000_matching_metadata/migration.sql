ALTER TABLE "property" ADD COLUMN "matchingMetadata" JSONB;
ALTER TABLE "inquiry" ADD COLUMN "matchingProfile" JSONB;

-- Rollback:
-- ALTER TABLE "property" DROP COLUMN "matchingMetadata";
-- ALTER TABLE "inquiry" DROP COLUMN "matchingProfile";
