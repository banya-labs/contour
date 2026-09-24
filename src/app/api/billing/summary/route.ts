import { NextResponse } from "next/server";
import { createApiHandler } from "@/lib/api-handler";
import { getTrialEnd, hasPaidSubscription, isTrialActive } from "@/lib/billing-access";
import { expireDueTrial } from "@/lib/billing-lifecycle";
import { db } from "@/lib/db";
import { CONTOUR_PLANS, type BillingCycle, type SupportedCurrency } from "@/lib/lenco";
import { getCatalogPlanName, getCatalogPlanPrice } from "@/lib/subscriptions/tier-catalog";

function addMonths(date: Date, months: number): Date {
  const next = new Date(date);
  next.setMonth(next.getMonth() + months);
  return next;
}

export const GET = createApiHandler({
  requireAuth: true,
  requirePermissions: ["org.billing.read"],
  handler: async (_req, { organizationId }) => {
    await expireDueTrial(organizationId!);
    const organization = await db.organization.findUnique({
      where: { id: organizationId! },
      select: {
        id: true,
        name: true,
        currency: true,
        subscriptionTier: true,
        subscriptionStatus: true,
        lencoSubscriptionId: true,
        createdAt: true,
        trialEndsAt: true,
      },
    });

    if (!organization) return NextResponse.json({ success: false, error: "Workspace not found" }, { status: 404 });

    const payments = await db.payment.findMany({
      where: { organizationId: organization.id },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        reference: true,
        planId: true,
        billingCycle: true,
        amount: true,
        currency: true,
        status: true,
        failureReason: true,
        completedAt: true,
        createdAt: true,
        provider: true,
      },
    });

    const successfulPayment = payments.find((payment) => payment.status === "SUCCESS");
    const trialEndsAt = organization.trialEndsAt || getTrialEnd(organization.createdAt);
    const paidSubscription = hasPaidSubscription(organization.subscriptionStatus, Boolean(successfulPayment) || Boolean(organization.lencoSubscriptionId));
    const trialActive = !paidSubscription && isTrialActive(trialEndsAt);
    const currentPlanId = paidSubscription
      ? (organization.subscriptionTier || "STARTER").toLowerCase() as keyof typeof CONTOUR_PLANS
      : null;
    const currentPlan = currentPlanId ? CONTOUR_PLANS[currentPlanId] || CONTOUR_PLANS.starter : null;
    const currentPlanName = currentPlanId ? await getCatalogPlanName(currentPlanId) : "14-day free trial";
    const lastPayment = successfulPayment
      ? { ...successfulPayment, amount: Number(successfulPayment.amount) }
      : null;
    const cycle = successfulPayment?.billingCycle === "ANNUAL" ? "ANNUAL" : "MONTHLY" as BillingCycle;
    const nextPaymentAt = paidSubscription && successfulPayment?.completedAt
      ? addMonths(successfulPayment.completedAt, cycle === "ANNUAL" ? 12 : 1)
      : null;
    const currency = (successfulPayment?.currency || organization.currency || "ZMW") as SupportedCurrency;

    return NextResponse.json({
      success: true,
      workspace: { id: organization.id, name: organization.name },
      subscription: {
        planId: currentPlan?.id || null,
          planName: currentPlanName,
        status: paidSubscription ? organization.subscriptionStatus || "active" : trialActive ? "trialing" : "expired",
        trialEndsAt,
        nextPaymentAt,
        nextPayment: nextPaymentAt
          ? { ...await getCatalogPlanPrice(currentPlan?.id || "starter", cycle, currency), currency, cycle }
          : null,
        lastPayment,
      },
      payments: payments.map((payment) => ({ ...payment, amount: Number(payment.amount) })),
    });
  },
});
