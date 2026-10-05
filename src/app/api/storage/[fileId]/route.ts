import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getTenantContext } from "@/lib/tenant-context";
import { assertVaultAccess, VaultSecurityError } from "@/lib/storage/vault-security";
export async function GET(req: NextRequest, { params }: { params: Promise<{ fileId: string }> }) {
  try {
    const tenant = await getTenantContext(req);
    if (!tenant) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { fileId } = await params;
    const document = await db.vaultDocument.findFirst({ where: { objectKey: fileId, organizationId: tenant.organizationId, isDeleted: false } });
    if (!document) return NextResponse.json({ error: "Document not found" }, { status: 404 });
    await assertVaultAccess(tenant, document, "download");
    return NextResponse.json({ success: true, fileId, downloadUrl: `/api/vault/documents/${document.id}/download?direct=true`, storageProvider: "PRIVATE_DOCUMENT_STORAGE" });
  } catch (error) {
    return NextResponse.json({ error: error instanceof VaultSecurityError ? error.message : "Unable to access document" }, { status: error instanceof VaultSecurityError ? error.status : 503 });
  }
}
