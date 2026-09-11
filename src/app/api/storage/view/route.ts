import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getTenantContext } from "@/lib/tenant-context";
import { s3Storage } from "@/lib/storage/s3";
import { resolveContourRole, roleHasPermission } from "@/lib/authorization";

export async function GET(req: NextRequest) {
  try {
    const tenant = await getTenantContext(req);
    if (!tenant) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const role = resolveContourRole(tenant.session.user.role ?? undefined, "member", tenant.userRole === "SUPER_ADMIN" ? "OWNER" : undefined);
    if (!roleHasPermission(role, "vault.download")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const key = searchParams.get("key");
    const docId = searchParams.get("id");

    if (!key && !docId) {
      return NextResponse.json({ error: "Missing document key or ID" }, { status: 400 });
    }

    const document = docId
      ? await db.vaultDocument.findFirst({
          where: { id: docId, organizationId: tenant.organizationId, isDeleted: false },
          select: { objectKey: true },
        })
      : await db.vaultDocument.findFirst({
          where: { objectKey: key!, organizationId: tenant.organizationId, isDeleted: false },
          select: { objectKey: true },
        });

    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    const downloadUrl = await s3Storage.getPresignedDownloadUrl(document.objectKey, 900);
    return NextResponse.redirect(downloadUrl);
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to access document" },
      { status: 500 },
    );
  }
}
