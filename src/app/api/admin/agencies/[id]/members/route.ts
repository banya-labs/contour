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
  return NextResponse.json({ success: true, organization, members });
}
