import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getPlatformActor } from "@/lib/control-plane";
import { canPlatformRole } from "@/lib/platform-authorization";
import { canMutateThroughSupportAccess } from "@/lib/support-access";
import { CONTOUR_ROLE_KEYS, ROLE_DESCRIPTIONS } from "@/lib/authorization";

const agencyRoleKeys = CONTOUR_ROLE_KEYS.filter((key) => key !== "OWNER") as [string, ...string[]];
const updateSchema = z.object({ memberId: z.string().min(1), status: z.enum(["active", "suspended"]).optional(), roleKey: z.enum(agencyRoleKeys as ["BROKER_MANAGER", ...string[]]).optional(), reason: z.string().trim().min(20).max(500) }).refine((value) => Boolean(value.status || value.roleKey), { message: "status or roleKey is required" });

async function getActor(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  const actor = session?.user ? await getPlatformActor(session.user.id, session.user.email) : null;
  return { actor, session };
}

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { actor } = await getActor(request);
  if (!actor || !canPlatformRole(actor.role, "support.impersonate")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await context.params;
  const access = await db.supportAccessSession.findUnique({ where: { id }, select: { organizationId: true, startedByUserId: true, mode: true, expiresAt: true, revokedAt: true } });
  if (!access || access.startedByUserId !== actor.userId || access.mode !== "ACT_AS" || access.revokedAt || access.expiresAt <= new Date()) return NextResponse.json({ error: "Active ACT_AS support session required" }, { status: 403 });
  const members = await db.member.findMany({ where: { organizationId: access.organizationId }, select: { id: true, role: true, status: true, createdAt: true, user: { select: { id: true, name: true, email: true, phone: true } } }, orderBy: { createdAt: "asc" } });
  return NextResponse.json({ success: true, members });
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { actor } = await getActor(request);
  if (!actor || !canPlatformRole(actor.role, "support.act_as")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await context.params;
  const access = await db.supportAccessSession.findUnique({ where: { id }, select: { organizationId: true, startedByUserId: true, mode: true, expiresAt: true, revokedAt: true } });
  if (!access || !canMutateThroughSupportAccess(access, actor.userId)) return NextResponse.json({ error: "Active ACT_AS support session required" }, { status: 403 });
  const parsed = updateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid member update", details: parsed.error.flatten() }, { status: 400 });
  const member = await db.member.findFirst({ where: { id: parsed.data.memberId, organizationId: access.organizationId }, select: { id: true, userId: true, role: true } });
  if (!member) return NextResponse.json({ error: "Agency member not found" }, { status: 404 });
  if (member.role === "owner") return NextResponse.json({ error: "The agency owner cannot be suspended through support access." }, { status: 400 });
  let roleAssignment = null;
  if (parsed.data.roleKey) {
    const roleInfo = ROLE_DESCRIPTIONS[parsed.data.roleKey as keyof typeof ROLE_DESCRIPTIONS];
    if (!roleInfo) return NextResponse.json({ error: "Unsupported agency role" }, { status: 400 });
    roleAssignment = await db.$transaction(async (tx) => {
      const role = await tx.organizationRole.upsert({ where: { organizationId_key: { organizationId: access.organizationId, key: parsed.data.roleKey! } }, create: { organizationId: access.organizationId, key: parsed.data.roleKey!, displayName: roleInfo.displayName, description: roleInfo.description, isSystem: true }, update: {} });
      await tx.memberRoleAssignment.deleteMany({ where: { memberId: member.id } });
      await tx.memberPermissionOverride.deleteMany({ where: { memberId: member.id } });
      return tx.memberRoleAssignment.create({ data: { memberId: member.id, roleId: role.id, assignedById: actor.userId }, select: { id: true, role: { select: { key: true, displayName: true } } } });
    });
  }
  const updated = await db.member.update({ where: { id: member.id }, data: { ...(parsed.data.status ? { status: parsed.data.status, deactivatedAt: parsed.data.status === "suspended" ? new Date() : null, deactivatedById: parsed.data.status === "suspended" ? actor.userId : null } : {}) }, select: { id: true, status: true, deactivatedAt: true } });
  await db.auditLog.create({ data: { organizationId: access.organizationId, userId: actor.userId, action: "PLATFORM_SUPPORT_MEMBER_UPDATED", entityType: "Member", entityId: member.id, details: { supportAccessSessionId: id, status: parsed.data.status, roleKey: parsed.data.roleKey, reason: parsed.data.reason } } });
  await db.platformAuditEvent.create({ data: { actorStaffId: actor.staffId, actorUserId: actor.userId, targetType: "Member", targetId: member.id, capability: parsed.data.roleKey ? "support.act_as.member.role.update" : "support.act_as.member.status.update", reason: parsed.data.reason, details: { supportAccessSessionId: id, organizationId: access.organizationId, status: parsed.data.status, roleKey: parsed.data.roleKey } } });
  return NextResponse.json({ success: true, member: updated, roleAssignment });
}
