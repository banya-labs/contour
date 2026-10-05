import { NextResponse } from "next/server";
import { createApiHandler } from "@/lib/api-handler";
import { ContourReportPayload } from "@/lib/analytics/types";
import { db } from "@/lib/db";

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
    const topLocation = demandByLocation[0]?.name || "areas with recorded demand";
    const topType = demandByPropertyType[0]?.name || "3 Bedroom Residential";
    const bestSource = leadSourcePerformance[0]?.source || "Website";
    const periodFrom = new Date(period.from);
    const periodTo = new Date(period.to);

    const saveSnapshot = async (status: "READY" | "ERROR", insights: unknown, errorMessage?: string) => {
      await db.aiInsightSnapshot.upsert({
        where: { organizationId_periodFrom_periodTo: { organizationId: ctx.organizationId!, periodFrom, periodTo } },
        create: { organizationId: ctx.organizationId!, periodFrom, periodTo, status, insights: insights ? insights as object : undefined, errorMessage },
        update: { status, insights: insights ? insights as object : undefined, errorMessage, generatedAt: new Date() },
      });
    };

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

    // 1. OpenRouter Integration (Preferred: fast & cost-effective Flash models)
    const openrouterKey = process.env.OPENROUTER_API_KEY;
    const openrouterModel = process.env.OPENROUTER_MODEL || "google/gemini-2.0-flash-001";

    if (openrouterKey) {
      try {
        const aiResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${openrouterKey}`,
            "HTTP-Referer": "https://contour.banyalabs.com",
            "X-Title": "Contour Real Estate OS",
          },
          body: JSON.stringify({
            model: openrouterModel,
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
          const rawContent = aiJson.choices?.[0]?.message?.content;
          if (rawContent) {
            // Clean markdown code fence if returned
            const cleanJson = rawContent.replace(/```json\n?|\n?```/g, "").trim();
            const parsed = JSON.parse(cleanJson);
            await saveSnapshot("READY", parsed);
            return NextResponse.json({
              success: true,
              insights: parsed,
              engine: `OPENROUTER (${openrouterModel})`,
            });
          }
        } else {
          const errText = await aiResponse.text();
          console.warn("[OPENROUTER_ERROR]", aiResponse.status, errText);
        }
      } catch (e) {
        console.warn("[OPENROUTER_FETCH_FAILED] AI provider request failed.", e);
      }
    }

    // 2. OpenAI Direct Integration (Fallback if OPENAI_API_KEY provided)
    const openaiKey = process.env.OPENAI_API_KEY;

    if (openaiKey) {
      try {
        const aiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${openaiKey}`,
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
            await saveSnapshot("READY", parsed);
            return NextResponse.json({ success: true, insights: parsed, engine: "OPENAI_GPT4O_MINI" });
        }
      } catch (e) {
        console.warn("[OPENAI_INSIGHTS_FAILED] AI provider request failed.", e);
      }
    }

    const errorMessage = "There was an error generating the AI results. Please ensure that your AI connection works fine.";
    await saveSnapshot("ERROR", null, errorMessage);
    return NextResponse.json({ success: false, error: errorMessage }, { status: 502 });
  },
});
