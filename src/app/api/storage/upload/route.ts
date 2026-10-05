import { NextRequest, NextResponse } from "next/server";
import { DocumentType, SecurityLevel } from "@prisma/client";
import { s3Storage, StorageCategory } from "@/lib/storage/s3";
import { db } from "@/lib/db";
import { getTenantContext } from "@/lib/tenant-context";
import { assertVaultAccess, passiveVaultMime, VAULT_MAX_BYTES, VaultSecurityError } from "@/lib/storage/vault-security";
import { createHash } from "node:crypto";


/**
 * GET /api/storage/upload?filename=deed.pdf&category=TITLE_DEED
 */
export async function GET(req: NextRequest) {
  try {
    const tenant = await getTenantContext(req);
    if (!tenant) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    if (!tenant.permissions.includes("vault.upload")) return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const filename = searchParams.get("filename");
    const category = (searchParams.get("category") as StorageCategory) || "TITLE_DEED";
    const organizationId = tenant.organizationId;
    const mimeType = passiveVaultMime(searchParams.get("mimeType") || "");
    if (!["ORGANIZATION_LOGO", "PROPERTY_PHOTO", "SITE_SURVEY_DIAGRAM", "TITLE_DEED", "NRC_PASSPORT_ID", "MANDATE_AGREEMENT", "LEASE_CONTRACT"].includes(category)) throw new VaultSecurityError("Invalid storage category");
    if (!s3Storage.isConfigured()) throw new VaultSecurityError("Private document storage is unavailable", 503);

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
      publicCdnUrl: category === "PROPERTY_PHOTO" || category === "ORGANIZATION_LOGO" ? publicCdnUrl : "",
    });
  } catch (error: unknown) {
    if (error instanceof VaultSecurityError) return NextResponse.json({ error: error.message }, { status: error.status });
    console.error("GET /api/storage/upload error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to generate presigned upload URL" },
      { status: 503 }
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
    if (!tenant.permissions.includes("vault.upload")) return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const title = (formData.get("title") as string) || "Uploaded Document";
    const requestedCategory = String(formData.get("docType") || "TITLE_DEED");
    const storageCategories = [
      "PROPERTY_PHOTO",
      "SITE_SURVEY_DIAGRAM",
      "TITLE_DEED",
      "NRC_PASSPORT_ID",
      "MANDATE_AGREEMENT",
      "LEASE_CONTRACT",
    ] as const;
    const storageCategory: StorageCategory = storageCategories.includes(requestedCategory as typeof storageCategories[number])
      ? (requestedCategory as typeof storageCategories[number])
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
    const standPlotNumber = formData.get("standPlotNumber") as string | null;
    const nrcNumber = formData.get("nrcNumber") as string | null;
    const organizationId = tenant.organizationId;

    if (!file) {
      return NextResponse.json({ success: false, error: "File is required" }, { status: 400 });
    }
    const mime = passiveVaultMime(file.type || "");
    if (file.size <= 0 || file.size > VAULT_MAX_BYTES) throw new VaultSecurityError("Document size exceeds allowed limits");
    if (!s3Storage.isConfigured()) throw new VaultSecurityError("Private document storage is unavailable", 503);
    const objectKey = s3Storage.generateObjectKey(organizationId, storageCategory, file.name);
    await assertVaultAccess(tenant, { organizationId, propertyId: propertyId || null, objectKey }, "upload");
    const bytes = await file.arrayBuffer();
    const sha256Checksum = createHash("sha256").update(Buffer.from(bytes)).digest("hex");
    try { await s3Storage.putObject(objectKey, bytes, mime); }
    catch { throw new VaultSecurityError("Private document storage is unavailable", 503); }

    // Save metadata in PostgreSQL
    const doc = await db.vaultDocument.create({
      data: {
        organizationId,
        title,
        docType,
        classification,
        objectKey,
        originalFileName: file.name,
        fileSize: file.size,
        mimeType: mime,
        fileType: file.name.split(".").pop()?.toUpperCase() || "PDF",
        propertyId: propertyId || undefined,
        registryFolio: registryFolio || undefined,
        standPlotNumber: standPlotNumber || undefined,
        nrcNumber: nrcNumber || undefined,
        uploadedBy: tenant.userId,
        isVerified: false,
        sha256Checksum,
      },
      include: {
        property: {
          select: { id: true, title: true, suburb: true }
        }
      }
    });

    return NextResponse.json({ success: true, document: doc });
  } catch (error: unknown) {
    if (error instanceof VaultSecurityError) return NextResponse.json({ error: error.message }, { status: error.status });
    console.error("Direct upload error:", error);
    return NextResponse.json({ success: false, error: "Private document storage is unavailable" }, { status: 503 });
  }
}
