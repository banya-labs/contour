import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getPlatformActor } from "@/lib/control-plane";
import { canPlatformRole } from "@/lib/platform-authorization";
import { toAuthHeaders } from "@/lib/auth-headers";

export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: toAuthHeaders(request.headers) });
  const actor = session?.user ? await getPlatformActor(session.user.id, session.user.email) : null;
  if (!actor || !canPlatformRole(actor.role, "billing.read")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const [organizations, payments, catalog] = await Promise.all([
    db.organization.findMany({ select: { subscriptionTier: true, subscriptionStatus: true } }),
    db.payment.findMany({ where: { status: "SUCCESS" }, select: { planId: true, amount: true, currency: true, billingCycle: true } }),
    db.subscriptionTier.findMany({ where: { active: true }, orderBy: { key: "asc" } }),
  ]);
  const tiers = catalog.map((plan) => {
    const subscribers = organizations.filter((organization) => organization.subscriptionTier.toLowerCase() === plan.id);
    const collected = payments.filter((payment) => payment.planId.toLowerCase() === plan.id).reduce((total, payment) => total + Number(payment.amount), 0);
    return { id: plan.id, key: plan.key, name: plan.name, description: plan.description, monthlyZmw: Number(plan.monthlyZmw), annualZmw: Number(plan.annualZmw), monthlyUsd: Number(plan.monthlyUsd), annualUsd: Number(plan.annualUsd), active: plan.active, subscriberCount: subscribers.length, activeCount: subscribers.filter((item) => item.subscriptionStatus === "active").length, trialCount: subscribers.filter((item) => item.subscriptionStatus === "trialing").length, pastDueCount: subscribers.filter((item) => item.subscriptionStatus === "past_due").length, grossCollected: collected };
  });
  return NextResponse.json({ success: true, tiers, totals: { subscribers: organizations.length, grossCollected: payments.reduce((total, payment) => total + Number(payment.amount), 0) } });
}
