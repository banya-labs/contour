import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getPlatformActor } from "@/lib/control-plane";
import { canPlatformRole } from "@/lib/platform-authorization";

const grantSchema = z.object({ offerId: z.string().min(1), organizationId: z.string().min(1), expiresAt: z.coerce.date().optional(), reason: z.string().trim().min(20).max(500) });

async function actorFor(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  return session?.user ? getPlatformActor(session.user.id, session.user.email) : null;
}

export async function GET(request: NextRequest) {
  const actor = await actorFor(request);
  if (!actor || !canPlatformRole(actor.role, "billing.read")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const grants = await db.organizationOffer.findMany({ include: { offer: true, organization: { select: { id: true, name: true, slug: true } } }, orderBy: { createdAt: "desc" }, take: 100 });
  return NextResponse.json({ success: true, grants });
}

export async function POST(request: NextRequest) {
  const actor = await actorFor(request);
  if (!actor || !canPlatformRole(actor.role, "billing.adjust")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const parsed = grantSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid offer grant", details: parsed.error.flatten() }, { status: 400 });
  const input = parsed.data;
  const [offer, organization] = await Promise.all([
    db.platformOffer.findUnique({ where: { id: input.offerId }, select: { id: true, code: true, status: true, endsAt: true } }),
    db.organization.findUnique({ where: { id: input.organizationId }, select: { id: true, name: true, slug: true } }),
  ]);
  if (!offer || !organization) return NextResponse.json({ error: "Offer or agency not found" }, { status: 404 });
  if (offer.status !== "ACTIVE") return NextResponse.json({ error: "Only active offers can be granted" }, { status: 400 });
  if (offer.endsAt && offer.endsAt <= new Date()) return NextResponse.json({ error: "Offer has expired" }, { status: 400 });
  const grant = await db.organizationOffer.create({ data: { offerId: offer.id, organizationId: organization.id, grantedByUserId: actor.userId, reason: input.reason, expiresAt: input.expiresAt }, include: { offer: true, organization: { select: { id: true, name: true, slug: true } } } });
  await db.platformAuditEvent.create({ data: { actorStaffId: actor.staffId, actorUserId: actor.userId, targetType: "Organization", targetId: organization.id, capability: "billing.offer.grant", reason: input.reason, details: { organizationOfferId: grant.id, offerId: offer.id, offerCode: offer.code, expiresAt: input.expiresAt } } });
  return NextResponse.json({ success: true, grant }, { status: 201 });
}
