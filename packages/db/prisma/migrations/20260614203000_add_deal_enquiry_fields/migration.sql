ALTER TABLE "deals"
  ADD COLUMN "request_summary" TEXT,
  ADD COLUMN "preferred_property_type" TEXT,
  ADD COLUMN "preferred_location" TEXT,
  ADD COLUMN "preferred_province" TEXT,
  ADD COLUMN "preferred_city_town" TEXT,
  ADD COLUMN "preferred_bedrooms" INTEGER,
  ADD COLUMN "preferred_bathrooms" INTEGER;

ALTER TABLE "listings"
  ADD COLUMN "description" TEXT;
