import { NextResponse } from "next/server";
import { z } from "zod";
import { createApiHandler } from "@/lib/api-handler";
import { db } from "@/lib/db";

const createJobSchema = z.object({ sourceDocumentId: z.string().min(1), idempotencyKey: z.string().min(8).max(120).optional() });

export const POST = createApiHandler({
  requirePermissions: ["vault.upload"],
  bodySchema: createJobSchema,
  handler: async (_req, { body, organizationId, userId, params }) => {
    const propertyId = typeof params?.id === "string" ? params.id : null;
    if (!propertyId || !organizationId || !userId) return NextResponse.json({ error: "Property is required" }, { status: 400 });
    const sourceDocument = await db.vaultDocument.findFirst({ where: { id: body.sourceDocumentId, organizationId, propertyId, isDeleted: false }, select: { id: true, docType: true } });
    if (!sourceDocument || !["TITLE_DEED", "SITE_SURVEY_DIAGRAM"].includes(sourceDocument.docType)) return NextResponse.json({ error: "Survey source document not found" }, { status: 404 });

    const existing = body.idempotencyKey ? await db.surveyExtractionJob.findFirst({ where: { organizationId, propertyId, sourceDocumentId: body.sourceDocumentId, idempotencyKey: body.idempotencyKey } }) : null;
    if (existing) return NextResponse.json({ success: true, job: existing, deduplicated: true });

    const job = await db.surveyExtractionJob.create({
      data: {
        organizationId,
        propertyId,
        sourceDocumentId: body.sourceDocumentId,
        createdById: userId,
        status: "QUEUED",
        idempotencyKey: body.idempotencyKey || null,
      },
      select: { id: true, propertyId: true, sourceDocumentId: true, status: true, createdAt: true },
    });
    await db.auditLog.create({ data: { organizationId, userId, action: "SURVEY_EXTRACTION_JOB_QUEUED", entityType: "SurveyExtractionJob", entityId: job.id, details: { propertyId, sourceDocumentId: body.sourceDocumentId } } });
    return NextResponse.json({ success: true, job }, { status: 202 });
  },
});

export const GET = createApiHandler({
  requirePermissions: ["properties.read"],
  handler: async (_req, { organizationId, params }) => {
    const propertyId = typeof params?.id === "string" ? params.id : null;
    if (!propertyId || !organizationId) return NextResponse.json({ error: "Property is required" }, { status: 400 });
    const jobs = await db.surveyExtractionJob.findMany({ where: { organizationId, propertyId }, orderBy: { createdAt: "desc" }, select: { id: true, sourceDocumentId: true, status: true, engine: true, engineVersion: true, pageCount: true, processedPages: true, extractionJson: true, errorCode: true, errorMessage: true, createdAt: true, updatedAt: true } });
    return NextResponse.json({ success: true, jobs });
  },
});
