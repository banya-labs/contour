CREATE TABLE "property_match_notification" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "propertyId" TEXT NOT NULL,
  "inquiryId" TEXT NOT NULL,
  "agentId" TEXT,
  "status" TEXT NOT NULL DEFAULT 'UNREAD',
  "title" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "readAt" TIMESTAMP(3),
  CONSTRAINT "property_match_notification_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "property_match_notification_propertyId_inquiryId_key" ON "property_match_notification"("propertyId", "inquiryId");
CREATE INDEX "property_match_notification_organizationId_status_createdAt_idx" ON "property_match_notification"("organizationId", "status", "createdAt");
CREATE INDEX "property_match_notification_agentId_status_createdAt_idx" ON "property_match_notification"("agentId", "status", "createdAt");
ALTER TABLE "property_match_notification" ADD CONSTRAINT "property_match_notification_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "property_match_notification" ADD CONSTRAINT "property_match_notification_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "property"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "property_match_notification" ADD CONSTRAINT "property_match_notification_inquiryId_fkey" FOREIGN KEY ("inquiryId") REFERENCES "inquiry"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "property_match_notification" ADD CONSTRAINT "property_match_notification_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
