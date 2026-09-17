import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getTenantContext } from "@/lib/tenant-context";
import { resolveContourRole, canManagePropertyPhotos } from "@/lib/authorization";
import { s3Storage } from "@/lib/storage/s3";
import { smartCache } from "@/lib/cache";
import { writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { existsSync } from "node:fs";

const MAX_IMAGE_BYTES = 15 * 1024 * 1024; // 15MB
const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/jpg",
]);

async function saveToLocalStaticStorage(
  organizationId: string,
  fileName: string,
  bytes: ArrayBuffer,
  mimeType: string
): Promise<string> {
  const safeOrgId = organizationId.replace(/[^a-zA-Z0-9_-]/g, "_");
  const sanitizedName = fileName.replace(/[^a-zA-Z0-9.-]/g, "_");
  const uniqueName = `${Date.now()}_${sanitizedName}`;

  try {
    const uploadDir = join(process.cwd(), "public", "uploads", "properties", safeOrgId);
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }
    const filePath = join(uploadDir, uniqueName);
    await writeFile(filePath, Buffer.from(bytes));
    return `/uploads/properties/${safeOrgId}/${uniqueName}`;
  } catch (fsErr: any) {
    console.warn("Failed to write to public/uploads, falling back to data URI:", fsErr?.message);
    const base64 = Buffer.from(bytes).toString("base64");
    return `data:${mimeType};base64,${base64}`;
  }
}

export async function POST(req: NextRequest) {
  try {
    const isLocalDevelopment =
      process.env.NODE_ENV !== "production" && process.env.NEXT_PUBLIC_DEV_MODE === "true";
    const demoTenant = {
      session: {
        user: {
          id: "user_demo_superadmin",
          name: "Demo Principal Broker",
          email: "grace@contour.demo",
          role: "SUPER_ADMIN",
        },
        session: {
          id: "sess_demo",
          activeOrganizationId: "org_contour_demo",
        },
      } as any,
      userId: "user_demo_superadmin",
      organizationId: "org_contour_demo",
      userRole: "SUPER_ADMIN",
      contourRole: "OWNER" as const,
      permissions: [],
    };

    let tenant = await getTenantContext(req);
    if (!tenant && isLocalDevelopment) {
      tenant = demoTenant;
    }

    if (!tenant) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const role = resolveContourRole(
      tenant.session?.user?.role ?? undefined,
      "member",
      tenant.userRole === "SUPER_ADMIN" ? "OWNER" : undefined
    );

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const propertyId = formData.get("propertyId") as string | null;

    if (!file) {
      return NextResponse.json({ success: false, error: "Image file is required." }, { status: 400 });
    }

    if (!ALLOWED_MIME_TYPES.has(file.type.toLowerCase())) {
      return NextResponse.json(
        { success: false, error: `Unsupported image format: ${file.type}. Allowed: JPEG, PNG, WebP, AVIF.` },
        { status: 400 }
      );
    }

    if (file.size <= 0 || file.size > MAX_IMAGE_BYTES) {
      return NextResponse.json(
        { success: false, error: `File size exceeds the 15MB limit (${(file.size / (1024 * 1024)).toFixed(1)}MB).` },
        { status: 400 }
      );
    }

    // If propertyId is provided, verify ownership or management permissions
    let existingProperty: any = null;
    if (propertyId) {
      existingProperty = await db.property.findFirst({
        where: {
          id: propertyId,
          organizationId: tenant.organizationId,
        },
        select: {
          id: true,
          title: true,
          photos: true,
          featuredPhoto: true,
          assignedAgentId: true,
          createdById: true,
        },
      });

      if (!existingProperty) {
        return NextResponse.json({ success: false, error: "Property not found in your organization." }, { status: 404 });
      }

      const canUpload = canManagePropertyPhotos(
        { id: tenant.userId, role: tenant.userRole, contourRole: role },
        existingProperty
      );

      if (!canUpload) {
        return NextResponse.json(
          {
            success: false,
            error: "Field agents can only upload photos to their assigned properties. Management can upload to any property.",
          },
          { status: 403 }
        );
      }
    }

    const organizationId = tenant.organizationId;
    const bytes = await file.arrayBuffer();
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");

    let photoUrl = "";

    // 1. Try MinIO / S3 Object Storage first
    try {
      const objectKey = s3Storage.generateObjectKey(organizationId, "PROPERTY_PHOTO", sanitizedName);
      await s3Storage.putObject(objectKey, bytes, file.type);
      const publicDomain = process.env.S3_PUBLIC_DOMAIN;
      const bucketName = process.env.S3_BUCKET_NAME || "contour-vault";

      if (publicDomain) {
        photoUrl = `${publicDomain.replace(/\/$/, "")}/${bucketName}/${objectKey}`;
      } else {
        photoUrl = await s3Storage.getPresignedDownloadUrl(objectKey, 604800); // 7 days
      }
    } catch (s3Error: any) {
      console.warn("S3 upload unavailable or unconfigured, safely falling back to static storage:", s3Error?.message || s3Error);

      // 2. Resilient fallback to local static storage or inline data URI
      photoUrl = await saveToLocalStaticStorage(organizationId, file.name, bytes, file.type);
    }

    // If attached to an existing property, update database
    if (existingProperty) {
      const currentPhotos = Array.isArray(existingProperty.photos) ? existingProperty.photos : [];
      const updatedPhotos = [...currentPhotos, photoUrl];
      const updatedFeaturedPhoto = existingProperty.featuredPhoto || photoUrl;

      const updated = await db.property.update({
        where: { id: existingProperty.id },
        data: {
          photos: updatedPhotos,
          featuredPhoto: updatedFeaturedPhoto,
        },
      });

      // Audit Log (Shielded so non-critical audit log failures do not abort upload)
      try {
        await db.auditLog.create({
          data: {
            organizationId,
            userId: tenant.userId,
            action: "PROPERTY_PHOTO_UPLOADED",
            entityType: "Property",
            entityId: existingProperty.id,
            details: {
              propertyTitle: existingProperty.title,
              fileName: file.name,
              fileSize: file.size,
              mimeType: file.type,
              photoUrl,
            },
          },
        });
      } catch (auditErr: any) {
        console.warn("Non-fatal audit log creation failure during photo upload:", auditErr?.message);
      }

      // Invalidate caches
      smartCache.invalidateTag(organizationId, "properties", "/dashboard/properties");

      return NextResponse.json({
        success: true,
        url: photoUrl,
        photos: updated.photos,
        featuredPhoto: updated.featuredPhoto,
        message: "Photo uploaded and attached to property successfully.",
      });
    }

    // For new listings (not yet created in DB)
    return NextResponse.json({
      success: true,
      url: photoUrl,
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type,
      message: "Photo uploaded successfully.",
    });
  } catch (error: any) {
    console.error("POST /api/properties/upload-image error:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to upload image", 
        details: error?.message || String(error) 
      },
      { status: 500 }
    );
  }
}
