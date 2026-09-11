import { NextResponse } from "next/server";
import { createApiHandler } from "@/lib/api-handler";
import { db } from "@/lib/db";
import { s3Storage } from "@/lib/storage/s3";

export const GET = createApiHandler({
  requireAuth: true,
  requirePermissions: ["vault.download"],
  handler: async (_req, { params, organizationId, userId }) => {
    const orgId = organizationId!;
    const { id } = (params || {}) as { id: string };

    if (!id) {
      return NextResponse.json({ error: "Document ID is required" }, { status: 400 });
    }

    const doc = await db.vaultDocument.findFirst({
      where: { id, organizationId: orgId, isDeleted: false },
      include: {
        property: {
          select: { id: true, title: true, status: true },
        },
      },
    });

    if (!doc) {
      return NextResponse.json({ error: "Document not found or access denied" }, { status: 404 });
    }

    // 15-Minute presigned download URL under Zambia DPA minimum necessary access principle
    const downloadUrl = await s3Storage.getPresignedDownloadUrl(doc.objectKey, 900);

    // Audit log
    try {
      await db.auditLog.create({
        data: {
          organizationId: orgId,
          userId,
          action: "ZAMBIA_DPA_DOCUMENT_DOWNLOADED",
          entityType: "VaultDocument",
          entityId: doc.id,
          details: {
            title: doc.title,
            docType: doc.docType,
            propertyId: doc.propertyId,
            expiresInSeconds: 900,
            statute: "Zambia Data Protection Act No. 3 of 2021 (Section 27)",
          },
        },
      });
    } catch {
      // Non-blocking
    }

    return NextResponse.json({
      success: true,
      documentId: doc.id,
      title: doc.title,
      downloadUrl,
      expiresIn: "15 minutes",
      propertyStatus: doc.property?.status || "ACTIVE",
    });
  },
});
