import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { toAuthHeaders } from "@/lib/auth-headers";
import { db } from "@/lib/db";
import { getPlatformActor } from "@/lib/control-plane";
import { canPlatformRole } from "@/lib/platform-authorization";
import { isSupportAccessActive } from "@/lib/support-access";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (request.cookies.get("contour_impersonation")?.value) return NextResponse.json({ error: "Nested impersonation is not permitted." }, { status: 403 });
  const session = await auth.api.getSession({ headers: toAuthHeaders(request.headers) });
  const actor = session?.user ? await getPlatformActor(session.user.id, session.user.email) : null;
  if (!actor || actor.role !== "OWNER" || !canPlatformRole(actor.role, "support.act_as")) return NextResponse.json({ error: "Only platform owners can impersonate an agency." }, { status: 403 });
  const { id } = await params;
  const access = await db.supportAccessSession.findUnique({ where: { id }, select: { id: true, organizationId: true, startedByUserId: true, mode: true, expiresAt: true, revokedAt: true } });
  if (!access || access.mode !== "ACT_AS" || !isSupportAccessActive(access, actor.userId)) return NextResponse.json({ error: "This impersonation session is expired or revoked." }, { status: 403 });
  const response = NextResponse.redirect(new URL("/dashboard", request.url));
  response.cookies.set("contour_impersonation", access.id, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", expires: access.expiresAt });
  return response;
}
