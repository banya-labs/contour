import { NextResponse } from "next/server";
import { createApiHandler } from "@/lib/api-handler";
import { db } from "@/lib/db";

export const GET = createApiHandler({
  requirePermissions: ["properties.read"],
  handler: async (_req, { organizationId, params }) => {
    const jobId = typeof params?.id === "string" ? params.id : null;
    if (!jobId || !organizationId) return NextResponse.json({ error: "Job is required" }, { status: 400 });
    const job = await db.surveyExtractionJob.findFirst({ where: { id: jobId, organizationId }, select: { id: true, propertyId: true, sourceDocumentId: true, status: true, engine: true, engineVersion: true, pageCount: true, processedPages: true, extractionJson: true, errorCode: true, errorMessage: true, reviewedById: true, reviewedAt: true, createdAt: true, updatedAt: true } });
    if (!job) return NextResponse.json({ error: "Extraction job not found" }, { status: 404 });
    return NextResponse.json({ success: true, job });
  },
});
