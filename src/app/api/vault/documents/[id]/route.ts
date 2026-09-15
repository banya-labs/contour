import { NextResponse } from "next/server";
import { createApiHandler } from "@/lib/api-handler";
import { db } from "@/lib/db";
import { s3Storage } from "@/lib/storage/s3";

export const GET = createApiHandler({
  requireAuth: true,
  requirePermissions: ["vault.read"],
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
          select: {
            id: true,
            title: true,
            suburb: true,
            status: true,
            titleDeedNumber: true,
          },
        },
        documentRequest: {
          select: {
            id: true,
            title: true,
            clientName: true,
            clientPhone: true,
            clientEmail: true,
            status: true,
          },
        },
      },
    });

    if (!doc) {
      return NextResponse.json({ error: "Document not found or access denied" }, { status: 404 });
    }

    // Look up uploader user if available
    let uploaderUser: { name: string; email: string; role?: string } | null = null;
    if (doc.uploadedById) {
      try {
        const user = await db.user.findUnique({
          where: { id: doc.uploadedById },
          select: { name: true, email: true, role: true },
        });
        if (user) uploaderUser = user;
      } catch {
        // Non-blocking
      }
    }

    // Look up verifier user if available
    let verifierUser: { name: string; email: string } | null = null;
    if (doc.verifiedById) {
      try {
        const user = await db.user.findUnique({
          where: { id: doc.verifiedById },
          select: { name: true, email: true },
        });
        if (user) verifierUser = user;
      } catch {
        // Non-blocking
      }
    }

    // Generate 15-minute presigned download/preview URL under Zambia DPA / S3 Vault standards
    let previewUrl: string | null = null;
    try {
      previewUrl = await s3Storage.getPresignedDownloadUrl(doc.objectKey, 900);
    } catch (err: any) {
      console.error("[Vault] Failed to generate presigned URL:", err);
    }

    // Record audit log
    try {
      await db.auditLog.create({
        data: {
          organizationId: orgId,
          userId,
          action: "ZAMBIA_DPA_DOCUMENT_VIEWED",
          entityType: "VaultDocument",
          entityId: doc.id,
          details: {
            title: doc.title,
            docType: doc.docType,
            propertyId: doc.propertyId,
            statute: "Zambia Data Protection Act No. 3 of 2021 (Section 27)",
          },
        },
      });
    } catch {
      // Non-blocking
    }

    return NextResponse.json({
      success: true,
      document: {
        ...doc,
        uploaderUser,
        verifierUser,
        previewUrl,
      },
    });
  },
});

export const DELETE = createApiHandler({
  requireAuth: true,
  requirePermissions: ["vault.delete"],
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
