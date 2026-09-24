import { db } from "./db";

/** Persist an expiry transition exactly once; guards still enforce access dynamically. */
export async function expireDueTrial(organizationId: string, now = new Date()): Promise<boolean> {
  const result = await db.organization.updateMany({
    where: { id: organizationId, subscriptionStatus: "trialing", trialEndsAt: { lte: now } },
    data: { subscriptionStatus: "trial_expired" },
  });
  return result.count > 0;
}
