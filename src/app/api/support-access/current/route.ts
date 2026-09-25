import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { toAuthHeaders } from "@/lib/auth-headers";

export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: toAuthHeaders(request.headers) });
  const accessId = request.cookies.get("contour_support_access")?.value;
  if (!session?.user?.id || !accessId) return NextResponse.json({ active: false });
  const access = await db.supportAccessSession.findUnique({ where: { id: accessId }, select: { id: true, organizationId: true, startedByUserId: true, mode: true, expiresAt: true, revokedAt: true, organization: { select: { name: true, slug: true } } } });
  if (!access || access.startedByUserId !== session.user.id || access.mode !== "ACT_AS" || access.revokedAt || access.expiresAt <= new Date()) return NextResponse.json({ active: false });
  return NextResponse.json({ active: true, organization: access.organization, expiresAt: access.expiresAt });
}
