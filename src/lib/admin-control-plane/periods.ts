export const ADMIN_PERIODS = ["today", "this_week", "this_month", "this_year"] as const;
export type AdminPeriod = (typeof ADMIN_PERIODS)[number];

export function periodStart(period: AdminPeriod, now = new Date()): Date {
  const start = new Date(now);
  if (period === "today") start.setHours(0, 0, 0, 0);
  if (period === "this_week") {
    const day = start.getDay();
    start.setDate(start.getDate() - (day === 0 ? 6 : day - 1));
    start.setHours(0, 0, 0, 0);
  }
  if (period === "this_month") { start.setDate(1); start.setHours(0, 0, 0, 0); }
  if (period === "this_year") { start.setMonth(0, 1); start.setHours(0, 0, 0, 0); }
  return start;
}
