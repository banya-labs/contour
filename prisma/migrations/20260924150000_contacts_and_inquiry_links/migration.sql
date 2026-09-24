CREATE TABLE "contact" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "identityKey" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "contact_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "contact_organizationId_identityKey_key" ON "contact"("organizationId", "identityKey");
CREATE INDEX "contact_organizationId_name_idx" ON "contact"("organizationId", "name");
ALTER TABLE "contact" ADD CONSTRAINT "contact_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "inquiry" ADD COLUMN "contactId" TEXT;

WITH legacy_contacts AS (
  SELECT DISTINCT ON (i."organizationId", identity_key)
    i."organizationId",
    identity_key,
    i."clientName" AS name,
    i."clientPhone" AS phone,
    i."clientEmail" AS email,
    i."createdAt"
  FROM (
    SELECT i.*, CASE
      WHEN regexp_replace(i."clientPhone", '[^0-9]', '', 'g') <> ''
        THEN regexp_replace(i."clientPhone", '[^0-9]', '', 'g')
      ELSE 'legacy:' || i.id
    END AS identity_key
    FROM "inquiry" i
  ) i
  ORDER BY i."organizationId", identity_key, i."createdAt", i.id
)
INSERT INTO "contact" ("id", "organizationId", "identityKey", "name", "phone", "email", "createdAt", "updatedAt")
SELECT 'legacy_contact_' || md5("organizationId" || ':' || identity_key), "organizationId", identity_key, name, phone, email, createdAt, CURRENT_TIMESTAMP
FROM legacy_contacts;

UPDATE "inquiry" i
SET "contactId" = c.id
FROM "contact" c
WHERE c."organizationId" = i."organizationId"
  AND c."identityKey" = CASE
    WHEN regexp_replace(i."clientPhone", '[^0-9]', '', 'g') <> ''
      THEN regexp_replace(i."clientPhone", '[^0-9]', '', 'g')
    ELSE 'legacy:' || i.id
  END;

ALTER TABLE "inquiry" ALTER COLUMN "contactId" SET NOT NULL;
ALTER TABLE "inquiry" ADD CONSTRAINT "inquiry_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "contact"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
CREATE INDEX "inquiry_contactId_idx" ON "inquiry"("contactId");
