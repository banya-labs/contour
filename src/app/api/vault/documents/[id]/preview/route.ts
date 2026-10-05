import { NextResponse } from "next/server";
import { createApiHandler } from "@/lib/api-handler";
import { db } from "@/lib/db";
import { assertVaultAccess, readVaultBinary, VaultSecurityError } from "@/lib/storage/vault-security";
export const GET = createApiHandler({
  requirePermissions: ["vault.read"],
  handler: async (_req, ctx) => {
    const doc = await db.vaultDocument.findFirst({ where: { id: String(ctx.params?.id || ""), organizationId: ctx.organizationId!, isDeleted: false } });
    if (!doc) return NextResponse.json({ error: "Document not found" }, { status: 404 });
    try {
      await assertVaultAccess(ctx, doc, "read");
      const object = await readVaultBinary(doc);
      return new NextResponse(new Uint8Array(object.body), { headers: {
        "Content-Type": object.contentType,
        "Content-Length": String(object.body.length),
        "Content-Disposition": `inline; filename="${encodeURIComponent(doc.originalFileName || "document")}"`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
        "Content-Security-Policy": "sandbox; default-src 'none'; frame-ancestors 'self'",
      } });
    } catch (error) {
      if (error instanceof VaultSecurityError) return NextResponse.json({ error: error.message }, { status: error.status });
      throw error;
    }
  },
});
