import { NextResponse } from "next/server";
import { z } from "zod";
import { createApiHandler } from "@/lib/api-handler";
import { db } from "@/lib/db";

const updateAccessSchema = z.object({
  userId: z.string().min(1),
  accessLevel: z.enum(["FULL_VAULT", "ASSIGNED_ONLY", "SPECIFIC_FOLDERS"]),
  propertyIds: z.array(z.string()).default([]),
  canVerifyDocs: z.boolean().default(false),
  canDeleteDocs: z.boolean().default(false),
});

export const GET = createApiHandler({
  requireAuth: true,
  requirePermissions: ["vault.grant_access"],
  handler: async (_req, { organizationId }) => {
    const orgId = organizationId!;

    // 1. Fetch organization members
    const members = await db.user.findMany({
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
        assignedProperties: {
          select: { id: true, title: true },
        },
        vaultGrants: {
          where: { organizationId: orgId },
          select: {
            id: true,
            accessLevel: true,
            propertyIds: true,
            canVerifyDocs: true,
            canDeleteDocs: true,
            updatedAt: true,
          },
        },
      },
    });

    // 2. Fetch properties for assignment picker
    const properties = await db.property.findMany({
      where: { organizationId: orgId },
      select: { id: true, title: true, suburb: true, status: true },
      orderBy: { title: "asc" },
    });

    return NextResponse.json({
      success: true,
      members: members.map((m) => ({
        ...m,
        vaultGrant: m.vaultGrants[0] || {
          accessLevel: m.role === "SUPER_ADMIN" || m.role === "BROKER_MANAGER" ? "FULL_VAULT" : "ASSIGNED_ONLY",
          propertyIds: [],
          canVerifyDocs: m.role === "SUPER_ADMIN" || m.role === "BROKER_MANAGER",
          canDeleteDocs: m.role === "SUPER_ADMIN",
        },
      })),
      properties,
    });
  },
});

export const POST = createApiHandler({
  requireAuth: true,
  requirePermissions: ["vault.grant_access"],
  bodySchema: updateAccessSchema,
  handler: async (_req, { organizationId, userId: grantedById, body }) => {
    const orgId = organizationId!;
    const data = body;

    const grant = await db.vaultAccessGrant.upsert({
      where: {
        organizationId_userId: {
          organizationId: orgId,
          userId: data.userId,
        },
      },
      create: {
        organizationId: orgId,
        userId: data.userId,
        accessLevel: data.accessLevel,
        propertyIds: data.propertyIds,
        canVerifyDocs: data.canVerifyDocs,
        canDeleteDocs: data.canDeleteDocs,
        grantedById: grantedById!,
      },
      update: {
        accessLevel: data.accessLevel,
        propertyIds: data.propertyIds,
        canVerifyDocs: data.canVerifyDocs,
        canDeleteDocs: data.canDeleteDocs,
        grantedById: grantedById!,
      },
    });

    // Write audit log
    try {
      await db.auditLog.create({
        data: {
          organizationId: orgId,
          userId: grantedById,
          action: "VAULT_ACCESS_CONTROL_UPDATED",
          entityType: "VaultAccessGrant",
          entityId: grant.id,
          details: {
            targetUserId: data.userId,
            accessLevel: data.accessLevel,
            propertyIdsCount: data.propertyIds?.length || 0,
          },
        },
      });
    } catch {
      // Non-blocking
    }

    return NextResponse.json({ success: true, grant });
  },
});
