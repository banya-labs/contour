import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getPlatformActor } from "@/lib/control-plane";
import { canPlatformRole } from "@/lib/platform-authorization";

const offerSchema = z.object({ name: z.string().trim().min(2).max(120), code: z.string().trim().regex(/^[A-Z0-9_-]{3,40}$/), kind: z.enum(["PERCENTAGE", "FIXED_AMOUNT"]), value: z.number().positive(), currency: z.enum(["ZMW", "ZAR", "USD"]).optional(), status: z.enum(["DRAFT", "ACTIVE", "PAUSED", "EXPIRED"]).default("DRAFT"), startsAt: z.coerce.date().optional(), endsAt: z.coerce.date().optional(), maxRedemptions: z.number().int().positive().optional(), reason: z.string().trim().min(20).max(500) });

export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  const actor = session?.user ? await getPlatformActor(session.user.id, session.user.email) : null;
  if (!actor || !canPlatformRole(actor.role, "billing.read")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const offers = await db.platformOffer.findMany({ include: { _count: { select: { grants: true } } }, orderBy: { createdAt: "desc" }, take: 100 });
  return NextResponse.json({ success: true, offers });
}

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  const actor = session?.user ? await getPlatformActor(session.user.id, session.user.email) : null;
  if (!actor || !canPlatformRole(actor.role, "billing.adjust")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const parsed = offerSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid offer", details: parsed.error.flatten() }, { status: 400 });
  const { reason, ...data } = parsed.data;
  const offer = await db.platformOffer.create({ data: { ...data, value: data.value, currency: data.currency, startsAt: data.startsAt, endsAt: data.endsAt, maxRedemptions: data.maxRedemptions } });
  await db.platformAuditEvent.create({ data: { actorStaffId: actor.staffId, actorUserId: actor.userId, targetType: "PlatformOffer", targetId: offer.id, capability: "billing.offer.create", reason, details: { code: offer.code, kind: offer.kind, value: Number(offer.value) } } });
  return NextResponse.json({ success: true, offer }, { status: 201 });
}
