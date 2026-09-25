import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getPlatformActor } from "@/lib/control-plane";
import { canPlatformRole } from "@/lib/platform-authorization";
import { toAuthHeaders } from "@/lib/auth-headers";

const querySchema = z.object({
  range: z.enum(["today", "7d", "30d", "90d", "custom"]).default("30d"),
  from: z.string().date().optional(),
  to: z.string().date().optional(),
});

function dates(input: z.infer<typeof querySchema>) {
  const now = new Date();
  const to = input.range === "custom" && input.to ? new Date(`${input.to}T23:59:59.999Z`) : now;
  const from = input.range === "custom" && input.from ? new Date(`${input.from}T00:00:00.000Z`) : new Date(to);
  if (input.range !== "custom") from.setUTCDate(to.getUTCDate() - (input.range === "today" ? 0 : input.range === "7d" ? 6 : input.range === "90d" ? 89 : 29));
  if (from > to || to.getTime() - from.getTime() > 366 * 24 * 60 * 60 * 1000) throw new Error("Invalid date range");
  return { from, to };
}

function add(map: Record<string, number>, currency: string, amount: number) { map[currency] = (map[currency] || 0) + amount; }

export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: toAuthHeaders(request.headers) });
  const actor = session?.user ? await getPlatformActor(session.user.id, session.user.email) : null;
  if (!actor || !canPlatformRole(actor.role, "platform.read")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const parsed = querySchema.safeParse(Object.fromEntries(request.nextUrl.searchParams.entries()));
  if (!parsed.success) return NextResponse.json({ error: "Invalid query parameters" }, { status: 400 });
  let from: Date, to: Date;
  try { ({ from, to } = dates(parsed.data)); } catch { return NextResponse.json({ error: "Invalid date range" }, { status: 400 }); }

  const [organizations, members, properties, inquiries, transactions, payments, tiers] = await Promise.all([
    db.organization.findMany({ select: { id: true, subscriptionTier: true, subscriptionStatus: true, currency: true, createdAt: true } }),
    db.member.findMany({ where: { status: "active" }, select: { id: true, userId: true, organizationId: true, createdAt: true, user: { select: { name: true, email: true } } } }),
    db.property.findMany({ select: { id: true, organizationId: true, createdAt: true } }),
    db.inquiry.findMany({ select: { id: true, organizationId: true, assignedAgentId: true, createdAt: true } }),
    db.transaction.findMany({ where: { status: { in: ["EARNED", "PARTIALLY_RECEIVED", "RECEIVED", "AGENT_PAID_OUT"] }, closedAt: { gte: from, lte: to } }, select: { id: true, organizationId: true, closingAgentId: true, grossValue: true, currency: true, closedAt: true } }),
    db.payment.findMany({ where: { status: "SUCCESS", completedAt: { gte: from, lte: to } }, select: { amount: true, currency: true, completedAt: true } }),
    db.subscriptionTier.findMany({ where: { active: true }, select: { id: true, key: true, name: true, monthlyZmw: true, annualZmw: true, monthlyUsd: true, annualUsd: true } }),
  ]);
  const inRange = (date: Date) => date >= from && date <= to;
  const mrr: Record<string, number> = {}, arr: Record<string, number> = {}, collected: Record<string, number> = {};
  const mix = tiers.map((tier) => ({ tier: tier.key, name: tier.name, subscribers: 0, mrrByCurrency: {} as Record<string, number> }));
  for (const org of organizations) {
    if (org.subscriptionStatus !== "active") continue;
    const tier = tiers.find((item) => item.id.toLowerCase() === org.subscriptionTier.toLowerCase() || item.key.toLowerCase() === org.subscriptionTier.toLowerCase());
    if (!tier) continue;
    const currency = org.currency === "USD" ? "USD" : "ZMW";
    const monthly = Number(currency === "USD" ? tier.monthlyUsd : tier.monthlyZmw);
    add(mrr, currency, monthly); add(arr, currency, monthly * 12);
    const row = mix.find((item) => item.tier === tier.key); if (row) { row.subscribers++; add(row.mrrByCurrency, currency, monthly); }
  }
  for (const payment of payments) add(collected, payment.currency, Number(payment.amount));
  const seriesMap = new Map<string, { revenue: Record<string, number>; inquiries: number; closed: number }>();
  const day = (date: Date) => date.toISOString().slice(0, 10);
  for (const payment of payments) { const key = day(payment.completedAt || to); const row = seriesMap.get(key) || { revenue: {}, inquiries: 0, closed: 0 }; add(row.revenue, payment.currency, Number(payment.amount)); seriesMap.set(key, row); }
  for (const inquiry of inquiries.filter((item) => inRange(item.createdAt))) { const key = day(inquiry.createdAt); const row = seriesMap.get(key) || { revenue: {}, inquiries: 0, closed: 0 }; row.inquiries++; seriesMap.set(key, row); }
  for (const transaction of transactions) { const key = day(transaction.closedAt || to); const row = seriesMap.get(key) || { revenue: {}, inquiries: 0, closed: 0 }; row.closed++; seriesMap.set(key, row); }
  const team = new Map<string, { memberId: string; name: string; email: string; inquiries: number; closedProperties: number; valueByCurrency: Record<string, number> }>();
  for (const member of members) team.set(member.userId, { memberId: member.userId, name: member.user.name, email: member.user.email, inquiries: 0, closedProperties: 0, valueByCurrency: {} });
  for (const inquiry of inquiries.filter((item) => inRange(item.createdAt) && item.assignedAgentId)) { const row = team.get(inquiry.assignedAgentId!); if (row) row.inquiries++; }
  for (const transaction of transactions) { const row = team.get(transaction.closingAgentId); if (row) { row.closedProperties++; add(row.valueByCurrency, transaction.currency, Number(transaction.grossValue)); } }
  const newCount = (items: Array<{ createdAt: Date }>) => items.filter((item) => inRange(item.createdAt)).length;
  return NextResponse.json({ range: { from: from.toISOString(), to: to.toISOString(), timezone: "UTC" }, kpis: { agencies: { total: organizations.length, newInRange: newCount(organizations) }, users: { total: members.length, newInRange: newCount(members) }, properties: { total: properties.length, newInRange: newCount(properties) }, closedProperties: { total: transactions.length }, inquiries: { total: inquiries.length, newInRange: newCount(inquiries) }, subscriptions: { active: organizations.filter((o) => o.subscriptionStatus === "active").length, trialing: organizations.filter((o) => o.subscriptionStatus === "trialing").length, pastDue: organizations.filter((o) => o.subscriptionStatus === "past_due").length }, recurringRevenue: { mrrByCurrency: mrr, arrByCurrency: arr }, collectedRevenue: { totalByCurrency: collected } }, subscriptionMix: mix, series: Array.from(seriesMap, ([date, value]) => ({ date, ...value })).sort((a, b) => a.date.localeCompare(b.date)), team: Array.from(team.values()).filter((item) => item.inquiries || item.closedProperties).sort((a, b) => b.closedProperties - a.closedProperties || b.inquiries - a.inquiries) });
}
