import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getTenantContext } from "@/lib/tenant-context";
import { assertVaultAccess, VaultSecurityError } from "@/lib/storage/vault-security";
export async function GET(req: NextRequest) {
  try {
    const tenant = await getTenantContext(req);
    if (!tenant) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const id = req.nextUrl.searchParams.get("id"), key = req.nextUrl.searchParams.get("key");
    if (!id && !key) return NextResponse.json({ error: "Missing document key or ID" }, { status: 400 });
    const document = await db.vaultDocument.findFirst({ where: { ...(id ? { id } : { objectKey: key! }), organizationId: tenant.organizationId, isDeleted: false } });
    if (!document) return NextResponse.json({ error: "Document not found" }, { status: 404 });
    await assertVaultAccess(tenant, document, "download");
    return NextResponse.redirect(new URL(`/api/vault/documents/${document.id}/download?direct=true`, req.url));
  } catch (error) {
    return NextResponse.json({ error: error instanceof VaultSecurityError ? error.message : "Unable to access document" }, { status: error instanceof VaultSecurityError ? error.status : 503 });
  }
}
