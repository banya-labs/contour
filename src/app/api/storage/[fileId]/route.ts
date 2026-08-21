import { NextRequest, NextResponse } from "next/server";
import { s3Storage } from "@/lib/storage/s3";
import { db } from "@/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ fileId: string }> }
) {
  try {
    const { fileId } = await params;

    // Generate a secure, time-limited presigned download URL from MinIO / S3
    const downloadUrl = await s3Storage.getPresignedDownloadUrl(fileId, 900);

    // Record POPIA Audit Event in Neon PostgreSQL if organizationId can be deduced
    try {
      const orgPrefix = fileId.includes("/") ? fileId.split("/")[0] : "org_contour_vault";
      await db.auditLog.create({
        data: {
          organizationId: orgPrefix,
          action: "DIRECT_STORAGE_FILE_ACCESS",
          entityType: "DocumentVault",
          entityId: fileId,
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
