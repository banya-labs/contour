import { NextRequest, NextResponse } from "next/server";
import { DocumentType, SecurityLevel } from "@prisma/client";
import { s3Storage, StorageCategory } from "@/lib/storage/s3";
import { db } from "@/lib/db";
import { getTenantContext } from "@/lib/tenant-context";
import { resolveContourRole, roleHasPermission } from "@/lib/authorization";
import { createHash } from "node:crypto";

const MAX_FILE_BYTES = 15 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set(["application/pdf", "image/jpeg", "image/png", "image/webp"]);

/**
 * GET /api/storage/upload?filename=deed.pdf&category=TITLE_DEED
 */
export async function GET(req: NextRequest) {
  try {
    const tenant = await getTenantContext(req);
    if (!tenant) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    const role = resolveContourRole(tenant.session.user.role ?? undefined, "member", tenant.userRole === "SUPER_ADMIN" ? "OWNER" : undefined);
    if (!roleHasPermission(role, "vault.upload")) return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const filename = searchParams.get("filename");
    const category = (searchParams.get("category") as StorageCategory) || "TITLE_DEED";
    const organizationId = tenant.organizationId;
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
    const tenant = await getTenantContext(req);
    if (!tenant) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    const role = resolveContourRole(tenant.session.user.role ?? undefined, "member", tenant.userRole === "SUPER_ADMIN" ? "OWNER" : undefined);
    if (!roleHasPermission(role, "vault.upload")) return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const title = (formData.get("title") as string) || "Uploaded Document";
    const requestedCategory = String(formData.get("docType") || "TITLE_DEED");
    const storageCategories: StorageCategory[] = [
      "PROPERTY_PHOTO",
      "SITE_SURVEY_DIAGRAM",
      "TITLE_DEED",
      "NRC_PASSPORT_ID",
      "MANDATE_AGREEMENT",
      "LEASE_CONTRACT",
    ];
    const storageCategory: StorageCategory = storageCategories.includes(requestedCategory as StorageCategory)
      ? (requestedCategory as StorageCategory)
      : "TITLE_DEED";
    const docType: DocumentType = storageCategory === "PROPERTY_PHOTO" ? DocumentType.OTHER : storageCategory;
    const requestedClassification = String(formData.get("classification") || "RESTRICTED_MANAGEMENT");
    const classifications: SecurityLevel[] = [
      SecurityLevel.RESTRICTED_MANAGEMENT,
      SecurityLevel.CONFIDENTIAL_PII,
      SecurityLevel.AGENT_ACCESSIBLE,
    ];
    const classification: SecurityLevel = classifications.includes(requestedClassification as SecurityLevel)
      ? (requestedClassification as SecurityLevel)
      : SecurityLevel.RESTRICTED_MANAGEMENT;
    const propertyId = formData.get("propertyId") as string | null;
    const registryFolio = formData.get("registryFolio") as string | null;
    const organizationId = tenant.organizationId;

    if (!file) {
      return NextResponse.json({ success: false, error: "File is required" }, { status: 400 });
    }
    if (file.size <= 0 || file.size > MAX_FILE_BYTES || !ALLOWED_MIME_TYPES.has(file.type)) {
      return NextResponse.json({ success: false, error: "Unsupported file type or size" }, { status: 400 });
    }

    const objectKey = s3Storage.generateObjectKey(organizationId, storageCategory, file.name);
    const bytes = await file.arrayBuffer();
    await s3Storage.putObject(objectKey, bytes, file.type || "application/octet-stream");
    const verified = await s3Storage.headObject(objectKey);
    if (verified.contentLength !== file.size || verified.contentType !== file.type) {
      return NextResponse.json({ success: false, error: "Uploaded object verification failed" }, { status: 422 });
    }
    const sha256Checksum = createHash("sha256").update(Buffer.from(bytes)).digest("hex");

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
        uploadedBy: tenant.userId,
        isVerified: true,
        sha256Checksum,
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
