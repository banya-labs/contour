ALTER TABLE "listings"
  ADD COLUMN IF NOT EXISTS "province" text,
  ADD COLUMN IF NOT EXISTS "city_town" text,
  ADD COLUMN IF NOT EXISTS "latitude" double precision,
  ADD COLUMN IF NOT EXISTS "longitude" double precision;

CREATE INDEX IF NOT EXISTS "listings_province_idx" ON "listings" ("province");
CREATE INDEX IF NOT EXISTS "listings_city_town_idx" ON "listings" ("city_town");
