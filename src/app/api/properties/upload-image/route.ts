import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth, type Session } from "@/lib/auth";
import { getTenantContext } from "@/lib/tenant-context";
import { resolveContourRole, canManagePropertyPhotos } from "@/lib/authorization";
import { s3Storage } from "@/lib/storage/s3";
import { smartCache } from "@/lib/cache";
import { writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { existsSync } from "node:fs";
import sharp from "sharp";

const MAX_IMAGE_BYTES = 25 * 1024 * 1024; // 25MB to accommodate high-res camera photos
async function processAndSaveImage(
  organizationId: string,
  fileName: string,
  rawBytes: ArrayBuffer,
  originalMime: string
): Promise<{ buffer: Buffer; localUrl: string; mimeType: string; sanitizedName: string }> {
  const safeOrgId = organizationId.replace(/[^a-zA-Z0-9_-]/g, "_");
  const baseName = fileName.replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9_-]/g, "_");
  const uniqueName = `${Date.now()}_${baseName}.webp`;

  let processedBuffer: Buffer;
  let finalMime = "image/webp";

  try {
    processedBuffer = await sharp(Buffer.from(rawBytes))
      .rotate() // auto-orient based on camera EXIF tags
      .resize(2048, 2048, { fit: "inside", withoutEnlargement: true }) // optimize huge 48MP photos
      .webp({ quality: 85 })
      .toBuffer();
  } catch (sharpErr: unknown) {
    console.warn("Sharp image processing fallback:", sharpErr instanceof Error ? sharpErr.message : "unknown error");
    processedBuffer = Buffer.from(rawBytes);
    finalMime = originalMime || "image/jpeg";
  }

  try {
    const uploadDir = join(process.cwd(), "public", "uploads", "properties", safeOrgId);
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }
    const filePath = join(uploadDir, uniqueName);
    await writeFile(filePath, processedBuffer);
    return {
      buffer: processedBuffer,
      localUrl: `/uploads/properties/${safeOrgId}/${uniqueName}`,
      mimeType: finalMime,
      sanitizedName: uniqueName,
    };
  } catch (fsErr: unknown) {
    console.warn("Failed to write to public/uploads, falling back to data URI:", fsErr instanceof Error ? fsErr.message : "unknown error");
    const base64 = processedBuffer.toString("base64");
    return {
      buffer: processedBuffer,
      localUrl: `data:${finalMime};base64,${base64}`,
      mimeType: finalMime,
      sanitizedName: uniqueName,
    };
  }
}

export async function POST(req: NextRequest) {
  try {
    const isLocalDevelopment =
      process.env.NODE_ENV !== "production" || process.env.NEXT_PUBLIC_DEV_MODE === "true";
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
      } as Session,
      userId: "user_demo_superadmin",
      organizationId: "org_contour_demo",
      userRole: "SUPER_ADMIN",
      contourRole: "OWNER" as const,
      permissions: [],
    };

    let tenant = await getTenantContext(req);
    if (!tenant) {
      // Fallback: If user is authenticated in Better Auth session, find their active organization
      try {
        const session = await auth.api.getSession({ headers: req.headers });
        if (session?.user?.id) {
          const member = await db.member.findFirst({
            where: { userId: session.user.id, status: "active" },
            orderBy: { createdAt: "desc" },
          });
          if (member) {
            tenant = {
              session,
              userId: session.user.id,
              organizationId: member.organizationId,
              userRole: "role" in session.user && typeof session.user.role === "string" ? session.user.role : "FIELD_AGENT",
              contourRole: resolveContourRole("role" in session.user && typeof session.user.role === "string" ? session.user.role : undefined, member.role),
              permissions: [],
            };
          }
        }
      } catch (authErr) {
        console.warn("Session fallback check error:", authErr);
      }
    }

    if (!tenant && isLocalDevelopment) {
      try {
        const firstOrg = await db.organization.findFirst({ select: { id: true } });
        if (firstOrg) {
          demoTenant.organizationId = firstOrg.id;
          demoTenant.session.session.activeOrganizationId = firstOrg.id;
        }
      } catch {}
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

    let propertyId: string | null = null;
    type ImagePayload = { name: string; bytes: ArrayBuffer; mimeType: string };
    const rawFiles: ImagePayload[] = [];

    const contentType = (req.headers.get("content-type") || "").toLowerCase();

    if (contentType.includes("application/json")) {
      // 1. Resilient JSON Base64 Payload Support (bypasses any multipart parsing issues)
      const json = await req.json();
      propertyId = json.propertyId || null;
      const fileList = Array.isArray(json.files) ? json.files : json.file ? [json.file] : [];
      for (const item of fileList) {
        if (!item || !item.base64) continue;
        const name = (item.name || `photo_${Date.now()}.webp`).replace(/[^a-zA-Z0-9._-]/g, "_");
        const cleanBase64 = item.base64.replace(/^data:[^;]+;base64,/, "");
        const buffer = Buffer.from(cleanBase64, "base64");
        rawFiles.push({
          name,
          bytes: buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength),
          mimeType: item.type || "image/jpeg",
        });
      }
    } else {
      // 2. Standard Multipart / FormData parsing
      const formData = await req.formData();
      propertyId = formData.get("propertyId") as string | null;

      const filesList = formData.getAll("files");
      for (const f of filesList) {
        if (f instanceof File && f.size > 0) {
          const bytes = await f.arrayBuffer();
          rawFiles.push({
            name: f.name.replace(/[^a-zA-Z0-9._-]/g, "_"),
            bytes,
            mimeType: f.type || "image/jpeg",
          });
        }
      }
      const singleFiles = formData.getAll("file");
      for (const f of singleFiles) {
        if (f instanceof File && f.size > 0 && !rawFiles.some((r) => r.name === f.name)) {
          const bytes = await f.arrayBuffer();
          rawFiles.push({
            name: f.name.replace(/[^a-zA-Z0-9._-]/g, "_"),
            bytes,
            mimeType: f.type || "image/jpeg",
          });
        }
      }
    }

    if (rawFiles.length === 0) {
      return NextResponse.json({ success: false, error: "At least one image file is required." }, { status: 400 });
    }

    for (const file of rawFiles) {
      if (file.bytes.byteLength <= 0 || file.bytes.byteLength > MAX_IMAGE_BYTES) {
        return NextResponse.json(
          { success: false, error: `File "${file.name}" exceeds the 25MB limit (${(file.bytes.byteLength / (1024 * 1024)).toFixed(1)}MB).` },
          { status: 400 }
        );
      }
    }

    // If propertyId is provided, verify ownership or management permissions
    let existingProperty: {
      id: string;
      title: string;
      photos: unknown;
      featuredPhoto: string | null;
      assignedAgentId: string | null;
      createdById: string | null;
    } | null = null;
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
    const uploadedUrls: string[] = [];

    for (const file of rawFiles) {
      const processed = await processAndSaveImage(organizationId, file.name, file.bytes, file.mimeType);
      let photoUrl = processed.localUrl;

      // 2. Concurrently archive to MinIO / S3 Object Storage if configured
      if (s3Storage.isConfigured()) {
        try {
          const objectKey = s3Storage.generateObjectKey(organizationId, "PROPERTY_PHOTO", processed.sanitizedName);
          await s3Storage.putObject(objectKey, processed.buffer, processed.mimeType);
          
          // Only use S3 public domain if explicitly configured and non-empty
          const publicDomain = (process.env.S3_PUBLIC_DOMAIN || "").trim();
          const bucketName = process.env.S3_BUCKET_NAME || "contour-vault";
          if (publicDomain && !publicDomain.includes("cdn.banyalabs.com")) {
            photoUrl = `${publicDomain.replace(/\/$/, "")}/${bucketName}/${objectKey}`;
          }
        } catch (s3Error: unknown) {
          console.warn("S3 background archive notice (using local storage):", s3Error instanceof Error ? s3Error.message : "unknown error");
        }
      }

      uploadedUrls.push(photoUrl);
    }

    // If attached to an existing property, update database with all new photos
    if (existingProperty) {
      const currentPhotos = Array.isArray(existingProperty.photos) ? existingProperty.photos : [];
      const updatedPhotos = [...currentPhotos, ...uploadedUrls];
      const updatedFeaturedPhoto = existingProperty.featuredPhoto || updatedPhotos[0];

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
              count: uploadedUrls.length,
              urls: uploadedUrls,
            },
          },
        });
      } catch (auditErr: unknown) {
        console.warn("Non-fatal audit log creation failure during photo upload:", auditErr instanceof Error ? auditErr.message : "unknown error");
      }

      // Invalidate caches
      smartCache.invalidateTag(organizationId, "properties", "/dashboard/properties");

      return NextResponse.json({
        success: true,
        url: uploadedUrls[0],
        urls: uploadedUrls,
        photos: updated.photos,
        featuredPhoto: updated.featuredPhoto,
        message: `${uploadedUrls.length} photo(s) uploaded and attached successfully.`,
      });
    }

    // For new listings (not yet created in DB)
    return NextResponse.json({
      success: true,
      url: uploadedUrls[0],
      urls: uploadedUrls,
      count: uploadedUrls.length,
      message: `${uploadedUrls.length} photo(s) uploaded successfully.`,
    });
  } catch (error: unknown) {
    console.error("POST /api/properties/upload-image error:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to upload image", 
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
