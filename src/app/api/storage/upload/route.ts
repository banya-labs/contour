import { NextRequest, NextResponse } from "next/server";
import { s3Storage, StorageCategory } from "@/lib/storage/s3";
import { db } from "@/lib/db";

/**
 * GET /api/storage/upload?filename=deed.pdf&category=TITLE_DEED&organizationId=org_contour_demo
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const filename = searchParams.get("filename");
    const category = (searchParams.get("category") as StorageCategory) || "TITLE_DEED";
    const organizationId = searchParams.get("organizationId") || "org_contour_demo";
    const mimeType = searchParams.get("mimeType") || "application/octet-stream";

    if (!filename) {
      return NextResponse.json(
        { success: false, error: "filename query parameter is required" },
        { status: 400 }
      );
    }

    const { uploadUrl, objectKey, publicCdnUrl } = await s3Storage.getPresignedUploadUrl(
      organizationId,
      category,
      filename,
      mimeType
    );

    return NextResponse.json({
      success: true,
      uploadUrl,
      objectKey,
      publicCdnUrl,
    });
  } catch (error: any) {
    console.error("GET /api/storage/upload error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to generate presigned upload URL", details: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/storage/upload (Direct Server-Side Multi-part Upload to MinIO & Neon DB)
 */
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const title = (formData.get("title") as string) || "Uploaded Document";
    const docType = (formData.get("docType") as StorageCategory) || "TITLE_DEED";
    const classification = (formData.get("classification") as any) || "RESTRICTED_MANAGEMENT";
    const propertyId = formData.get("propertyId") as string | null;
    const registryFolio = formData.get("registryFolio") as string | null;
    const organizationId = (formData.get("organizationId") as string) || "org_contour_demo";

    if (!file) {
      return NextResponse.json({ success: false, error: "File is required" }, { status: 400 });
    }

    const objectKey = s3Storage.generateObjectKey(organizationId, docType, file.name);
    const bytes = await file.arrayBuffer();

    // Stream directly to MinIO
    const s3Endpoint = process.env.S3_ENDPOINT || "http://contour-minio-8b621a-169-58-105-19.sslip.io";
    const bucket = process.env.S3_BUCKET_NAME || "contour-vault";
    const s3Url = `${s3Endpoint}/${bucket}/${objectKey}`;

    try {
      await fetch(s3Url, {
        method: "PUT",
        headers: { "Content-Type": file.type || "application/octet-stream" },
        body: bytes,
        signal: AbortSignal.timeout(10000),
      });
    } catch (s3Err) {
      console.warn("Direct MinIO stream warning:", s3Err);
    }

    // Save metadata in Neon PostgreSQL
    const doc = await db.vaultDocument.create({
      data: {
        organizationId,
        title,
        docType,
        classification,
        objectKey,
        originalFileName: file.name,
        fileSize: file.size,
        mimeType: file.type || "application/octet-stream",
        fileType: file.name.split(".").pop()?.toUpperCase() || "PDF",
        propertyId: propertyId || undefined,
        registryFolio: registryFolio || undefined,
        uploadedBy: "Principal Broker",
        isVerified: true,
      },
      include: {
        property: {
          select: { id: true, title: true, suburb: true }
        }
      }
    });

    return NextResponse.json({ success: true, document: doc });
  } catch (error: any) {
    console.error("Direct upload error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
