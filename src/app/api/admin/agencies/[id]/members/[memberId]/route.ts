import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getPlatformActor } from "@/lib/control-plane";
import { canPlatformRole } from "@/lib/platform-authorization";

const mutationSchema = z.object({
  action: z.enum(["suspend", "reactivate", "change_role"]),
  role: z.string().trim().min(2).max(50).optional(),
  reason: z.string().trim().min(20).max(500),
});

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string; memberId: string }> }) {
  const session = await auth.api.getSession({ headers: request.headers });
  const actor = session?.user ? await getPlatformActor(session.user.id, session.user.email) : null;
  if (!actor || !canPlatformRole(actor.role, "agency.configure")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const parsed = mutationSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success || (parsed.data.action === "change_role" && !parsed.data.role)) return NextResponse.json({ error: "Invalid member change" }, { status: 400 });
  const { id, memberId } = await params;
  const member = await db.member.findFirst({ where: { id: memberId, organizationId: id }, select: { id: true, organizationId: true, userId: true, role: true, status: true } });
  if (!member) return NextResponse.json({ error: "Member not found in this agency" }, { status: 404 });
  const nextStatus = parsed.data.action === "suspend" ? "suspended" : parsed.data.action === "reactivate" ? "active" : member.status;
  const nextRole = parsed.data.action === "change_role" ? parsed.data.role! : member.role;
  const updated = await db.member.update({ where: { id: member.id }, data: { status: nextStatus, role: nextRole, deactivatedAt: nextStatus === "active" ? null : new Date(), deactivatedById: nextStatus === "active" ? null : actor.userId, lastRoleChangedAt: nextRole !== member.role ? new Date() : undefined }, select: { id: true, role: true, status: true, deactivatedAt: true, lastRoleChangedAt: true } });
  await db.auditLog.create({ data: { organizationId: id, userId: actor.userId, action: `PLATFORM_MEMBER_${parsed.data.action.toUpperCase()}`, entityType: "Member", entityId: member.id, details: { reason: parsed.data.reason, previousRole: member.role, nextRole, previousStatus: member.status, nextStatus } } });
  return NextResponse.json({ success: true, member: updated });
}
