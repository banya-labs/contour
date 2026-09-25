import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { toAuthHeaders } from "@/lib/auth-headers";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: toAuthHeaders(request.headers) });
  const id = request.cookies.get("contour_impersonation")?.value;
  if (!session?.user?.id || !id) return NextResponse.json({ active: false });
  const access = await db.supportAccessSession.findUnique({ where: { id }, select: { id: true, startedByUserId: true, mode: true, expiresAt: true, revokedAt: true, organization: { select: { id: true, name: true } } } });
  if (!access || access.startedByUserId !== session.user.id || access.mode !== "ACT_AS" || access.revokedAt || access.expiresAt <= new Date()) return NextResponse.json({ active: false });
  return NextResponse.json({ active: true, access: { id: access.id, agencyName: access.organization.name, expiresAt: access.expiresAt } });
}
