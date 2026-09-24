export type BillingCycle = "MONTHLY" | "ANNUAL";

export function getNextBillingPeriod(start: Date, cycle: BillingCycle): { start: Date; end: Date } {
  const end = new Date(start);
  end.setMonth(end.getMonth() + (cycle === "ANNUAL" ? 12 : 1));
  return { start: new Date(start), end };
}
