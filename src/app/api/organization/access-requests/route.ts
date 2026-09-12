import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createApiHandler } from "@/lib/api-handler";
import { db } from "@/lib/db";
import { ROLE_DESCRIPTIONS, ROLE_PRESETS, CONTOUR_ROLE_KEYS } from "@/lib/authorization";

const reviewSchema = z.object({ requestId: z.string().min(1), decision: z.enum(["APPROVE", "DECLINE"]), roleKey: z.enum(CONTOUR_ROLE_KEYS.filter((key) => key !== "OWNER") as [string, ...string[]]).optional(), declineReason: z.string().trim().max(300).optional() });

export const GET = createApiHandler({
  requireAuth: true,
  requirePermissions: ["org.members.invite"],
  handler: async (_req, { organizationId }) => {
    const requests = await db.accessRequest.findMany({ where: { organizationId: organizationId!, status: "PENDING" }, orderBy: { createdAt: "asc" } });
    return NextResponse.json({ success: true, requests });
  },
});

export const PATCH = createApiHandler({
  requireAuth: true,
  requirePermissions: ["org.members.invite"],
  bodySchema: reviewSchema,
  handler: async (_req, { body, organizationId, userId }) => {
    const request = await db.accessRequest.findFirst({ where: { id: body.requestId, organizationId: organizationId!, status: "PENDING" } });
    if (!request) return NextResponse.json({ success: false, error: "Pending access request not found." }, { status: 404 });
    if (body.decision === "DECLINE") {
      await db.accessRequest.update({ where: { id: request.id }, data: { status: "DECLINED", reviewedById: userId, reviewedAt: new Date(), declineReason: body.declineReason || null } });
      return NextResponse.json({ success: true, status: "DECLINED" });
    }
    const roleKey = body.roleKey || request.roleKey;
    const roleInfo = ROLE_DESCRIPTIONS[roleKey as keyof typeof ROLE_DESCRIPTIONS];
    await db.$transaction(async (tx) => {
      const member = await tx.member.upsert({ where: { organizationId_userId: { organizationId: organizationId!, userId: request.userId } }, create: { organizationId: organizationId!, userId: request.userId, role: "member", status: "active" }, update: { status: "active", deactivatedAt: null, deactivatedById: null } });
      const role = await tx.organizationRole.upsert({ where: { organizationId_key: { organizationId: organizationId!, key: roleKey } }, create: { organizationId: organizationId!, key: roleKey, displayName: roleInfo.displayName, description: roleInfo.description, isSystem: true, permissions: { create: ROLE_PRESETS[roleKey as keyof typeof ROLE_PRESETS].map((permission) => ({ permission })) } }, update: {} });
      await tx.memberRoleAssignment.deleteMany({ where: { memberId: member.id } });
      await tx.memberRoleAssignment.create({ data: { memberId: member.id, roleId: role.id, assignedById: userId } });
      await tx.accessRequest.update({ where: { id: request.id }, data: { status: "APPROVED", roleKey, reviewedById: userId, reviewedAt: new Date() } });
    });
    return NextResponse.json({ success: true, status: "APPROVED" });
  },
});
