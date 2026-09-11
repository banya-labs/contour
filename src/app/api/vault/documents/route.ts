import { NextResponse } from "next/server";
import { z } from "zod";
import { createApiHandler } from "@/lib/api-handler";
import { db } from "@/lib/db";

// ── GET /api/vault/documents ─────────────────────────────────────────────────
export const GET = createApiHandler({
  requireAuth: true,
  requirePermissions: ["vault.read"],
  handler: async (_req, { organizationId, userId, userRole }) => {
    const orgId = organizationId!;

    // 1. Determine user access grant
    let accessLevel = "FULL_VAULT";
    let whitelistedPropertyIds: string[] = [];

    if (userRole !== "SUPER_ADMIN" && userRole !== "BROKER_MANAGER") {
      const grant = await db.vaultAccessGrant.findUnique({
        where: {
          organizationId_userId: {
            organizationId: orgId,
            userId: userId || "",
          },
        },
      });

      if (grant) {
        accessLevel = grant.accessLevel;
        whitelistedPropertyIds = grant.propertyIds;
      } else {
        accessLevel = "ASSIGNED_ONLY";
      }
    }

    // 2. Build property filter based on 3-tier access control
    let propertyFilter: any = undefined;

    if (accessLevel === "ASSIGNED_ONLY") {
      const assignedProps = await db.property.findMany({
        where: {
          organizationId: orgId,
          assignedAgentId: userId,
        },
        select: { id: true },
      });
      const assignedIds = assignedProps.map((p) => p.id);
      propertyFilter = {
        OR: [
          { propertyId: { in: assignedIds } },
          { propertyId: null }, // Agency-wide documents always visible
        ],
      };
    } else if (accessLevel === "SPECIFIC_FOLDERS") {
      propertyFilter = {
        OR: [
          { propertyId: { in: whitelistedPropertyIds } },
          { propertyId: null },
        ],
      };
    }

    // 3. Fetch documents
    const documents = await db.vaultDocument.findMany({
      where: {
        organizationId: orgId,
        isDeleted: false,
        ...(propertyFilter || {}),
      },
      include: {
        property: {
          select: {
            id: true,
            title: true,
            suburb: true,
            status: true,
            titleDeedNumber: true,
          },
        },
        documentRequest: {
          select: {
            id: true,
            title: true,
            clientName: true,
            status: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // 4. Fetch all active and archived properties for tree & grid visualization
    const properties = await db.property.findMany({
      where: { organizationId: orgId },
      select: {
        id: true,
        title: true,
        suburb: true,
        status: true,
        titleDeedNumber: true,
        assignedAgentId: true,
        assignedAgent: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            image: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // 5. Fetch all organization members with vault grants for collaborator management
    const membersRaw = await db.user.findMany({
      where: {
        members: {
          some: { organizationId: orgId },
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        image: true,
        vaultGrants: {
          where: { organizationId: orgId },
          select: {
            accessLevel: true,
            propertyIds: true,
            canVerifyDocs: true,
            canDeleteDocs: true,
          },
        },
      },
    });

    const members = membersRaw.map((m) => ({
      id: m.id,
      name: m.name,
      email: m.email,
      role: m.role,
      image: m.image,
      vaultGrant: m.vaultGrants[0] || {
        accessLevel: m.role === "SUPER_ADMIN" || m.role === "BROKER_MANAGER" ? "FULL_VAULT" : "ASSIGNED_ONLY",
        propertyIds: [],
        canVerifyDocs: m.role === "SUPER_ADMIN" || m.role === "BROKER_MANAGER",
        canDeleteDocs: m.role === "SUPER_ADMIN",
      },
    }));

    return NextResponse.json({
      success: true,
      accessLevel,
      documents,
      properties,
      members,
    });
  },
});

// ── POST /api/vault/documents ────────────────────────────────────────────────
const createVaultDocSchema = z.object({
  title: z.string().min(3),
  docType: z.enum([
    "TITLE_DEED",
    "NRC_PASSPORT_ID",
    "MANDATE_AGREEMENT",
    "LEASE_CONTRACT",
    "SITE_SURVEY_DIAGRAM",
    "PACRA_CERTIFICATE",
    "VALUATION_REPORT",
    "PROOF_OF_RESIDENCE",
    "PAYMENT_RECEIPT",
    "CLIENT_CORRESPONDENCE",
    "OTHER",
  ]),
  classification: z.enum(["RESTRICTED_MANAGEMENT", "CONFIDENTIAL_PII", "AGENT_ACCESSIBLE"]).default("RESTRICTED_MANAGEMENT"),
  objectKey: z.string().min(1),
  originalFileName: z.string().min(1),
  fileSize: z.number().int().positive(),
  mimeType: z.string().min(1),
  fileType: z.string().min(1),
  propertyId: z.string().optional().nullable(),
  registryFolio: z.string().optional().nullable(),
  standPlotNumber: z.string().optional().nullable(),
  nrcNumber: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  uploadedBy: z.string().optional(),
});

export const POST = createApiHandler({
  requireAuth: true,
  requirePermissions: ["vault.upload"],
  bodySchema: createVaultDocSchema,
  handler: async (_req, { organizationId, userId, body, session }) => {
    const orgId = organizationId!;
    const data = body;

    // Guardrail: Check if property is ARCHIVED
    if (data.propertyId) {
      const property = await db.property.findUnique({
        where: { id: data.propertyId },
        select: { id: true, title: true, status: true },
      });

      if (!property) {
        return NextResponse.json({ error: "Property not found" }, { status: 404 });
      }

      if (property.status === "ARCHIVED") {
        return NextResponse.json(
          {
            error: "Property is archived. This vault is locked to read-only mode under Zambia DPA statutory retention standards.",
            status: 423,
          },
          { status: 423 }
        );
      }
    }

    const uploaderName = data.uploadedBy || session?.user?.name || "Field Agent";

    const doc = await db.vaultDocument.create({
      data: {
        organizationId: orgId,
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
        standPlotNumber: data.standPlotNumber || null,
        nrcNumber: data.nrcNumber || null,
        description: data.description || null,
        uploadedBy: uploaderName,
        uploadedByType: "STAFF",
        uploadedById: userId,
        isVerified: data.docType === "TITLE_DEED" ? false : true,
      },
      include: {
        property: { select: { id: true, title: true, suburb: true, status: true } },
      },
    });

    // Write audit log
    try {
      await db.auditLog.create({
        data: {
          organizationId: orgId,
          userId,
          action: "ZAMBIA_DPA_DOCUMENT_UPLOADED",
          entityType: "VaultDocument",
          entityId: doc.id,
          details: {
            title: doc.title,
            docType: doc.docType,
            classification: doc.classification,
            propertyId: doc.propertyId,
            statute: "Zambia Data Protection Act No. 3 of 2021",
          },
        },
      });
    } catch {
      // Non-blocking
    }

    return NextResponse.json({ success: true, document: doc }, { status: 201 });
  },
});
