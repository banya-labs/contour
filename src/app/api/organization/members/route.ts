import { NextResponse } from "next/server";
import { z } from "zod";
import { createApiHandler } from "@/lib/api-handler";
import { db } from "@/lib/db";
import { applyPermissionOverrides, CONTOUR_ROLE_KEYS, PERMISSIONS, permissionOverridesForSelection, ROLE_DESCRIPTIONS, ROLE_PRESETS, type Permission } from "@/lib/authorization";
import { PERMISSION_GROUPS } from "@/lib/authorization-groups";
import { normalizeWhatsAppPhone } from "@/lib/phone-input";
import { smartCache } from "@/lib/cache";

const memberUpdateSchema = z.object({
  memberId: z.string().min(1),
  roleKey: z.enum([...CONTOUR_ROLE_KEYS.filter((key) => key !== "OWNER"), "NONE"] as unknown as [string, ...string[]]).optional(),
  status: z.enum(["active", "suspended"]).optional(),
  permissions: z.array(z.enum(PERMISSIONS)).optional(),
  phone: z.string().nullable().optional(),
});

const memberDeleteSchema = z.object({
  memberId: z.string().min(1).optional(),
});

export const GET = createApiHandler({
  requireAuth: true,
  requirePermissions: ["org.members.read"],
  handler: async (_req, { organizationId }) => {
    const members = await db.member.findMany({
      where: { organizationId: organizationId! },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true, image: true, createdAt: true } },
        roleAssignments: { include: { role: { include: { permissions: true } } } },
        permissionOverrides: true,
      },
      orderBy: { createdAt: "asc" },
    });
    const membersWithEffectivePermissions = members.map((member) => {
      const isOwner = member.role === "owner";
      const assignedRoleKey = member.roleAssignments[0]?.role.key as keyof typeof ROLE_PRESETS | undefined;
      const basePermissions = isOwner
        ? ROLE_PRESETS.OWNER
        : assignedRoleKey
          ? ROLE_PRESETS[assignedRoleKey] || []
          : [];
      const effectivePermissions = isOwner
        ? ROLE_PRESETS.OWNER
        : applyPermissionOverrides(basePermissions, member.permissionOverrides);
      return { ...member, effectivePermissions };
    });
    return NextResponse.json({
      success: true,
      roles: Object.entries(ROLE_DESCRIPTIONS).map(([key, value]) => ({ key, ...value, permissions: ROLE_PRESETS[key as keyof typeof ROLE_PRESETS] })),
      permissionGroups: PERMISSION_GROUPS,
      members: membersWithEffectivePermissions,
    });
  },
});

export const PATCH = createApiHandler({
  requireAuth: true,
  requirePermissions: ["org.members.update_role"],
  bodySchema: memberUpdateSchema,
  handler: async (_req, { body, organizationId, userId }) => {
    const member = await db.member.findFirst({ where: { id: body.memberId, organizationId: organizationId! } });
    if (!member) return NextResponse.json({ success: false, error: "Workspace member not found" }, { status: 404 });

    if (body.phone !== undefined) {
      let phone: string | null;
      try {
        phone = normalizeWhatsAppPhone(body.phone);
      } catch (error) {
        return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "Enter a valid WhatsApp number." }, { status: 400 });
      }
      await db.user.update({ where: { id: member.userId }, data: { phone } });
    }

    // Self-action guards
    if (member.userId === userId) {
      if (body.status === "suspended") {
        return NextResponse.json({ success: false, error: "You cannot suspend your own account" }, { status: 400 });
      }
      if (body.roleKey) {
        return NextResponse.json({ success: false, error: "Administrators cannot reassign their own role" }, { status: 400 });
      }
    }

    // Owner protection guards
    if (member.role === "owner") {
      if (body.status === "suspended") {
        return NextResponse.json({ success: false, error: "The workspace owner cannot be suspended" }, { status: 400 });
      }
      if (body.roleKey) {
        return NextResponse.json({ success: false, error: "The workspace owner cannot be reassigned" }, { status: 400 });
      }
    }

    if (body.status) {
      await db.member.update({
        where: { id: member.id },
        data: {
          status: body.status,
          deactivatedAt: body.status === "suspended" ? new Date() : null,
          deactivatedById: body.status === "suspended" ? userId : null,
        },
      });
    }

    const roleKey = body.roleKey;
    if (roleKey === "NONE") {
      await db.memberRoleAssignment.deleteMany({ where: { memberId: member.id } });
      await db.memberPermissionOverride.deleteMany({ where: { memberId: member.id } });
      smartCache.invalidateTag(organizationId!, "organization-members", "/dashboard/settings");
      smartCache.invalidateTag(organizationId!, "dashboard-access", "/dashboard");
      return NextResponse.json({ success: true });
    }
    if (roleKey) {
      const roleInfo = ROLE_DESCRIPTIONS[roleKey as keyof typeof ROLE_DESCRIPTIONS];
      const role = await db.organizationRole.upsert({
        where: { organizationId_key: { organizationId: organizationId!, key: roleKey } },
        create: { organizationId: organizationId!, key: roleKey, displayName: roleInfo.displayName, description: roleInfo.description, isSystem: true },
        update: {},
      });
      await db.memberRoleAssignment.deleteMany({ where: { memberId: member.id } });
      await db.memberRoleAssignment.create({ data: { memberId: member.id, roleId: role.id, assignedById: userId } });
      await db.member.update({ where: { id: member.id }, data: { lastRoleChangedAt: new Date() } });
      if (body.permissions === undefined) {
        await db.memberPermissionOverride.deleteMany({ where: { memberId: member.id } });
      }
    }

    if (body.permissions) {
      if (member.role === "owner") {
        return NextResponse.json({ success: false, error: "The workspace owner always has full permissions." }, { status: 400 });
      }
      const nextRoleKey = roleKey === "NONE" ? undefined : roleKey || member.roleAssignments[0]?.role.key;
      const basePermissions = nextRoleKey && nextRoleKey in ROLE_PRESETS
        ? ROLE_PRESETS[nextRoleKey as keyof typeof ROLE_PRESETS]
        : [];
      const overrides = permissionOverridesForSelection(basePermissions, body.permissions as Permission[]);
      await db.memberPermissionOverride.deleteMany({ where: { memberId: member.id } });
      if (overrides.length > 0) {
        await db.memberPermissionOverride.createMany({ data: overrides.map((override) => ({ memberId: member.id, permission: override.permission, effect: override.effect, assignedById: userId })) });
      }
    }

    smartCache.invalidateTag(organizationId!, "organization-members", "/dashboard/settings");
    smartCache.invalidateTag(organizationId!, "dashboard-access", "/dashboard");

    return NextResponse.json({ success: true });
  },
});

export const DELETE = createApiHandler({
  requireAuth: true,
  requirePermissions: ["org.members.update_role"],
  bodySchema: memberDeleteSchema,
  handler: async (req, { body, organizationId, userId }) => {
    const memberId = body?.memberId || req.nextUrl.searchParams.get("memberId");
    if (!memberId) {
      return NextResponse.json({ success: false, error: "Member ID is required" }, { status: 400 });
    }

    const member = await db.member.findFirst({
      where: { id: memberId, organizationId: organizationId! },
    });

    if (!member) {
      return NextResponse.json({ success: false, error: "Workspace member not found" }, { status: 404 });
    }

    if (member.userId === userId) {
      return NextResponse.json({ success: false, error: "You cannot remove yourself from the workspace" }, { status: 400 });
    }

    if (member.role === "owner") {
      return NextResponse.json({ success: false, error: "The workspace owner cannot be removed" }, { status: 400 });
    }

    await db.$transaction(async (tx) => {
      await tx.memberRoleAssignment.deleteMany({ where: { memberId: member.id } });
      await tx.memberPermissionOverride.deleteMany({ where: { memberId: member.id } });
      await tx.member.delete({ where: { id: member.id } });

      await tx.session.updateMany({
        where: { userId: member.userId, activeOrganizationId: organizationId },
        data: { activeOrganizationId: null, organizationId: null },
      });
    });

    return NextResponse.json({ success: true, message: "Member removed from workspace" });
  },
});
