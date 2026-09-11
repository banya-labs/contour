import { NextResponse } from "next/server";
import { createApiHandler } from "@/lib/api-handler";
import { db } from "@/lib/db";

export const DELETE = createApiHandler({
  requireAuth: true,
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
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    // Guardrail: Cannot delete from archived property
    if (doc.property?.status === "ARCHIVED") {
      return NextResponse.json(
        {
          error: "Cannot delete document. This property is archived and its vault is permanently locked in read-only custody per Zambia DPA retention rules.",
        },
        { status: 423 }
      );
    }

    // Soft-delete document
    const updated = await db.vaultDocument.update({
      where: { id },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
        deletedById: userId,
      },
    });

    // Write audit log
    try {
      await db.auditLog.create({
        data: {
          organizationId: orgId,
          userId,
          action: "ZAMBIA_DPA_DOCUMENT_DELETED",
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
      message: "Document successfully soft-deleted",
      document: updated,
    });
  },
});
