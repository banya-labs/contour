import { NextResponse } from "next/server";
import { createApiHandler } from "@/lib/api-handler";
import { db } from "@/lib/db";
import { assertVaultAccess, readVaultBinary, VaultSecurityError } from "@/lib/storage/vault-security";
export const GET = createApiHandler({
  requirePermissions: ["vault.download"],
  handler: async (req, ctx) => {
    const doc = await db.vaultDocument.findFirst({ where: { id: String(ctx.params?.id || ""), organizationId: ctx.organizationId!, isDeleted: false }, include: { property: { select: { status: true } } } });
    if (!doc) return NextResponse.json({ error: "Document not found" }, { status: 404 });
    try {
      await assertVaultAccess(ctx, doc, "download");
      const object = await readVaultBinary(doc);
      await db.auditLog.create({ data: { organizationId: ctx.organizationId!, userId: ctx.userId, action: "ZAMBIA_DPA_DOCUMENT_DOWNLOADED", entityType: "VaultDocument", entityId: doc.id } });
      const directDownloadUrl = `/api/vault/documents/${doc.id}/download?direct=true`;
      if (req.nextUrl.searchParams.get("direct") !== "true") return NextResponse.json({ success: true, documentId: doc.id, title: doc.title, downloadUrl: directDownloadUrl, directDownloadUrl, propertyStatus: doc.property?.status || "ACTIVE" });
      return new NextResponse(new Uint8Array(object.body), { headers: {
        "Content-Type": object.contentType,
        "Content-Length": String(object.body.length),
        "Content-Disposition": `attachment; filename="${encodeURIComponent(doc.originalFileName || "document")}"`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
        "Content-Security-Policy": "sandbox; default-src 'none'",
      } });
    } catch (error) {
      if (error instanceof VaultSecurityError) return NextResponse.json({ error: error.message }, { status: error.status });
      throw error;
    }
  },
});
