import { formatPropertyLocation } from "@/lib/property-location";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createApiHandler } from "@/lib/api-handler";
import { formatCurrency } from "@/lib/utils";
import { getStageDefinition, mapLegacyPipelineState } from "@/lib/deal-workflow";
import { resolveEarningsPeriod } from "@/lib/statements/period";


const earningsPeriods = ["today", "week", "month", "all"] as const;
type EarningsPeriod = (typeof earningsPeriods)[number];


const getHandler = createApiHandler({
  requirePermissions: ["pwa.access"],
  handler: async (req, ctx) => {
    const { organizationId, userId, userRole, contourRole } = ctx;
    const requestedPeriod = req.nextUrl.searchParams.get("earningsPeriod") || "all";
    const earningsPeriod: EarningsPeriod = earningsPeriods.includes(requestedPeriod as EarningsPeriod) ? requestedPeriod as EarningsPeriod : "all";

    const [user, org] = await Promise.all([
      db.user.findUnique({
        where: { id: userId },
        select: { id: true, name: true, email: true, phone: true, role: true },
      }),
      db.organization.findUnique({
        where: { id: organizationId },
        select: { id: true, name: true, slug: true, currency: true, profile: { select: { timezone: true } } },
      }),
    ]);

    if (!user || !org) {
      return NextResponse.json({ success: false, error: "User or organization not found" }, { status: 404 });
    }
    const earningsWindow = resolveEarningsPeriod(earningsPeriod, org.profile?.timezone || "Africa/Lusaka");
    const earningsStart = earningsWindow.start;

    // 1. Property Counts
    const [assignedPropertiesCount, totalOrgPropertiesCount] = await Promise.all([
      db.property.count({
        where: { organizationId, assignedAgentId: userId, status: { in: ["AVAILABLE", "UNDER_OFFER"] } },
      }),
      db.property.count({
        where: { organizationId, status: { in: ["AVAILABLE", "UNDER_OFFER"] } },
      }),
    ]);

    // 2. Client Counts
    const [assignedClientsCount, totalOrgClientsCount] = await Promise.all([
      db.inquiry.count({
        where: { organizationId, assignedAgentId: userId, status: { notIn: ["CLOSED", "CLOSED_WON", "CLOSED_LOST"] } },
      }),
      db.inquiry.count({
        where: { organizationId, status: { notIn: ["CLOSED", "CLOSED_WON", "CLOSED_LOST"] } },
      }),
    ]);

    // 3. Real CRM Inquiries assigned to this agent
    const assignedInquiries = await db.inquiry.findMany({
      where: { organizationId, assignedAgentId: userId, status: { notIn: ["CLOSED", "CLOSED_WON", "CLOSED_LOST"] } },
      include: {
        property: {
          select: { id: true, title: true, suburb: true, city: true, askingPrice: true, rentalPrice: true, currency: true, agencyCommissionPct: true },
        },
        visits: {
          where: { status: "SCHEDULED" },
          orderBy: { scheduledAt: "asc" },
          take: 1,
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    // 4. Viewings & Follow-ups
    const viewingsCount = assignedInquiries.filter(
      (inq) => inq.status === "VIEWING_SCHEDULED" || inq.visits.length > 0
    ).length;
    const followUpsCount = assignedInquiries.filter(
      (inq) => inq.status === "NEW_INQUIRY" || inq.status === "CONTACTED"
    ).length;

    // 5. Build dynamic Work Queue items from real DB state
    const queueItems: Array<{
      id: string;
      title: string;
      subtitle: string;
      type: "DEAL" | "VIEWING" | "CLIENT" | "TASK";
      targetTab: "DEALS" | "PROPERTIES" | "CLIENTS";
    }> = [];

    for (const inq of assignedInquiries) {
      const canonical = mapLegacyPipelineState(inq.status, inq.outcome);
      if (canonical.status === "VERIFICATION_CLOSING") {
        queueItems.push({
          id: `queue_verification_${inq.id}`,
          title: `Management review for ${inq.clientName}`,
          subtitle: `${formatPropertyLocation(inq.property)} · Verification and closing action required`,
          type: "DEAL",
          targetTab: "DEALS",
        });
      } else if (canonical.status === "NEGOTIATING") {
        queueItems.push({
          id: `queue_negotiation_${inq.id}`,
          title: `Continue ${inq.clientName}'s negotiation`,
          subtitle: `${formatPropertyLocation(inq.property)} · ${getStageDefinition(canonical.status).label} (${formatCurrency(Number(inq.dealValue || inq.budgetMax || 0), inq.currency)})`,
          type: "DEAL",
          targetTab: "DEALS",
        });
      } else if (canonical.status === "VIEWING_OR_OFFER") {
        queueItems.push({
          id: `queue_viewing_${inq.id}`,
          title: `Conduct viewing for ${inq.clientName}`,
          subtitle: `${inq.property?.title || "Property"} · ${formatPropertyLocation(inq.property)}`,
          type: "VIEWING",
          targetTab: "PROPERTIES",
        });
      } else if (canonical.status === "NEW_INQUIRY") {
        queueItems.push({
          id: `queue_inquiry_${inq.id}`,
          title: `Contact new lead ${inq.clientName}`,
          subtitle: `${inq.preferredSuburbs?.[0] || "Location not recorded"} · Budget ${formatCurrency(Number(inq.budgetMax || 0), inq.currency)}`,
          type: "CLIENT",
          targetTab: "CLIENTS",
        });
      }
    }

    // If no urgent tasks, provide default ready action
    if (queueItems.length === 0) {
      queueItems.push({
        id: "queue_default_add_client",
        title: "Register a new client inquiry",
        subtitle: "Protect client relationship for 30 days under Contour registry",
        type: "CLIENT",
        targetTab: "CLIENTS",
      });
    }

    // 6. Active Deals for this agent
    const dealStages = ["QUALIFIED", "VIEWING_OR_OFFER", "NEGOTIATING", "VERIFICATION_CLOSING"];
    const activeDeals = assignedInquiries
      .filter((inq) => dealStages.includes(inq.status))
      .map((inq) => {
        const val = Number(inq.dealValue || inq.budgetMax || inq.property?.askingPrice || inq.property?.rentalPrice || 0);
        const lockExpiresAt = inq.exclusiveLockExpiresAt ? new Date(inq.exclusiveLockExpiresAt) : null;
        const daysRemaining = lockExpiresAt
          ? Math.max(0, Math.ceil((lockExpiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
          : 30;

        const canonical = mapLegacyPipelineState(inq.status, inq.outcome);
        const stageLabel = getStageDefinition(canonical.status).label;

        const commissionPct = Number(inq.property?.agencyCommissionPct ?? (inq.lookingFor === "FOR_RENT" ? 10 : 5));
        const commissionAmt = val * (commissionPct / 100);
        const agentSplitEst = commissionAmt * 0.5;

        return {
          id: inq.id,
          propertyTitle: inq.property?.title || `${inq.lookingFor === "FOR_RENT" ? "Rental" : "Purchase"} Mandate`,
          propertyId: inq.propertyId,
          suburb: inq.property ? formatPropertyLocation(inq.property) : inq.preferredSuburbs?.[0] || "Location not recorded",
          clientName: inq.clientName,
          value: formatCurrency(val, inq.currency),
          stage: canonical.status,
          stageLabel,
          agentSplitEst: `${formatCurrency(agentSplitEst, inq.currency)} (50% Split)`,
          lockDaysRemaining: daysRemaining,
          updatedAt: inq.updatedAt.toISOString(),
        };
      });

    // 7. Real Transactions & Commission Splits
    const transactions = await db.transaction.findMany({
      where: {
        organizationId,
        closingAgentId: userId,
        OR: [{ closedAt: { ...(earningsStart ? { gte: earningsStart } : {}), lt: earningsWindow.end } }, { closedAt: null, createdAt: { ...(earningsStart ? { gte: earningsStart } : {}), lt: earningsWindow.end } }],
      },
      include: {
        property: { select: { title: true, suburb: true, city: true } },
        inquiry: { select: { clientName: true, clientPhone: true, clientEmail: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 5001,
    });
    if (transactions.length > 5000) return NextResponse.json({ success: false, error: "Select a shorter earnings period (maximum 5,000 deals)." }, { status: 400 });

    let earnedSplitUsd = 0;
    let earnedSplitZmw = 0;
    let pendingSplitUsd = 0;
    let pendingSplitZmw = 0;
    const currencyTotals: Record<string, { paid: number; earned: number; pending: number }> = {};

    const slips = transactions.map((tx) => {
      const agentSplit = Number(tx.agentSplitAmount);
      const grossCommission = Number(tx.agencyCommissionAmount);
      const total = currencyTotals[tx.currency] ||= { paid: 0, earned: 0, pending: 0 };
      if (tx.status === "AGENT_PAID_OUT") total.paid += agentSplit;
      else if (tx.status === "EARNED" || tx.status === "RECEIVED") total.earned += agentSplit;
      else total.pending += agentSplit;

      // Only an explicitly recorded agent payout counts as paid.
      if (tx.status === "AGENT_PAID_OUT") {
        if (tx.currency === "USD") earnedSplitUsd += agentSplit;
        else if (tx.currency === "ZMW") earnedSplitZmw += agentSplit;
      } else {
        if (tx.currency === "USD") pendingSplitUsd += agentSplit;
        else if (tx.currency === "ZMW") pendingSplitZmw += agentSplit;
      }

      return {
        id: tx.id,
        property: tx.property.title,
        suburb: formatPropertyLocation(tx.property),
        buyerName: tx.inquiry?.clientName || "-",
        buyerPhone: tx.inquiry?.clientPhone || "-",
        grossCommission: formatCurrency(grossCommission, tx.currency),
        commissionPct: `${Number(tx.agencyCommissionPct)}%`,
        agentSplit: formatCurrency(agentSplit, tx.currency),
        splitPct: `${Number(tx.agentSplitPct)}%`,
        status: tx.status,
        date: tx.closedAt ? tx.closedAt.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : tx.createdAt.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }),
      };
    });

    return NextResponse.json({
      success: true,
      agent: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone || "+260 97 123 4567",
        role: userRole || "FIELD_AGENT",
        contourRole,
        organizationName: org.name,
        currency: org.currency,
      },
      metrics: {
        assignedPropertiesCount,
        totalOrgPropertiesCount,
        assignedClientsCount,
        totalOrgClientsCount,
        activeDealsCount: activeDeals.length,
        viewingsCount,
        followUpsCount,
      },
      queue: queueItems,
      deals: activeDeals,
      earnings: {
        period: earningsPeriod,
        periodLabel: earningsWindow.label,
        asOf: new Date().toISOString(),
        periodLabels: { today: resolveEarningsPeriod("today", org.profile?.timezone || "Africa/Lusaka").label, week: resolveEarningsPeriod("week", org.profile?.timezone || "Africa/Lusaka").label, month: resolveEarningsPeriod("month", org.profile?.timezone || "Africa/Lusaka").label },
        currencyTotals,
        earnedSplitUsd,
        earnedSplitZmw,
        pendingSplitUsd,
        pendingSplitZmw,
        slips,
      },
    });
  },
});

export async function GET(req: NextRequest, context?: any) {
  return getHandler(req, context);
}
