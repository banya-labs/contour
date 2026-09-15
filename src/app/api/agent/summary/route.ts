import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createApiHandler } from "@/lib/api-handler";
import { formatCurrency } from "@/lib/utils";

const getHandler = createApiHandler({
  requirePermissions: ["pwa.access"],
  handler: async (req, ctx) => {
    const { organizationId, userId, userRole, contourRole } = ctx;

    const [user, org] = await Promise.all([
      db.user.findUnique({
        where: { id: userId },
        select: { id: true, name: true, email: true, phone: true, role: true },
      }),
      db.organization.findUnique({
        where: { id: organizationId },
        select: { id: true, name: true, slug: true, currency: true },
      }),
    ]);

    if (!user || !org) {
      return NextResponse.json({ success: false, error: "User or organization not found" }, { status: 404 });
    }

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
        where: { organizationId, assignedAgentId: userId },
      }),
      db.inquiry.count({
        where: { organizationId },
      }),
    ]);

    // 3. Real CRM Inquiries assigned to this agent
    const assignedInquiries = await db.inquiry.findMany({
      where: { organizationId, assignedAgentId: userId },
      include: {
        property: {
          select: { id: true, title: true, suburb: true, askingPrice: true, rentalPrice: true, currency: true },
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
      if (inq.status === "OFFER_MADE") {
        queueItems.push({
          id: `queue_offer_${inq.id}`,
          title: `Advance ${inq.clientName}'s offer`,
          subtitle: `${inq.property?.suburb || "Lusaka"} · Offer submitted (${formatCurrency(Number(inq.dealValue || inq.budgetMax || 0), inq.currency)})`,
          type: "DEAL",
          targetTab: "DEALS",
        });
      } else if (inq.status === "VIEWING_SCHEDULED") {
        queueItems.push({
          id: `queue_viewing_${inq.id}`,
          title: `Conduct viewing for ${inq.clientName}`,
          subtitle: `${inq.property?.title || "Property"} · ${inq.property?.suburb || "Lusaka"}`,
          type: "VIEWING",
          targetTab: "PROPERTIES",
        });
      } else if (inq.status === "NEW_INQUIRY") {
        queueItems.push({
          id: `queue_inquiry_${inq.id}`,
          title: `Contact new lead ${inq.clientName}`,
          subtitle: `${inq.preferredSuburbs?.[0] || "Lusaka"} · Budget ${formatCurrency(Number(inq.budgetMax || 0), inq.currency)}`,
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
    const dealStages = ["VIEWING_SCHEDULED", "NEGOTIATING", "OFFER_MADE", "CLOSED_WON"];
    const activeDeals = assignedInquiries
      .filter((inq) => dealStages.includes(inq.status))
      .map((inq) => {
        const val = Number(inq.dealValue || inq.budgetMax || inq.property?.askingPrice || inq.property?.rentalPrice || 0);
        const lockExpiresAt = inq.exclusiveLockExpiresAt ? new Date(inq.exclusiveLockExpiresAt) : null;
        const daysRemaining = lockExpiresAt
          ? Math.max(0, Math.ceil((lockExpiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
          : 30;

        let stageLabel = "Viewing Scheduled";
        if (inq.status === "NEGOTIATING") stageLabel = "Negotiating Terms";
        if (inq.status === "OFFER_MADE") stageLabel = "Offer Submitted";
        if (inq.status === "CLOSED_WON") stageLabel = "Deeds Lodged / Closed";

        // Est 50% split on standard 5% sales or 10% rental fee
        const commissionAmt = inq.lookingFor === "FOR_RENT" ? val * 0.1 : val * 0.05;
        const agentSplitEst = commissionAmt * 0.5;

        return {
          id: inq.id,
          propertyTitle: inq.property?.title || `${inq.lookingFor === "FOR_RENT" ? "Rental" : "Purchase"} Mandate`,
          suburb: inq.property?.suburb || inq.preferredSuburbs?.[0] || "Lusaka",
          clientName: inq.clientName,
          value: formatCurrency(val, inq.currency),
          stage: inq.status,
          stageLabel,
          agentSplitEst: `${formatCurrency(agentSplitEst, inq.currency)} (50% Split)`,
          lockDaysRemaining: daysRemaining,
          updatedAt: inq.updatedAt.toISOString(),
        };
      });

    // 7. Real Transactions & Commission Splits
    const transactions = await db.transaction.findMany({
      where: { organizationId, closingAgentId: userId },
      include: {
        property: { select: { title: true, suburb: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    let earnedSplitUsd = 0;
    let earnedSplitZmw = 0;
    let pendingSplitUsd = 0;
    let pendingSplitZmw = 0;

    const slips = transactions.map((tx) => {
      const agentSplit = Number(tx.agentSplitAmount);
      const grossCommission = Number(tx.agencyCommissionAmount);

      if (tx.status === "RECEIVED" || tx.status === "AGENT_PAID_OUT") {
        if (tx.currency === "USD") earnedSplitUsd += agentSplit;
        else earnedSplitZmw += agentSplit;
      } else {
        if (tx.currency === "USD") pendingSplitUsd += agentSplit;
        else pendingSplitZmw += agentSplit;
      }

      return {
        id: tx.id,
        property: tx.property.title,
        suburb: tx.property.suburb,
        grossCommission: formatCurrency(grossCommission, tx.currency),
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
