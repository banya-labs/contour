import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getPlatformActor } from "@/lib/control-plane";
import { canPlatformRole } from "@/lib/platform-authorization";
import { toAuthHeaders } from "@/lib/auth-headers";

const schema = z.object({
  type: z.enum(["TRIAL", "STARTER", "GROWTH", "ENTERPRISE", "LIFETIME", "PERCENTAGE_DISCOUNT", "AMOUNT_DISCOUNT"]),
  trialEndsAt: z.coerce.date().optional(),
  discountValue: z.number().positive().optional(),
  reason: z.string().trim().min(20).max(500),
}).superRefine((value, context) => {
  if (value.type === "TRIAL" && !value.trialEndsAt) context.addIssue({ code: "custom", path: ["trialEndsAt"], message: "Trial end date is required." });
  if (["PERCENTAGE_DISCOUNT", "AMOUNT_DISCOUNT"].includes(value.type) && value.discountValue === undefined) context.addIssue({ code: "custom", path: ["discountValue"], message: "Discount value is required." });
  if (value.type === "PERCENTAGE_DISCOUNT" && value.discountValue !== undefined && value.discountValue > 100) context.addIssue({ code: "custom", path: ["discountValue"], message: "Percentage discount cannot exceed 100." });
});

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: toAuthHeaders(request.headers) });
  const actor = session?.user ? await getPlatformActor(session.user.id, session.user.email) : null;
  if (!actor || !canPlatformRole(actor.role, "billing.adjust")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid subscription change", details: parsed.error.flatten() }, { status: 400 });
  const organization = await db.organization.findUnique({ where: { id }, select: { id: true, name: true, currency: true, subscriptionTier: true, subscriptionStatus: true, trialEndsAt: true } });
  if (!organization) return NextResponse.json({ error: "Agency not found" }, { status: 404 });
  const input = parsed.data;
  const isTrial = input.type === "TRIAL";
  const isLifetime = input.type === "LIFETIME";
  const isDiscount = input.type === "PERCENTAGE_DISCOUNT" || input.type === "AMOUNT_DISCOUNT";
  const updated = await db.organization.update({ where: { id }, data: { subscriptionTier: isLifetime || isDiscount || isTrial ? (isLifetime ? "LIFETIME" : organization.subscriptionTier) : input.type, subscriptionStatus: isTrial ? "trialing" : "active", trialEndsAt: isTrial ? input.trialEndsAt : null }, select: { subscriptionTier: true, subscriptionStatus: true, trialEndsAt: true, currency: true } });
  let offerId: string | null = null;
  if (isDiscount) {
    const offer = await db.platformOffer.create({ data: { name: `${organization.name} ${input.type === "PERCENTAGE_DISCOUNT" ? "percentage" : "amount"} discount`, code: `AGENCY_${organization.id}_${Date.now()}`.slice(0, 40), kind: input.type === "PERCENTAGE_DISCOUNT" ? "PERCENTAGE" : "FIXED_AMOUNT", value: input.discountValue!, currency: input.type === "AMOUNT_DISCOUNT" ? organization.currency : null, status: "ACTIVE" } });
    offerId = offer.id;
    await db.organizationOffer.create({ data: { organizationId: organization.id, offerId: offer.id, grantedByUserId: actor.userId, reason: input.reason } });
  }
  await db.platformAuditEvent.create({ data: { actorStaffId: actor.staffId, actorUserId: actor.userId, targetType: "Organization", targetId: id, capability: "billing.subscription.adjust", reason: input.reason, details: { type: input.type, discountValue: input.discountValue, currency: organization.currency, offerId, previous: { subscriptionTier: organization.subscriptionTier, subscriptionStatus: organization.subscriptionStatus, trialEndsAt: organization.trialEndsAt }, updated } } });
  return NextResponse.json({ success: true, subscription: updated, offerId });
}
