import { db } from "./db";

export async function markPastDueSubscriptions(now = new Date()): Promise<number> {
  const result = await db.subscription.updateMany({
    where: { status: "active", currentPeriodEnd: { lt: now } },
    data: { status: "past_due" },
  });
  return result.count;
}

export async function cancelSubscription(subscriptionId: string, canceledAt = new Date()): Promise<boolean> {
  const result = await db.subscription.updateMany({
    where: { id: subscriptionId, status: { in: ["active", "past_due"] } },
    data: { status: "canceled", canceledAt },
  });
  return result.count > 0;
}
