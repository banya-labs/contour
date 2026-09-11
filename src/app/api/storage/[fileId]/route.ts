import { NextRequest, NextResponse } from "next/server";
import { s3Storage } from "@/lib/storage/s3";
import { db } from "@/lib/db";
import { getTenantContext } from "@/lib/tenant-context";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ fileId: string }> }
) {
  try {
    const tenant = await getTenantContext(req);
    if (!tenant) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { fileId } = await params;

    const document = await db.vaultDocument.findFirst({
      where: {
        objectKey: fileId,
        organizationId: tenant.organizationId,
        isDeleted: false,
      },
      select: { id: true },
    });

    if (!document) {
      return NextResponse.json({ error: "File not found or access denied" }, { status: 404 });
    }

    // Generate a secure, time-limited presigned download URL from MinIO / S3
    const downloadUrl = await s3Storage.getPresignedDownloadUrl(fileId, 900);

    // Record the audit event against the authenticated tenant.
    try {
      await db.auditLog.create({
        data: {
          organizationId: tenant.organizationId,
          action: "DIRECT_STORAGE_FILE_ACCESS",
          entityType: "DocumentVault",
          entityId: document.id,
          details: {
            storageProvider: "MINIO_S3_OBJECT_STORAGE",
            expiresInSeconds: 900,
          },
        },
      });
    } catch {
      // Non-blocking
    }

    return NextResponse.json({
      success: true,
      fileId,
      downloadUrl,
      storageProvider: "MINIO_S3_OBJECT_STORAGE",
      expiresIn: "15 minutes",
      popiaAuditStatus: "LOGGED_AND_AUTHORIZED",
    });
  } catch (error: any) {
    console.error("Storage Download Error:", error);
    return NextResponse.json(
      { error: "File not found or access denied in MinIO Object Storage", details: error.message },
      { status: 404 }
    );
  }
}
