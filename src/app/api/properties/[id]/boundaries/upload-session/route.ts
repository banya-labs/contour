import { NextResponse } from "next/server";
import { z } from "zod";
import { createApiHandler } from "@/lib/api-handler";
import { db } from "@/lib/db";
import { s3Storage } from "@/lib/storage/s3";

const uploadSessionSchema = z.object({
  fileName: z.string().trim().min(1).max(180),
  mimeType: z.enum(["application/pdf", "image/jpeg", "image/png", "image/webp"]),
  fileSize: z.number().int().positive().max(15 * 1024 * 1024),
  sha256: z.string().regex(/^[a-f0-9]{64}$/).optional(),
});

export const POST = createApiHandler({
  requirePermissions: ["vault.upload"],
  bodySchema: uploadSessionSchema,
  handler: async (_req, { body, organizationId, userId, session, params }) => {
    const propertyId = typeof params?.id === "string" ? params.id : null;
    if (!propertyId || !organizationId || !userId) return NextResponse.json({ error: "Property is required" }, { status: 400 });

    const property = await db.property.findFirst({ where: { id: propertyId, organizationId }, select: { id: true, title: true, status: true } });
    if (!property) return NextResponse.json({ error: "Property not found" }, { status: 404 });
    if (property.status === "ARCHIVED") return NextResponse.json({ error: "Archived properties are read-only" }, { status: 423 });

    const { uploadUrl, objectKey } = await s3Storage.getPresignedUploadUrl(organizationId, "SITE_SURVEY_DIAGRAM", body.fileName, body.mimeType);
    const document = await db.vaultDocument.create({
      data: {
        organizationId,
        propertyId,
        title: `Survey evidence — ${property.title}`,
        docType: "SITE_SURVEY_DIAGRAM",
        classification: "RESTRICTED_MANAGEMENT",
        objectKey,
        originalFileName: body.fileName,
        fileSize: body.fileSize,
        mimeType: body.mimeType,
        fileType: body.fileName.split(".").pop()?.toUpperCase() || "BIN",
        uploadedBy: session?.user?.name || userId,
        uploadedByType: "STAFF",
        uploadedById: userId,
        isVerified: false,
        sha256Checksum: body.sha256,
      },
      select: { id: true, objectKey: true, originalFileName: true, fileSize: true, mimeType: true },
    });

    await db.auditLog.create({
      data: {
        organizationId,
        userId,
        action: "BOUNDARY_SOURCE_UPLOAD_SESSION_CREATED",
        entityType: "VaultDocument",
        entityId: document.id,
        details: { propertyId, fileType: body.mimeType, fileSize: body.fileSize },
      },
    });

    return NextResponse.json({ success: true, document, uploadUrl, expiresInSeconds: 900 }, { status: 201 });
  },
});
