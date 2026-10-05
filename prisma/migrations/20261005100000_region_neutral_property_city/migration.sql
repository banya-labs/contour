-- Stop assigning a city that the user did not provide. Existing locations remain unchanged.
ALTER TABLE "property" ALTER COLUMN "city" SET DEFAULT '';
