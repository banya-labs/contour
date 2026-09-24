import { db } from "./db";
import { getNextBillingPeriod, type BillingCycle } from "./billing-periods";

export async function recordSettledSubscription(input: {
  organizationId: string;
  paymentId: string;
  reference: string;
  planId: string;
  billingCycle: BillingCycle;
  amount: number;
  currency: "ZMW" | "USD";
  settledAt?: Date;
}): Promise<void> {
  const settledAt = input.settledAt || new Date();
  const period = getNextBillingPeriod(settledAt, input.billingCycle);
  const subscription = await db.subscription.upsert({
    where: { organizationId_status: { organizationId: input.organizationId, status: "active" } },
    create: {
      organizationId: input.organizationId,
      planId: input.planId,
      billingCycle: input.billingCycle,
      status: "active",
      providerReference: input.reference,
      currentPeriodStart: period.start,
      currentPeriodEnd: period.end,
    },
    update: {
      planId: input.planId,
      billingCycle: input.billingCycle,
      providerReference: input.reference,
      currentPeriodStart: period.start,
      currentPeriodEnd: period.end,
      canceledAt: null,
    },
  });
  await db.invoice.upsert({
    where: { number: `INV-${input.reference}` },
    create: {
      organizationId: input.organizationId,
      subscriptionId: subscription.id,
      paymentId: input.paymentId,
      number: `INV-${input.reference}`,
      status: "PAID",
      planId: input.planId,
      billingCycle: input.billingCycle,
      amount: input.amount,
      currency: input.currency,
      periodStart: period.start,
      periodEnd: period.end,
      dueAt: settledAt,
      paidAt: settledAt,
    },
    update: { status: "PAID", paymentId: input.paymentId, paidAt: settledAt },
  });
}
