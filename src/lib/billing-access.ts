export const TRIAL_DURATION_DAYS = 14;

export type BillingAccessState = "PAID" | "TRIAL_ACTIVE" | "TRIAL_EXPIRED";

export type BillingAccessInput = {
  subscriptionStatus: string | null | undefined;
  trialEndsAt: Date | null | undefined;
  /** Historical payment presence is not entitlement evidence. */
  hasSuccessfulPayment?: boolean;
  currentPeriodEnd?: Date | null;
  currentPeriodStart?: Date | null;
};

export function getTrialEnd(startedAt: Date): Date {
  const trialEndsAt = new Date(startedAt);
  trialEndsAt.setDate(trialEndsAt.getDate() + TRIAL_DURATION_DAYS);
  return trialEndsAt;
}

export function isTrialActive(trialEndsAt: Date | null | undefined, now = new Date()): boolean {
  return Boolean(trialEndsAt && trialEndsAt.getTime() > now.getTime());
}

export function hasPaidSubscription(
  subscriptionStatus: string | null | undefined,
  _hasSuccessfulPayment = false,
  currentPeriodEnd?: Date | null,
  now = new Date(),
  currentPeriodStart?: Date | null,
): boolean {
  const status = subscriptionStatus?.toLowerCase();
  if (status !== "active" && status !== "canceled" && status !== "cancelled") return false;
  if (!currentPeriodEnd || !Number.isFinite(currentPeriodEnd.getTime()) || currentPeriodEnd <= now) return false;
  return !currentPeriodStart || (Number.isFinite(currentPeriodStart.getTime()) && currentPeriodStart <= now);
}

export function getBillingAccessState(input: BillingAccessInput, now = new Date()): BillingAccessState {
  if (hasPaidSubscription(input.subscriptionStatus, false, input.currentPeriodEnd, now, input.currentPeriodStart)) return "PAID";
  // Paid, overdue, canceled, and otherwise restricted accounts cannot fall
  // back into a trial after losing their funded service period.
  const status = input.subscriptionStatus?.toLowerCase();
  const mayUseTrial = !status || status === "trialing";
  return mayUseTrial && isTrialActive(input.trialEndsAt, now) ? "TRIAL_ACTIVE" : "TRIAL_EXPIRED";
}
