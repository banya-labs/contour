import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { toAuthHeaders } from "@/lib/auth-headers";
import { db } from "@/lib/db";
import { getPlatformActor } from "@/lib/control-plane";
import { canPlatformRole } from "@/lib/platform-authorization";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: toAuthHeaders(request.headers) });
  const actor = session?.user ? await getPlatformActor(session.user.id, session.user.email) : null;
  if (!actor || !canPlatformRole(actor.role, "agency.read")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  const organization = await db.organization.findUnique({ where: { id }, select: { id: true, name: true, slug: true } });
  if (!organization) return NextResponse.json({ error: "Agency not found" }, { status: 404 });
  const members = await db.member.findMany({ where: { organizationId: id }, select: { id: true, role: true, status: true, createdAt: true, deactivatedAt: true, lastRoleChangedAt: true, user: { select: { id: true, name: true, email: true, phone: true, role: true, createdAt: true } } }, orderBy: { createdAt: "asc" }, take: 100 });
  const lastSignIns = await db.auditLog.findMany({ where: { organizationId: id, action: "USER_SIGN_IN", userId: { in: members.map((member) => member.user.id) } }, select: { userId: true, createdAt: true }, orderBy: { createdAt: "desc" }, take: 500 });
  const latestByUser = new Map<string, Date>();
  for (const event of lastSignIns) if (event.userId && !latestByUser.has(event.userId)) latestByUser.set(event.userId, event.createdAt);
  return NextResponse.json({ success: true, organization, members: members.map((member) => ({ ...member, lastLoginAt: latestByUser.get(member.user.id)?.toISOString() ?? null })) });
}
