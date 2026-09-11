import { NextResponse } from "next/server";
import { createApiHandler } from "@/lib/api-handler";
import { db } from "@/lib/db";

export const POST = createApiHandler({
  requireAuth: true,
  handler: async (_req, { params, organizationId, userId }) => {
    const orgId = organizationId || "org_contour_demo";
    const { id } = (params || {}) as { id: string };

    if (!id) {
      return NextResponse.json({ error: "Document ID is required" }, { status: 400 });
    }

    const doc = await db.vaultDocument.findFirst({
      where: { id, organizationId: orgId, isDeleted: false },
    });

    if (!doc) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    const updated = await db.vaultDocument.update({
      where: { id },
      data: {
        isVerified: true,
        verifiedAt: new Date(),
        verifiedById: userId,
      },
    });

    // Write audit log
    try {
      await db.auditLog.create({
        data: {
          organizationId: orgId,
          userId,
          action: "ZAMBIA_DPA_DOCUMENT_VERIFIED",
          entityType: "VaultDocument",
          entityId: doc.id,
          details: {
            title: doc.title,
            docType: doc.docType,
            propertyId: doc.propertyId,
            statute: "Zambia Data Protection Act No. 3 of 2021",
          },
        },
      });
    } catch {
      // Non-blocking
    }

    return NextResponse.json({
      success: true,
      message: "Document marked as verified",
      document: updated,
    });
  },
});
