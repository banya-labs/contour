-- Property titles are unique within an organisation, ignoring case and
-- surrounding/repeated whitespace. This closes the race left by API checks.
CREATE UNIQUE INDEX "property_organizationId_title_normalized_key"
ON "property" ("organizationId", lower(regexp_replace(trim("title"), '\s+', ' ', 'g')));
