CREATE TYPE "PropertyBoundarySourceType" AS ENUM ('TITLE_DEED', 'GOVERNMENT_CADASTRE', 'GEOJSON', 'KML', 'SHAPEFILE', 'AGENT_DRAWN');
CREATE TYPE "PropertyBoundaryStatus" AS ENUM ('PENDING', 'MATCHED', 'VERIFIED', 'REJECTED', 'SUPERSEDED');

CREATE TABLE "property_boundary" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "propertyId" TEXT NOT NULL,
  "sourceType" "PropertyBoundarySourceType" NOT NULL,
  "status" "PropertyBoundaryStatus" NOT NULL DEFAULT 'PENDING',
  "geometryGeoJson" JSONB NOT NULL,
  "sourceCrs" TEXT,
  "targetCrs" TEXT NOT NULL DEFAULT 'EPSG:4326',
  "plotId" TEXT,
  "surveyReference" TEXT,
  "diagramNumber" TEXT,
  "planNumber" TEXT,
  "statedAreaSqm" DECIMAL(14,3),
  "calculatedAreaSqm" DECIMAL(14,3),
  "areaDifferencePct" DECIMAL(8,3),
  "sourceDocumentId" TEXT,
  "governmentSourceUrl" TEXT,
  "governmentLayer" TEXT,
  "governmentRecordId" TEXT,
  "governmentFetchedAt" TIMESTAMP(3),
  "confidenceScore" DECIMAL(5,4),
  "validationFlags" JSONB NOT NULL DEFAULT '[]',
  "createdById" TEXT NOT NULL,
  "verifiedById" TEXT,
  "verifiedAt" TIMESTAMP(3),
  "rejectionReason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "property_boundary_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "property_boundary_organizationId_propertyId_status_idx" ON "property_boundary"("organizationId", "propertyId", "status");
CREATE INDEX "property_boundary_sourceDocumentId_idx" ON "property_boundary"("sourceDocumentId");
ALTER TABLE "property_boundary" ADD CONSTRAINT "property_boundary_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "property_boundary" ADD CONSTRAINT "property_boundary_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "property"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "property_boundary" ADD CONSTRAINT "property_boundary_sourceDocumentId_fkey" FOREIGN KEY ("sourceDocumentId") REFERENCES "vault_document"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "property_boundary" ADD CONSTRAINT "property_boundary_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "property_boundary" ADD CONSTRAINT "property_boundary_verifiedById_fkey" FOREIGN KEY ("verifiedById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "boundary_evidence_event" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "propertyId" TEXT NOT NULL,
  "boundaryId" TEXT,
  "eventType" TEXT NOT NULL,
  "actorId" TEXT,
  "details" JSONB,
  "sourceHash" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "boundary_evidence_event_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "boundary_evidence_event_organizationId_propertyId_createdAt_idx" ON "boundary_evidence_event"("organizationId", "propertyId", "createdAt");
CREATE INDEX "boundary_evidence_event_boundaryId_createdAt_idx" ON "boundary_evidence_event"("boundaryId", "createdAt");
ALTER TABLE "boundary_evidence_event" ADD CONSTRAINT "boundary_evidence_event_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "boundary_evidence_event" ADD CONSTRAINT "boundary_evidence_event_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "property"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "boundary_evidence_event" ADD CONSTRAINT "boundary_evidence_event_boundaryId_fkey" FOREIGN KEY ("boundaryId") REFERENCES "property_boundary"("id") ON DELETE SET NULL ON UPDATE CASCADE;
