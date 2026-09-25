import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { toAuthHeaders } from "@/lib/auth-headers";
import { db } from "@/lib/db";
import { getPlatformActor } from "@/lib/control-plane";

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: toAuthHeaders(request.headers) });
  const id = request.cookies.get("contour_impersonation")?.value;
  if (session?.user?.id && id) {
    const access = await db.supportAccessSession.findFirst({ where: { id, startedByUserId: session.user.id, revokedAt: null }, select: { id: true, organizationId: true } });
    if (access) {
      await db.supportAccessSession.update({ where: { id: access.id }, data: { revokedAt: new Date() } });
      const actor = await getPlatformActor(session.user.id, session.user.email);
      if (actor) await db.platformAuditEvent.create({ data: { actorStaffId: actor.staffId, actorUserId: actor.userId, targetType: "SupportAccessSession", targetId: access.id, capability: "support.act_as.exit", reason: "Operator ended impersonation session", details: { organizationId: access.organizationId } } });
    }
  }
  const response = NextResponse.json({ success: true });
  response.cookies.delete("contour_impersonation");
  return response;
}
