import { NextResponse } from "next/server";
import { z } from "zod";
import { createApiHandler } from "@/lib/api-handler";
import { db } from "@/lib/db";
import { calculatePolygonAreaSqm, geoJsonPolygonSchema } from "@/lib/cadastral";

const createBoundarySchema = z.object({
  sourceType: z.enum(["TITLE_DEED", "GOVERNMENT_CADASTRE", "GEOJSON", "KML", "SHAPEFILE", "AGENT_DRAWN"]),
  geometryGeoJson: geoJsonPolygonSchema,
  sourceCrs: z.string().max(120).nullable().optional(),
  plotId: z.string().max(120).nullable().optional(),
  surveyReference: z.string().max(120).nullable().optional(),
  diagramNumber: z.string().max(120).nullable().optional(),
  planNumber: z.string().max(120).nullable().optional(),
  statedAreaSqm: z.number().positive().nullable().optional(),
  sourceDocumentId: z.string().nullable().optional(),
  governmentSourceUrl: z.string().url().nullable().optional(),
  governmentLayer: z.string().max(120).nullable().optional(),
  governmentRecordId: z.string().max(120).nullable().optional(),
  governmentFetchedAt: z.string().datetime().nullable().optional(),
  confidenceScore: z.number().min(0).max(1).nullable().optional(),
  validationFlags: z.array(z.string().max(80)).default([]),
});

export const GET = createApiHandler({
  requirePermissions: ["properties.read"],
  handler: async (_req, { organizationId, params }) => {
    const propertyId = typeof params?.id === "string" ? params.id : null;
    if (!propertyId || !organizationId) return NextResponse.json({ error: "Property is required" }, { status: 400 });
    const boundaries = await db.propertyBoundary.findMany({ where: { organizationId, propertyId }, orderBy: { createdAt: "desc" }, include: { sourceDocument: { select: { id: true, originalFileName: true, docType: true } }, createdBy: { select: { id: true, name: true } }, verifiedBy: { select: { id: true, name: true } } } });
    return NextResponse.json({ success: true, boundaries });
  },
});

export const POST = createApiHandler({
  requirePermissions: ["properties.update"],
  bodySchema: createBoundarySchema,
  handler: async (_req, { body, organizationId, userId, params }) => {
    const propertyId = typeof params?.id === "string" ? params.id : null;
    if (!propertyId || !organizationId || !userId) return NextResponse.json({ error: "Property is required" }, { status: 400 });
    const property = await db.property.findFirst({ where: { id: propertyId, organizationId }, select: { id: true } });
    if (!property) return NextResponse.json({ error: "Property not found" }, { status: 404 });
    if (body.sourceDocumentId) {
      const source = await db.vaultDocument.findFirst({ where: { id: body.sourceDocumentId, organizationId, propertyId, isDeleted: false }, select: { id: true } });
      if (!source) return NextResponse.json({ error: "Source document not found" }, { status: 404 });
    }
    const ring = body.geometryGeoJson.coordinates[0].slice(0, -1) as [number, number][];
    const calculatedAreaSqm = calculatePolygonAreaSqm(ring);
    const areaDifferencePct = body.statedAreaSqm ? Math.abs(calculatedAreaSqm - body.statedAreaSqm) / body.statedAreaSqm * 100 : null;
    const boundary = await db.$transaction(async (tx) => {
      const created = await tx.propertyBoundary.create({ data: { organizationId, propertyId, sourceType: body.sourceType, geometryGeoJson: body.geometryGeoJson, sourceCrs: body.sourceCrs || null, plotId: body.plotId || null, surveyReference: body.surveyReference || null, diagramNumber: body.diagramNumber || null, planNumber: body.planNumber || null, statedAreaSqm: body.statedAreaSqm || null, calculatedAreaSqm, areaDifferencePct, sourceDocumentId: body.sourceDocumentId || null, governmentSourceUrl: body.governmentSourceUrl || null, governmentLayer: body.governmentLayer || null, governmentRecordId: body.governmentRecordId || null, governmentFetchedAt: body.governmentFetchedAt ? new Date(body.governmentFetchedAt) : null, confidenceScore: body.confidenceScore || null, validationFlags: body.validationFlags, createdById: userId } });
      await tx.boundaryEvidenceEvent.create({ data: { organizationId, propertyId, boundaryId: created.id, eventType: "BOUNDARY_CREATED", actorId: userId, details: { sourceType: body.sourceType, sourceDocumentId: body.sourceDocumentId || null } } });
      return created;
    });
    return NextResponse.json({ success: true, boundary }, { status: 201 });
  },
});
