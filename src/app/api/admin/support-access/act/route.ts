import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getPlatformActor } from "@/lib/control-plane";
import { canPlatformRole } from "@/lib/platform-authorization";

const schema = z.object({
  organizationId: z.string().min(1),
  reason: z.string().trim().min(20).max(500),
  confirmation: z.literal("ACT AS AGENCY"),
  durationMinutes: z.number().int().min(5).max(15).default(15),
});

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  const actor = session?.user ? await getPlatformActor(session.user.id, session.user.email) : null;
  if (!actor || actor.role !== "OWNER" || !canPlatformRole(actor.role, "support.act_as")) {
    return NextResponse.json({ error: "Only platform owners can request act-as sessions." }, { status: 403 });
  }
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Typed confirmation, reason, and duration are required.", details: parsed.error.flatten() }, { status: 400 });
  const organization = await db.organization.findUnique({ where: { id: parsed.data.organizationId }, select: { id: true, name: true, slug: true } });
  if (!organization) return NextResponse.json({ error: "Agency not found" }, { status: 404 });
  const expiresAt = new Date(Date.now() + parsed.data.durationMinutes * 60_000);
  const access = await db.supportAccessSession.create({ data: { organizationId: organization.id, startedByUserId: actor.userId, reason: parsed.data.reason, mode: "ACT_AS", expiresAt } });
  await db.platformAuditEvent.create({ data: { actorStaffId: actor.staffId, actorUserId: actor.userId, targetType: "Organization", targetId: organization.id, capability: "support.act_as.requested", reason: parsed.data.reason, details: { accessSessionId: access.id, mode: "ACT_AS", expiresAt, confirmation: "ACT AS AGENCY" } } });
  return NextResponse.json({ success: true, access: { id: access.id, organization, mode: access.mode, expiresAt: access.expiresAt, warning: "Mutation routing is not enabled for this session yet." } });
}
