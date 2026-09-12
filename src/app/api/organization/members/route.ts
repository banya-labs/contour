import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createApiHandler } from "@/lib/api-handler";
import { db } from "@/lib/db";
import { CONTOUR_ROLE_KEYS, ROLE_DESCRIPTIONS, ROLE_PRESETS } from "@/lib/authorization";

const memberUpdateSchema = z.object({
  memberId: z.string().min(1),
  roleKey: z.enum(CONTOUR_ROLE_KEYS.filter((key) => key !== "OWNER") as [string, ...string[]]).optional(),
  permissions: z.array(z.string()).optional(),
});

export const GET = createApiHandler({
  requireAuth: true,
  requirePermissions: ["org.members.read"],
  handler: async (_req, { organizationId }) => {
    const members = await db.member.findMany({
      where: { organizationId: organizationId!, status: "active" },
      include: {
        user: { select: { id: true, name: true, email: true, image: true, createdAt: true } },
        roleAssignments: { include: { role: { include: { permissions: true } } } },
        permissionOverrides: true,
      },
      orderBy: { createdAt: "asc" },
    });
    return NextResponse.json({
      success: true,
      roles: Object.entries(ROLE_DESCRIPTIONS).filter(([key]) => key !== "OWNER").map(([key, value]) => ({ key, ...value, permissions: ROLE_PRESETS[key as keyof typeof ROLE_PRESETS] })),
      members,
    });
  },
});

export const PATCH = createApiHandler({
  requireAuth: true,
  requirePermissions: ["org.members.update_role"],
  bodySchema: memberUpdateSchema,
  handler: async (_req, { body, organizationId, userId }) => {
    const member = await db.member.findFirst({ where: { id: body.memberId, organizationId: organizationId!, status: "active" } });
    if (!member) return NextResponse.json({ success: false, error: "Active workspace member not found" }, { status: 404 });
    if (member.role === "owner") return NextResponse.json({ success: false, error: "The workspace owner cannot be reassigned" }, { status: 400 });

    const roleKey = body.roleKey;
    if (roleKey) {
      const roleInfo = ROLE_DESCRIPTIONS[roleKey as keyof typeof ROLE_DESCRIPTIONS];
      const role = await db.organizationRole.upsert({
        where: { organizationId_key: { organizationId: organizationId!, key: roleKey } },
        create: { organizationId: organizationId!, key: roleKey, displayName: roleInfo.displayName, description: roleInfo.description, isSystem: true, permissions: { create: ROLE_PRESETS[roleKey as keyof typeof ROLE_PRESETS].map((permission) => ({ permission })) } },
        update: {},
      });
      await db.memberRoleAssignment.deleteMany({ where: { memberId: member.id } });
      await db.memberRoleAssignment.create({ data: { memberId: member.id, roleId: role.id, assignedById: userId } });
      await db.member.update({ where: { id: member.id }, data: { lastRoleChangedAt: new Date() } });
    }

    if (body.permissions) {
      await db.memberPermissionOverride.deleteMany({ where: { memberId: member.id } });
      if (body.permissions.length > 0) {
        await db.memberPermissionOverride.createMany({ data: body.permissions.map((permission) => ({ memberId: member.id, permission, effect: "ALLOW", assignedById: userId })) });
      }
    }

    return NextResponse.json({ success: true });
  },
});
