import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getPlatformActor } from "@/lib/control-plane";
import { canPlatformRole } from "@/lib/platform-authorization";
import { toAuthHeaders } from "@/lib/auth-headers";

const schema = z.object({ organizationId: z.string().min(1), reason: z.string().trim().min(8).max(500), durationMinutes: z.number().int().min(5).max(60).default(30) });

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: toAuthHeaders(request.headers) });
  const actor = session?.user ? await getPlatformActor(session.user.id, session.user.email) : null;
  if (!actor || !canPlatformRole(actor.role, "support.impersonate")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request", details: parsed.error.flatten() }, { status: 400 });
  const organization = await db.organization.findUnique({ where: { id: parsed.data.organizationId }, select: { id: true, name: true, slug: true } });
  if (!organization) return NextResponse.json({ error: "Agency not found" }, { status: 404 });
  const expiresAt = new Date(Date.now() + parsed.data.durationMinutes * 60_000);
  const access = await db.supportAccessSession.create({ data: { organizationId: organization.id, startedByUserId: actor.userId, reason: parsed.data.reason, expiresAt } });
  await db.platformAuditEvent.create({ data: { actorStaffId: actor.staffId, actorUserId: actor.userId, targetType: "Organization", targetId: organization.id, capability: "support.impersonate", reason: parsed.data.reason, details: { accessSessionId: access.id, mode: "VIEW_ONLY", expiresAt } } });
  return NextResponse.json({ success: true, access: { id: access.id, organization, mode: access.mode, expiresAt: access.expiresAt } });
}
