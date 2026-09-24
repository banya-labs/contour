import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getPlatformActor } from "@/lib/control-plane";
import { canPlatformRole } from "@/lib/platform-authorization";
import { toAuthHeaders } from "@/lib/auth-headers";

const schema = z.object({ period: z.enum(["today", "this_week", "this_month", "this_year"]).default("this_month") });

export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: toAuthHeaders(request.headers) });
  const actor = session?.user ? await getPlatformActor(session.user.id, session.user.email) : null;
  if (!actor || !canPlatformRole(actor.role, "agency.read")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const parsed = schema.safeParse({ period: request.nextUrl.searchParams.get("period") || "this_month" });
  if (!parsed.success) return NextResponse.json({ error: "Invalid reporting period" }, { status: 400 });
  const organizations = await db.organization.findMany({ select: { subscriptionTier: true, subscriptionStatus: true, accountStatus: true } });
  const total = organizations.length;
  const tierCounts = organizations.reduce<Record<string, number>>((result, organization) => { const key = organization.subscriptionTier.toLowerCase(); result[key] = (result[key] || 0) + 1; return result; }, {});
  const trialing = organizations.filter((organization) => organization.subscriptionStatus.toLowerCase() === "trialing").length;
  const churned = organizations.filter((organization) => organization.accountStatus.toLowerCase() === "suspended" || organization.subscriptionStatus.toLowerCase() === "canceled").length;
  return NextResponse.json({ success: true, period: parsed.data.period, stats: { totalAgencies: total, trialing, tierCounts, churnRate: total ? (churned / total) * 100 : 0, churned } });
}
