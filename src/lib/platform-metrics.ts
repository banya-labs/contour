import { db } from "@/lib/db";

export const PLATFORM_METRICS_PERIODS = ["today", "week", "month", "quarter", "year", "all"] as const;
export type PlatformMetricsPeriod = (typeof PLATFORM_METRICS_PERIODS)[number];

export function getPlatformPeriodStart(period: PlatformMetricsPeriod, now = new Date()): Date | undefined {
  if (period === "all") return undefined;
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  if (period === "week") start.setDate(start.getDate() - (start.getDay() === 0 ? 6 : start.getDay() - 1));
  if (period === "month") start.setDate(1);
  if (period === "quarter") start.setMonth(Math.floor(start.getMonth() / 3) * 3, 1);
  if (period === "year") start.setMonth(0, 1);
  return start;
}

type MoneyTotals = Record<string, number>;

export async function getPlatformMetrics(period: PlatformMetricsPeriod, now = new Date()) {
  const start = getPlatformPeriodStart(period, now);
  const dateFilter = start ? { gte: start } : undefined;
  const [organizations, members, properties, subscriptionMix, propertyValues, transactions, commissionTotals, recentAudit] = await Promise.all([
    db.organization.count(),
    db.member.count({ where: { status: "active" } }),
    db.property.count({ where: { status: { in: ["AVAILABLE", "UNDER_OFFER"] } } }),
    db.organization.groupBy({ by: ["subscriptionTier", "subscriptionStatus"], _count: { _all: true } }),
    db.property.groupBy({ by: ["currency"], where: { status: { in: ["AVAILABLE", "UNDER_OFFER"] }, askingPrice: { not: null } }, _sum: { askingPrice: true } }),
    db.transaction.count({ where: dateFilter ? { createdAt: dateFilter } : undefined }),
    db.transaction.groupBy({ by: ["currency"], where: dateFilter ? { createdAt: dateFilter } : undefined, _sum: { agencyCommissionAmount: true, agentSplitAmount: true } }),
    db.platformAuditEvent.findMany({ orderBy: { createdAt: "desc" }, take: 8, select: { id: true, targetType: true, targetId: true, capability: true, reason: true, createdAt: true } }),
  ]);

  const propertyValueByCurrency: MoneyTotals = {};
  for (const row of propertyValues) propertyValueByCurrency[row.currency] = Number(row._sum.askingPrice || 0);
  const commissionByCurrency: Record<string, { agency: number; agent: number }> = {};
  for (const row of commissionTotals) commissionByCurrency[row.currency] = { agency: Number(row._sum.agencyCommissionAmount || 0), agent: Number(row._sum.agentSplitAmount || 0) };
  return {
    period,
    counts: { organizations, activeMembers: members, listedProperties: properties, transactions },
    propertyValueByCurrency,
    commissionByCurrency,
    subscriptionMix: subscriptionMix.map((row) => ({ tier: row.subscriptionTier, status: row.subscriptionStatus, count: row._count._all })),
    recentAudit,
  };
}
