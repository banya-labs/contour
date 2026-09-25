import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getPlatformActor } from "@/lib/control-plane";
import { canPlatformRole } from "@/lib/platform-authorization";
import { toAuthHeaders } from "@/lib/auth-headers";

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: toAuthHeaders(request.headers) });
  const actor = session?.user ? await getPlatformActor(session.user.id, session.user.email) : null;
  if (!actor || !canPlatformRole(actor.role, "support.impersonate")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await context.params;
  const access = await db.supportAccessSession.findUnique({ where: { id }, include: { organization: { select: { id: true, name: true, slug: true, subscriptionTier: true, subscriptionStatus: true, _count: { select: { members: true, properties: true, inquiries: true } } } } } });
  if (!access || access.startedByUserId !== actor.userId || access.revokedAt || access.expiresAt <= new Date()) return NextResponse.json({ error: "Support access session is expired or revoked" }, { status: 410 });
  return NextResponse.json({ success: true, mode: access.mode, expiresAt: access.expiresAt, organization: access.organization });
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: toAuthHeaders(request.headers) });
  const actor = session?.user ? await getPlatformActor(session.user.id, session.user.email) : null;
  if (!actor || !canPlatformRole(actor.role, "support.impersonate")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await context.params;
  const access = await db.supportAccessSession.findUnique({ where: { id }, select: { id: true, organizationId: true, startedByUserId: true } });
  if (!access || access.startedByUserId !== actor.userId) return NextResponse.json({ error: "Support access session not found" }, { status: 404 });
  await db.supportAccessSession.update({ where: { id }, data: { revokedAt: new Date() } });
  await db.platformAuditEvent.create({ data: { actorStaffId: actor.staffId, actorUserId: actor.userId, targetType: "Organization", targetId: access.organizationId, capability: "support.impersonate.revoke", reason: "Support access ended by operator", details: { accessSessionId: id } } });
  const response = NextResponse.json({ success: true });
  response.cookies.set("contour_support_access", "", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 0 });
  return response;
}
