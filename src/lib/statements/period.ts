export const earningsPeriods = ["today", "week", "month", "all"] as const;
export type EarningsPeriod = typeof earningsPeriods[number];

function parts(date: Date, timezone: string) {
  const p = new Intl.DateTimeFormat("en-CA", { timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" }).formatToParts(date);
  const n = (type: string) => Number(p.find((item) => item.type === type)?.value);
  return { year: n("year"), month: n("month"), day: n("day"), hour: n("hour"), minute: n("minute"), second: n("second") };
}
export function organizationMidnight(year: number, month: number, day: number, timezone: string): Date {
  const wall = Date.UTC(year, month - 1, day);
  let actual = wall;
  for (let i = 0; i < 3; i++) {
    const p = parts(new Date(actual), timezone);
    actual += wall - Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  }
  return new Date(actual);
}
export function resolveEarningsPeriod(period: EarningsPeriod, timezone: string, now = new Date()) {
  const p = parts(now, timezone);
  const wall = new Date(Date.UTC(p.year, p.month - 1, p.day));
  const startWall = new Date(wall); let endWall = new Date(wall);
  if (period === "week") startWall.setUTCDate(wall.getUTCDate() - ((wall.getUTCDay() + 6) % 7));
  if (period === "month") startWall.setUTCDate(1);
  endWall = new Date(startWall);
  if (period === "month") endWall.setUTCMonth(endWall.getUTCMonth() + 1);
  else endWall.setUTCDate(endWall.getUTCDate() + (period === "week" ? 7 : 1));
  const convert = (d: Date) => organizationMidnight(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate(), timezone);
  const start = period === "all" ? undefined : convert(startWall);
  const end = period === "all" ? now : convert(endWall);
  const label = period === "all" ? "All time" : `${startWall.toISOString().slice(0, 10)} to ${new Date(endWall.getTime() - 86400000).toISOString().slice(0, 10)} (${timezone})`;
  return { start, end, label };
}
