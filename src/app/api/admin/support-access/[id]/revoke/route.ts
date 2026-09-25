import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { toAuthHeaders } from "@/lib/auth-headers";
import { db } from "@/lib/db";
import { getPlatformActor } from "@/lib/control-plane";
import { canPlatformRole } from "@/lib/platform-authorization";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: toAuthHeaders(request.headers) });
  const actor = session?.user ? await getPlatformActor(session.user.id, session.user.email) : null;
  if (!actor || !canPlatformRole(actor.role, "support.impersonate")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  const access = await db.supportAccessSession.findFirst({ where: { id, startedByUserId: actor.userId }, select: { id: true, organizationId: true, revokedAt: true } });
  if (!access) return NextResponse.json({ error: "Support session not found" }, { status: 404 });
  if (access.revokedAt) return NextResponse.json({ success: true, alreadyRevoked: true });
  const revoked = await db.supportAccessSession.update({ where: { id: access.id }, data: { revokedAt: new Date() }, select: { id: true, revokedAt: true } });
  await db.platformAuditEvent.create({ data: { actorStaffId: actor.staffId, actorUserId: actor.userId, targetType: "SupportAccessSession", targetId: access.id, capability: "support.impersonate", reason: "Operator ended support access session", details: { organizationId: access.organizationId } } });
  return NextResponse.json({ success: true, session: revoked });
}
