import { NextRequest, NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { db } from "@/lib/db";
import { s3Storage } from "@/lib/storage/s3";
import { getTenantContext } from "@/lib/tenant-context";
import { resolveContourRole, roleHasPermission } from "@/lib/authorization";

const MAX_LOGO_BYTES = 2 * 1024 * 1024;
const ALLOWED_LOGO_TYPES = new Set(["image/png", "image/jpeg", "image/webp", "image/svg+xml"]);

export async function GET(req: NextRequest) {
  const tenant = await getTenantContext(req);
  if (!tenant) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const organization = await db.organization.findUnique({
    where: { id: tenant.organizationId },
    select: { logo: true },
  });
  if (!organization?.logo) return NextResponse.json({ success: true, logoUrl: null });
  if (/^https?:\/\//i.test(organization.logo)) {
    return NextResponse.json({ success: true, logoUrl: organization.logo });
  }

  const logoUrl = await s3Storage.getPresignedDownloadUrl(organization.logo);
  return NextResponse.json({ success: true, logoUrl });
}

export async function POST(req: NextRequest) {
  const tenant = await getTenantContext(req);
  if (!tenant) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const role = resolveContourRole(
    tenant.session.user.role ?? undefined,
    "member",
    tenant.userRole === "SUPER_ADMIN" ? "OWNER" : undefined,
  );
  if (!roleHasPermission(role, "org.update")) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const file = (await req.formData()).get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ success: false, error: "Logo file is required" }, { status: 400 });
  }
  if (file.size <= 0 || file.size > MAX_LOGO_BYTES || !ALLOWED_LOGO_TYPES.has(file.type)) {
    return NextResponse.json({ success: false, error: "Logo must be a PNG, JPG, WebP, or SVG under 2 MB" }, { status: 400 });
  }

  const objectKey = s3Storage.generateObjectKey(tenant.organizationId, "ORGANIZATION_LOGO", file.name);
  const bytes = await file.arrayBuffer();
  await s3Storage.putObject(objectKey, bytes, file.type);
  const verified = await s3Storage.headObject(objectKey);
  if (verified.contentLength !== file.size || verified.contentType !== file.type) {
    return NextResponse.json({ success: false, error: "Logo upload verification failed" }, { status: 422 });
  }

  await db.organization.update({
    where: { id: tenant.organizationId },
    data: { logo: objectKey },
  });
  await db.auditLog.create({
    data: {
      organizationId: tenant.organizationId,
      userId: tenant.userId,
      action: "ORGANIZATION_LOGO_UPDATED",
      entityType: "Organization",
      entityId: tenant.organizationId,
      details: { fileName: file.name, mimeType: file.type, sha256: createHash("sha256").update(Buffer.from(bytes)).digest("hex") },
    },
  });

  return NextResponse.json({ success: true, logoUrl: await s3Storage.getPresignedDownloadUrl(objectKey) });
}
