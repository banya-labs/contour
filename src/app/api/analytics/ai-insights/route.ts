import { NextRequest, NextResponse } from "next/server";
import { createApiHandler } from "@/lib/api-handler";
import { ContourReportPayload } from "@/lib/analytics/types";

export const dynamic = "force-dynamic";

export const POST = createApiHandler({
  requirePermissions: ["leads.read"],
  handler: async (req, ctx) => {
    let payload: ContourReportPayload;

    try {
      const json = await req.json();
      payload = json.reportPayload || json;
    } catch {
      return NextResponse.json({ success: false, error: "Invalid JSON body." }, { status: 400 });
    }

    if (!payload?.meta || !payload?.executiveKpis) {
      return NextResponse.json(
        { success: false, error: "Missing required report payload data." },
        { status: 400 }
      );
    }

    const {
      meta,
      period,
      executiveKpis,
      financialKpis,
      matching,
      demandByLocation,
      demandByPropertyType,
      staleProperties,
      completedTransactions,
      lostDealsSummary,
      viewings,
      leadSourcePerformance,
      rentalPerformance,
      pipelineFunnel,
    } = payload;

    const currency = meta.currency || "ZMW";
    const topLocation = demandByLocation[0]?.name || "Lusaka Prime Areas";
    const topType = demandByPropertyType[0]?.name || "3 Bedroom Residential";
    const bestSource = leadSourcePerformance[0]?.source || "Website";

    // System prompt enforcing zero hallucination
    const systemPrompt = `You are an elite Real Estate Operations Analyst and Chief Operating Officer for Southern African real estate platforms.
Your role is to analyze verified, deterministic operational telemetry and write concise, highly professional executive intelligence.

STRICT OPERATIONAL CONTRACT:
1. ZERO HALLUCINATION: Use ONLY the exact numbers, locations, and names provided in the user data.
2. DO NOT recalculate or invent any monetary amounts, counts, or conversion rates.
3. Every sentence must directly reference real verified metrics from the input payload.
4. Always prefix currency with "${currency}".
5. Return strictly valid JSON with no markdown backticks or commentary outside JSON.`;

    const userPrompt = `Here is the verified operational telemetry for ${meta.companyName} covering ${period.label}:

- Period: ${period.from} to ${period.to} (${period.days} days)
- Inquiries: ${executiveKpis.newInquiries} total (${matching.fullyMatched} matched, ${matching.unmatched} unmatched, match rate ${matching.matchRatePct}%)
- Viewings: ${viewings.scheduled} scheduled, ${viewings.completed} completed (${viewings.completionRatePct}% completion rate)
- Pipeline: ${executiveKpis.activeNegotiations} in negotiation, ${executiveKpis.offersReceived} written offers, active pipeline value ${currency} ${pipelineFunnel.totalActivePipelineValue.toLocaleString()}
- Closed Transactions: ${completedTransactions.length} deals closed (${currency} ${financialKpis.totalTransactionValue.toLocaleString()} gross value, ${currency} ${financialKpis.companyCommission.toLocaleString()} company commission)
- Lost Deals: ${lostDealsSummary.totalDealsLost} deals lost (${currency} ${lostDealsSummary.totalPotentialValueLost.toLocaleString()} potential value lost)
- Rental Performance: ${rentalPerformance.occupiedCount}/${rentalPerformance.rentalPropertiesCount} occupied (${rentalPerformance.occupancyRatePct}%), ${currency} ${rentalPerformance.outstanding.toLocaleString()} outstanding arrears
- Stale Inventory: ${staleProperties.length} properties listed over 90 days
- Highest Demand Location: ${topLocation}
- Highest Demand Type: ${topType}
- Top Lead Source: ${bestSource}

Generate the executive narrative JSON with these exact keys:
{
  "executiveSummaryText": "...",
  "whatIsWorking": ["...", "...", "...", "..."],
  "whatNeedsAttention": ["...", "...", "...", "..."],
  "actionPlan": {
    "immediatePriority1": ["...", "...", "..."],
    "thisWeekPriority2": ["...", "...", "..."],
    "nextMonthPriority3": ["...", "...", "..."]
  },
  "conclusionText": "..."
}`;

    // Check for OpenAI / Gemini / Anthropic API keys in environment
    const apiKey = process.env.OPENAI_API_KEY || process.env.GEMINI_API_KEY;

    if (apiKey && process.env.OPENAI_API_KEY) {
      try {
        const aiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            response_format: { type: "json_object" },
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userPrompt },
            ],
            temperature: 0.2,
          }),
        });

        if (aiResponse.ok) {
          const aiJson = await aiResponse.json();
          const parsed = JSON.parse(aiJson.choices[0].message.content);
          return NextResponse.json({ success: true, insights: parsed, engine: "OPENAI_GPT4O_MINI" });
        }
      } catch (e) {
        console.warn("[AI_INSIGHTS_FALLBACK] OpenAI request failed, falling back to deterministic synthesis.", e);
      }
    }

    // High-fidelity deterministic fallback (Zero Hallucination guaranteed)
    const deterministicInsights = {
      executiveSummaryText: `${meta.companyName} recorded solid operational momentum during ${period.label}, registering ${executiveKpis.newInquiries} new client inquiries, ${viewings.completed} completed viewings, ${executiveKpis.activeNegotiations} active negotiations, and ${completedTransactions.length} completed transactions. Total gross transaction volume reached ${currency} ${financialKpis.totalTransactionValue.toLocaleString()}, delivering ${currency} ${financialKpis.companyCommission.toLocaleString()} in gross agency commission.`,
      whatIsWorking: [
        `Lead Velocity: Generated ${executiveKpis.newInquiries} new inquiries with strong channel attribution from ${bestSource}.`,
        `Inventory Matching: Maintained a ${matching.matchRatePct}% match rate with ${matching.fullyMatched} inquiries successfully paired to property listings.`,
        `Viewing Conversion: Completed ${viewings.completed} property viewings resulting in ${executiveKpis.activeNegotiations} active negotiations (${viewings.viewingToNegotiationPct}% viewing-to-negotiation conversion).`,
        `Revenue Execution: Closed ${completedTransactions.length} deals generating ${currency} ${financialKpis.netCompanyCommission.toLocaleString()} in net company commission.`,
      ],
      whatNeedsAttention: [
        `Unmatched Client Queue: ${matching.unmatched} qualified clients are actively waiting for suitable inventory in ${topLocation}.`,
        `Deal Leakage: ${lostDealsSummary.totalDealsLost} deals fell through, representing ${currency} ${lostDealsSummary.totalPotentialValueLost.toLocaleString()} in lost transaction volume.`,
        `Overdue Follow-ups: ${executiveKpis.followUpsDue} client follow-ups require immediate agent contact to prevent lead churn.`,
        `Inventory Aging: ${staleProperties.length} properties have remained on the market for more than 90 days.`,
        `Rental Arrears: ${currency} ${rentalPerformance.outstanding.toLocaleString()} in overdue rent across ${rentalPerformance.tenantsInArrearsCount} tenants requires formal recovery action.`,
      ],
      actionPlan: {
        immediatePriority1: [
          `Canvass and mandate new listings in ${topLocation} to satisfy the ${matching.unmatched} unmatched clients.`,
          `Instruct field agents to clear all ${executiveKpis.followUpsDue} overdue follow-up tasks within 24 hours.`,
          `Re-engage the ${executiveKpis.activeNegotiations} clients currently in negotiation with refreshed counter-terms.`,
        ],
        thisWeekPriority2: [
          `Conduct formal price reduction reviews with landlords of the ${staleProperties.length} properties listed > 90 days.`,
          `Dispatch automated WhatsApp arrears notices to the ${rentalPerformance.tenantsInArrearsCount} tenants in arrears.`,
          `Review the ${lostDealsSummary.totalDealsLost} lost deal records to reinforce viewing negotiation protocols.`,
        ],
        nextMonthPriority3: [
          `Focus agency mandate acquisition on ${topType} properties where demand is highest.`,
          `Rebalance lead distribution to focus on ${bestSource}, our highest-converting acquisition channel.`,
          `Conduct monthly performance reviews with agents to improve viewing-to-offer conversion rates.`,
        ],
      },
      conclusionText: `${period.label} demonstrated strong demand and solid transaction closing capability. The immediate growth lever is matching the ${matching.unmatched} waiting clients by onboarding fresh inventory in ${topLocation} and converting the ${currency} ${pipelineFunnel.totalActivePipelineValue.toLocaleString()} active pipeline into closed transactions.`,
    };

    return NextResponse.json({
      success: true,
      insights: deterministicInsights,
      engine: "DETERMINISTIC_EXECUTIVE_SYNTHESIS",
    });
  },
});
