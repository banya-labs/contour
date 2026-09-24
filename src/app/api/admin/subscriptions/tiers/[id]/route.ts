import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getPlatformActor } from "@/lib/control-plane";
import { canPlatformRole } from "@/lib/platform-authorization";
import { toAuthHeaders } from "@/lib/auth-headers";

const schema = z.object({ monthlyZmw: z.number().nonnegative(), annualZmw: z.number().nonnegative(), monthlyUsd: z.number().nonnegative(), annualUsd: z.number().nonnegative(), reason: z.string().trim().min(20).max(500) });

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: toAuthHeaders(request.headers) }); const actor = session?.user ? await getPlatformActor(session.user.id, session.user.email) : null;
  if (!actor || !canPlatformRole(actor.role, "billing.adjust")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const parsed = schema.safeParse(await request.json().catch(() => null)); if (!parsed.success) return NextResponse.json({ error: "Invalid tier update", details: parsed.error.flatten() }, { status: 400 });
  const { id } = await params; const { reason, ...prices } = parsed.data;
  const tier = await db.subscriptionTier.update({ where: { id }, data: prices, select: { id: true, key: true, monthlyZmw: true, annualZmw: true, monthlyUsd: true, annualUsd: true } });
  await db.platformAuditEvent.create({ data: { actorStaffId: actor.staffId, actorUserId: actor.userId, targetType: "SubscriptionTier", targetId: tier.id, capability: "billing.tier.adjust", reason, details: { prices } } });
  return NextResponse.json({ success: true, tier });
}
