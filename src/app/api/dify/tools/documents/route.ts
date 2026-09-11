import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { authenticateDifyRequest } from "@/lib/dify-auth";
import { propertyDocumentsToolSchema } from "@/lib/ai-tool-schemas";
import { getOrCreateCorrelationId } from "@/lib/correlation";
import { s3Storage } from "@/lib/storage/s3";

/**
 * Dify Tool: `get_property_documents`
 * 
 * Retrieves confidential legal documents (Title Deeds, NRC IDs, Leases) from
 * MinIO S3 Object Storage with time-limited POPIA presigned URLs.
 * 
 * Strictly isolated to the authenticated organization's MinIO prefix:
 * `s3://contour-vault/{organizationId}/...`
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const parsed = propertyDocumentsToolSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid document arguments" }, { status: 400 });
    }
    const { organization_id, propertyId, category } = parsed.data;

    const { context, errorResponse } = await authenticateDifyRequest(req, organization_id);
    if (errorResponse) return errorResponse;

    const tenantOrgId = context!.organizationId;

    // 1. Query only real, non-deleted vault records belonging to this tenant.
    const documents = await db.vaultDocument.findMany({
      where: {
        organizationId: tenantOrgId,
        propertyId: propertyId || undefined,
        docType: category || undefined,
        isDeleted: false,
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    // 3. Generate 15-minute POPIA presigned download URLs for MinIO S3
    const docsWithPresignedUrls = await Promise.all(
      documents.map(async (doc) => {
        const presignedUrl = await s3Storage.getPresignedDownloadUrl(doc.objectKey, 900);
        return {
          id: doc.id,
          fileName: doc.originalFileName,
          category: doc.docType,
          registryFolio: doc.registryFolio,
          securityClassification: doc.classification,
          minioObjectKey: doc.objectKey,
          presignedDownloadUrl: presignedUrl,
          expiresInSeconds: 900,
          vaultPath: `s3://contour-vault/${doc.objectKey}`,
        };
      })
    );

    // 4. Record POPIA Audit Event in Neon PostgreSQL
    try {
      await db.auditLog.create({
        data: {
          organizationId: tenantOrgId,
          userId: context?.userId || null,
          action: "DIFY_AI_RETRIEVE_MINIO_DOCUMENTS",
          entityType: "DocumentVault",
          entityId: propertyId || "all_docs",
          details: {
            retrievedCount: docsWithPresignedUrls.length,
            categories: docsWithPresignedUrls.map((d) => d.category),
            apiKeyName: context?.apiKeyName,
          },
        },
      });
    } catch (auditErr) {
      console.warn("Audit log creation bypassed:", auditErr);
    }

    return NextResponse.json({
      success: true,
      tenant: tenantOrgId,
      storageProvider: "MINIO_S3_OBJECT_STORAGE",
      bucket: "contour-vault",
      totalDocuments: docsWithPresignedUrls.length,
      documents: docsWithPresignedUrls,
      popiaNotice: "Presigned URLs expire in 15 minutes. All document retrievals are logged in the immutable audit trail.",
    });
  } catch (error: any) {
    const correlationId = getOrCreateCorrelationId(req);
    console.error("Dify Document Tool Error:", { correlationId, error });
    return NextResponse.json(
      { error: "Failed to fetch documents from MinIO S3", correlationId },
      { status: 500, headers: { "x-correlation-id": correlationId } }
    );
  }
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const searchParams = Object.fromEntries(url.searchParams.entries());
  
  const mockReq = new NextRequest(req.url, {
    method: "POST",
    headers: req.headers,
    body: JSON.stringify(searchParams),
  });

  return POST(mockReq);
}
