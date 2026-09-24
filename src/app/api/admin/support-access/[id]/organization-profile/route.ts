import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getPlatformActor } from "@/lib/control-plane";
import { canPlatformRole } from "@/lib/platform-authorization";
import { canMutateThroughSupportAccess } from "@/lib/support-access";

const profileSchema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  country: z.enum(["ZM", "ZA", "ZW"]).optional(),
  currency: z.enum(["ZMW", "ZAR", "USD"]).optional(),
  agencyType: z.enum(["BROKERAGE", "PROPERTY_MANAGEMENT", "DEVELOPER", "LANDLORD", "MIXED"]).optional(),
  primaryOfficeAddress: z.string().trim().max(240).optional().or(z.literal("")),
  city: z.string().trim().max(80).optional().or(z.literal("")),
  primaryPhone: z.string().trim().max(32).optional().or(z.literal("")),
  primaryEmail: z.string().trim().email().max(160).optional().or(z.literal("")),
  reason: z.string().trim().min(20).max(500),
});

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: request.headers });
  const actor = session?.user ? await getPlatformActor(session.user.id, session.user.email) : null;
  if (!actor || !canPlatformRole(actor.role, "support.act_as")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await context.params;
  const access = await db.supportAccessSession.findUnique({ where: { id }, select: { id: true, organizationId: true, startedByUserId: true, mode: true, expiresAt: true, revokedAt: true } });
  if (!canMutateThroughSupportAccess(access, actor.userId)) return NextResponse.json({ error: "Active ACT_AS support session required" }, { status: 403 });
  const parsed = profileSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid profile update", details: parsed.error.flatten() }, { status: 400 });
  const { reason, ...profile } = parsed.data;
  const organization = await db.organization.update({ where: { id: access.organizationId }, data: { ...(profile.name ? { name: profile.name } : {}), ...(profile.currency ? { currency: profile.currency } : {}), profile: { upsert: { create: { country: profile.country || "ZM", agencyType: profile.agencyType || "BROKERAGE", primaryOfficeAddress: profile.primaryOfficeAddress || null, city: profile.city || null, primaryPhone: profile.primaryPhone || null, primaryEmail: profile.primaryEmail || null, onboardingStatus: "ONBOARDING_COMPLETE", onboardingStep: "COMPLETE", completedAt: new Date() }, update: { ...(profile.country ? { country: profile.country } : {}), ...(profile.agencyType ? { agencyType: profile.agencyType } : {}), ...(profile.primaryOfficeAddress !== undefined ? { primaryOfficeAddress: profile.primaryOfficeAddress || null } : {}), ...(profile.city !== undefined ? { city: profile.city || null } : {}), ...(profile.primaryPhone !== undefined ? { primaryPhone: profile.primaryPhone || null } : {}), ...(profile.primaryEmail !== undefined ? { primaryEmail: profile.primaryEmail || null } : {}) } } } }, include: { profile: true } });
  await db.auditLog.create({ data: { organizationId: access.organizationId, userId: actor.userId, action: "PLATFORM_SUPPORT_ORGANIZATION_PROFILE_UPDATED", entityType: "Organization", entityId: access.organizationId, details: { supportAccessSessionId: access.id, mode: "ACT_AS", reason } } });
  await db.platformAuditEvent.create({ data: { actorStaffId: actor.staffId, actorUserId: actor.userId, targetType: "Organization", targetId: access.organizationId, capability: "support.act_as.organization_profile.update", reason, details: { supportAccessSessionId: access.id } } });
  return NextResponse.json({ success: true, organization });
}
