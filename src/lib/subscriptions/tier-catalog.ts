import { db } from "@/lib/db";
import { CONTOUR_PLANS, getPlanPrice, type BillingCycle, type SupportedCurrency } from "@/lib/lenco";

export async function getCatalogPlanPrice(planId: string, cycle: BillingCycle, currency: SupportedCurrency) {
  const catalog = await db.subscriptionTier.findUnique({ where: { key: planId }, select: { monthlyZmw: true, annualZmw: true, monthlyUsd: true, annualUsd: true } });
  if (!catalog) return getPlanPrice(planId as "starter" | "growth" | "enterprise", cycle, currency);
  const amount = currency === "USD" ? Number(cycle === "ANNUAL" ? catalog.annualUsd : catalog.monthlyUsd) : currency === "ZMW" ? Number(cycle === "ANNUAL" ? catalog.annualZmw : catalog.monthlyZmw) : getPlanPrice(planId as "starter" | "growth" | "enterprise", cycle, currency).amount;
  return { amount, formatted: `${currency} ${amount.toLocaleString("en-US")}` };
}

export async function getCatalogPlanName(planId: string): Promise<string> {
  const catalog = await db.subscriptionTier.findUnique({ where: { key: planId }, select: { name: true } });
  return catalog?.name || CONTOUR_PLANS[planId]?.name || planId;
}
