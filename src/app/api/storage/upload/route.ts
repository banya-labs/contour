import { NextRequest, NextResponse } from "next/server";
import { s3Storage, StorageCategory } from "@/lib/storage/s3";

/**
 * GET /api/storage/upload?filename=deed.pdf&category=TITLE_DEED&organizationId=org_contour_demo
 *
 * Returns a presigned PUT URL the browser can use to upload directly to MinIO
 * without buffering through the Next.js server. Also returns the objectKey to
 * be stored in Neon via POST /api/documents after a successful upload.
 *
 * Flow:
 *   1. Client calls this endpoint to get { uploadUrl, objectKey }
 *   2. Client PUTs the file bytes to uploadUrl (direct to MinIO)
 *   3. Client calls POST /api/documents with objectKey + document metadata
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
      instructions: "PUT the file bytes to uploadUrl, then POST objectKey + metadata to /api/documents",
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
 * POST /api/storage/upload (legacy — kept for backward-compat but redirects to new flow)
 */
export async function POST(req: NextRequest) {
  return NextResponse.json(
    {
      success: false,
      error: "Deprecated. Use GET /api/storage/upload to get a presigned URL, then POST metadata to /api/documents.",
    },
    { status: 410 }
  );
}
