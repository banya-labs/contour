import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getPlatformActor } from "@/lib/control-plane";
import { canPlatformRole } from "@/lib/platform-authorization";
import { toAuthHeaders } from "@/lib/auth-headers";
import { supportAccessDuration, type SupportAccessMode } from "@/lib/support-access";

const schema = z.object({ organizationId: z.string().min(1), reason: z.string().trim().min(8).max(500), mode: z.enum(["VIEW_ONLY", "ACT_AS"]).default("VIEW_ONLY"), durationMinutes: z.number().int().min(5).max(60).default(30) }).refine((value) => value.mode !== "ACT_AS" || value.reason.length >= 20, { path: ["reason"], message: "Act-as sessions require a reason of at least 20 characters." });

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: toAuthHeaders(request.headers) });
  const actor = session?.user ? await getPlatformActor(session.user.id, session.user.email) : null;
  if (!actor || !canPlatformRole(actor.role, "support.impersonate")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request", details: parsed.error.flatten() }, { status: 400 });
  const organization = await db.organization.findUnique({ where: { id: parsed.data.organizationId }, select: { id: true, name: true, slug: true } });
  if (!organization) return NextResponse.json({ error: "Agency not found" }, { status: 404 });
  if (parsed.data.mode === "ACT_AS" && (!canPlatformRole(actor.role, "support.act_as") || actor.role !== "OWNER")) return NextResponse.json({ error: "Only platform owners can act as an agency." }, { status: 403 });
  const mode = parsed.data.mode as SupportAccessMode;
  const durationMinutes = supportAccessDuration(mode, parsed.data.durationMinutes);
  const expiresAt = new Date(Date.now() + durationMinutes * 60_000);
  const access = await db.supportAccessSession.create({ data: { organizationId: organization.id, startedByUserId: actor.userId, reason: parsed.data.reason, mode, expiresAt } });
  await db.platformAuditEvent.create({ data: { actorStaffId: actor.staffId, actorUserId: actor.userId, targetType: "Organization", targetId: organization.id, capability: mode === "ACT_AS" ? "support.act_as.requested" : "support.impersonate", reason: parsed.data.reason, details: { accessSessionId: access.id, mode, expiresAt, durationMinutes } } });
  const response = NextResponse.json({ success: true, access: { id: access.id, organization, mode: access.mode, expiresAt: access.expiresAt, redirectPath: "/dashboard" } });
  response.cookies.set("contour_support_access", access.id, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", expires: access.expiresAt });
  return response;
}
