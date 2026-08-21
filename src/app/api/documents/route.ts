import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";

const ORG_ID = "org_contour_demo";

// ── GET /api/documents ─────────────────────────────────────────────────────
// Returns all VaultDocument records from Neon, newest first.
// Each record contains the MinIO objectKey so the client can request a
// presigned download URL via GET /api/storage/[fileId].
export async function GET(_req: NextRequest) {
  try {
    const documents = await db.vaultDocument.findMany({
      where: { organizationId: ORG_ID },
      include: {
        property: {
          select: { id: true, title: true, suburb: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, documents });
  } catch (error: any) {
    console.error("GET /api/documents error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch vault documents", details: error.message },
      { status: 500 }
    );
  }
}

// ── POST /api/documents ────────────────────────────────────────────────────
// Saves document metadata to Neon AFTER the file has been uploaded to MinIO.
// The client:
//   1. Calls GET /api/storage/upload?filename=...&category=... to get presigned PUT URL
//   2. PUTs the file bytes directly to MinIO (presigned URL)
//   3. Calls POST /api/documents with the objectKey + metadata
const createDocSchema = z.object({
  title: z.string().min(3),
  docType: z.enum(["TITLE_DEED", "NRC_PASSPORT_ID", "MANDATE_AGREEMENT", "LEASE_CONTRACT", "SITE_SURVEY_DIAGRAM"]),
  classification: z.enum(["RESTRICTED_MANAGEMENT", "CONFIDENTIAL_PII", "AGENT_ACCESSIBLE"]).default("RESTRICTED_MANAGEMENT"),
  objectKey: z.string().min(1),           // MinIO object path returned from presigned upload
  originalFileName: z.string().min(1),
  fileSize: z.number().int().positive(),  // bytes
  mimeType: z.string().min(1),
  fileType: z.string().min(1),            // "PDF", "JPG", etc.
  propertyId: z.string().optional(),
  registryFolio: z.string().optional(),
  uploadedBy: z.string().default("Grace Banda (Principal Broker)"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = createDocSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data;

    const doc = await db.vaultDocument.create({
      data: {
        organizationId: ORG_ID,
        propertyId: data.propertyId || null,
        title: data.title,
        docType: data.docType,
        classification: data.classification,
        objectKey: data.objectKey,
        originalFileName: data.originalFileName,
        fileSize: data.fileSize,
        mimeType: data.mimeType,
        fileType: data.fileType,
        registryFolio: data.registryFolio || null,
        uploadedBy: data.uploadedBy,
        isVerified: true,
      },
      include: {
        property: { select: { id: true, title: true, suburb: true } },
      },
    });

    // Log POPIA audit event for the upload
    await db.auditLog.create({
      data: {
        organizationId: ORG_ID,
        action: "VAULT_DOCUMENT_UPLOAD",
        entityType: "VaultDocument",
        entityId: doc.id,
        details: {
          title: doc.title,
          docType: doc.docType,
          classification: doc.classification,
          objectKey: doc.objectKey,
          fileSize: doc.fileSize,
          uploadedBy: doc.uploadedBy,
        },
      },
    });

    return NextResponse.json({ success: true, document: doc }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/documents error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to save document record", details: error.message },
      { status: 500 }
    );
  }
}
