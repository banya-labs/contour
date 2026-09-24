import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getPlatformActor } from "@/lib/control-plane";
import { canPlatformRole } from "@/lib/platform-authorization";
import { toAuthHeaders } from "@/lib/auth-headers";
import { periodStart } from "@/lib/admin-control-plane/periods";
import { z } from "zod";

const querySchema = z.object({ period: z.enum(["today", "this_week", "this_month", "this_year"]).default("this_month") });

export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: toAuthHeaders(request.headers) });
  const actor = session?.user ? await getPlatformActor(session.user.id, session.user.email) : null;
  if (!actor || !canPlatformRole(actor.role, "billing.read")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const parsed = querySchema.safeParse({ period: request.nextUrl.searchParams.get("period") || "this_month" });
  if (!parsed.success) return NextResponse.json({ error: "Invalid reporting period" }, { status: 400 });
  const [organizations, payments, catalog] = await Promise.all([
    db.organization.findMany({ select: { subscriptionTier: true, subscriptionStatus: true } }),
    db.payment.findMany({ where: { status: "SUCCESS" }, select: { planId: true, amount: true, currency: true, billingCycle: true, completedAt: true } }),
    db.subscriptionTier.findMany({ where: { active: true }, orderBy: { key: "asc" } }),
  ]);
  const tiers = catalog.map((plan) => {
    const subscribers = organizations.filter((organization) => organization.subscriptionTier.toLowerCase() === plan.id);
    const collected = payments.filter((payment) => payment.planId.toLowerCase() === plan.id).reduce((total, payment) => total + Number(payment.amount), 0);
    const activeSubscribers = subscribers.filter((item) => item.subscriptionStatus === "active").length;
    return { id: plan.id, key: plan.key, name: plan.name, description: plan.description, monthlyZmw: Number(plan.monthlyZmw), annualZmw: Number(plan.annualZmw), monthlyUsd: Number(plan.monthlyUsd), annualUsd: Number(plan.annualUsd), active: plan.active, subscriberCount: subscribers.length, activeCount: activeSubscribers, trialCount: subscribers.filter((item) => item.subscriptionStatus === "trialing").length, pastDueCount: subscribers.filter((item) => item.subscriptionStatus === "past_due").length, grossCollected: collected, mrrZmw: activeSubscribers * Number(plan.monthlyZmw), mrrUsd: activeSubscribers * Number(plan.monthlyUsd), arrZmw: activeSubscribers * Number(plan.annualZmw), arrUsd: activeSubscribers * Number(plan.annualUsd) };
  });
  const periodPayments = payments.filter((payment) => payment.completedAt && payment.completedAt >= periodStart(parsed.data.period));
  return NextResponse.json({ success: true, period: parsed.data.period, tiers, totals: { subscribers: organizations.length, activeSubscribers: organizations.filter((organization) => organization.subscriptionStatus === "active").length, trialing: organizations.filter((organization) => organization.subscriptionStatus === "trialing").length, grossCollected: periodPayments.reduce((total, payment) => total + Number(payment.amount), 0), mrrZmw: tiers.reduce((total, tier) => total + tier.mrrZmw, 0), mrrUsd: tiers.reduce((total, tier) => total + tier.mrrUsd, 0), arrZmw: tiers.reduce((total, tier) => total + tier.arrZmw, 0), arrUsd: tiers.reduce((total, tier) => total + tier.arrUsd, 0) } });
}
