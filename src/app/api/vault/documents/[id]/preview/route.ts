import { NextResponse } from "next/server";
import { createApiHandler } from "@/lib/api-handler";
import { db } from "@/lib/db";
import { s3Storage } from "@/lib/storage/s3";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { existsSync } from "node:fs";

export const GET = createApiHandler({
  requireAuth: true,
  requirePermissions: ["vault.read"],
  handler: async (_req, { params, organizationId }) => {
    const orgId = organizationId!;
    const { id } = (params || {}) as { id: string };

    if (!id) {
      return NextResponse.json({ error: "Document ID is required" }, { status: 400 });
    }

    const doc = await db.vaultDocument.findFirst({
      where: { id, organizationId: orgId, isDeleted: false },
    });

    if (!doc) {
      return NextResponse.json({ error: "Document not found or access denied" }, { status: 404 });
    }

    const mimeType = doc.mimeType || "application/octet-stream";

    // 1. Check if stored locally on disk
    if (doc.objectKey.startsWith("local:")) {
      const relPath = doc.objectKey.replace(/^local:/, "");
      const fullPath = join(process.cwd(), "public", relPath.replace(/^\//, ""));
      if (existsSync(fullPath)) {
        try {
          const buffer = await readFile(fullPath);
          return new NextResponse(new Uint8Array(buffer), {
            headers: {
              "Content-Type": mimeType,
              "Content-Length": String(buffer.length),
              "Cache-Control": "private, max-age=3600",
              "Content-Disposition": `inline; filename="${encodeURIComponent(doc.originalFileName || "document")}"`,
            },
          });
        } catch (readErr: any) {
          console.error("[Vault Preview] Local read error:", readErr);
        }
      }
    }

    // 2. Check MinIO S3 Object Storage
    if (s3Storage.isConfigured()) {
      try {
        const s3Obj = await s3Storage.getObject(doc.objectKey);
        return new NextResponse(new Uint8Array(s3Obj.body), {
          headers: {
            "Content-Type": mimeType || s3Obj.contentType,
            "Content-Length": String(s3Obj.contentLength),
            "Cache-Control": "private, max-age=3600",
            "Content-Disposition": `inline; filename="${encodeURIComponent(doc.originalFileName || "document")}"`,
          },
        });
      } catch (s3Err: any) {
        console.warn("[Vault Preview] S3 fetch notice, attempting local fallback check:", s3Err?.message);
      }
    }

    // 3. Fallback: Check if file exists in public/uploads/vault/
    const safeOrg = orgId.replace(/[^a-zA-Z0-9_-]/g, "_");
    const sanitizedName = (doc.originalFileName || "file").replace(/[^a-zA-Z0-9.-]/g, "_");
    const fallbackLocalDir = join(process.cwd(), "public", "uploads", "vault", safeOrg);
    if (existsSync(fallbackLocalDir)) {
      try {
        const { readdir } = await import("node:fs/promises");
        const files = await readdir(fallbackLocalDir);
        const match = files.find((f) => f.includes(sanitizedName));
        if (match) {
          const buffer = await readFile(join(fallbackLocalDir, match));
          return new NextResponse(new Uint8Array(buffer), {
            headers: {
              "Content-Type": mimeType,
              "Content-Length": String(buffer.length),
              "Cache-Control": "private, max-age=3600",
              "Content-Disposition": `inline; filename="${encodeURIComponent(doc.originalFileName || "document")}"`,
            },
          });
        }
      } catch {}
    }

    return NextResponse.json({ error: "Document file not found in storage" }, { status: 404 });
  },
});
