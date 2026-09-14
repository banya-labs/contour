export const TRIAL_DURATION_DAYS = 14;

export function getTrialEnd(startedAt: Date): Date {
  const trialEndsAt = new Date(startedAt);
  trialEndsAt.setDate(trialEndsAt.getDate() + TRIAL_DURATION_DAYS);
  return trialEndsAt;
}

export function isTrialActive(trialEndsAt: Date | null | undefined, now = new Date()): boolean {
  return Boolean(trialEndsAt && trialEndsAt.getTime() > now.getTime());
}

export function hasPaidSubscription(subscriptionStatus: string | null | undefined, hasSuccessfulPayment: boolean): boolean {
  return hasSuccessfulPayment || subscriptionStatus === "active";
}
