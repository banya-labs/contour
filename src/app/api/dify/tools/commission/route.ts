import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { authenticateDifyRequest } from "@/lib/dify-auth";
import { MOCK_TRANSACTIONS } from "@/lib/mock-data";

/**
 * Dify Tool: `get_revenue_commission`
 * 
 * Aggregates 5% agency commission revenue, closing splits, and pipeline value
 * strictly for the authenticated tenant in Neon PostgreSQL.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { organization_id } = body;

    const { context, errorResponse } = await authenticateDifyRequest(req, organization_id);
    if (errorResponse) return errorResponse;

    const tenantOrgId = context!.organizationId;

    let metrics: any = null;

    try {
      const transactions = await db.transaction.findMany({
        where: { organizationId: tenantOrgId },
        include: {
          property: { select: { title: true, suburb: true } },
          closingAgent: { select: { name: true } },
        },
      });

      let totalGrossZmw = 0;
      let totalGrossUsd = 0;
      let earnedAgencyCommissionZmw = 0;
      let earnedAgencyCommissionUsd = 0;
      let agentSplitsPaidZmw = 0;
      let agentSplitsPaidUsd = 0;
      let pipelineExpectedZmw = 0;

      for (const tx of transactions) {
        const gross = Number(tx.grossValue || 0);
        const comm = Number(tx.agencyCommissionAmount || 0);
        const split = Number(tx.agentSplitAmount || 0);

        if (tx.currency === "USD") {
          if (["EARNED", "RECEIVED", "AGENT_PAID_OUT"].includes(tx.status)) {
            totalGrossUsd += gross;
            earnedAgencyCommissionUsd += comm;
            agentSplitsPaidUsd += split;
          }
        } else {
          if (["EARNED", "RECEIVED", "AGENT_PAID_OUT"].includes(tx.status)) {
            totalGrossZmw += gross;
            earnedAgencyCommissionZmw += comm;
            agentSplitsPaidZmw += split;
          } else if (tx.status === "EXPECTED") {
            pipelineExpectedZmw += comm;
          }
        }
      }

      metrics = {
        totalGrossVolume: `$ ${totalGrossUsd.toLocaleString()} + K ${totalGrossZmw.toLocaleString()}`,
        earnedAgencyCommission: `$ ${earnedAgencyCommissionUsd.toLocaleString()} + K ${earnedAgencyCommissionZmw.toLocaleString()}`,
        agentSplitsPaid: `$ ${agentSplitsPaidUsd.toLocaleString()} + K ${agentSplitsPaidZmw.toLocaleString()}`,
        pipelineExpectedCommission: `K ${pipelineExpectedZmw.toLocaleString()}`,
        closedDealsCount: transactions.filter((t) => t.status !== "EXPECTED").length,
        pipelineDealsCount: transactions.filter((t) => t.status === "EXPECTED").length,
      };
    } catch (dbError) {
      if (process.env.NEXT_PUBLIC_DEV_MODE === "true") {
        metrics = {
          totalGrossVolume: "$ 2,050,000 + K 4,200,000",
          earnedAgencyCommission: "$ 102,500 + K 210,000",
          agentSplitsPaid: "$ 51,250 + K 105,000",
          pipelineExpectedCommission: "K 388,500",
          closedDealsCount: 3,
          pipelineDealsCount: 4,
        };
      } else {
        throw dbError;
      }
    }

    return NextResponse.json({
      success: true,
      tenant: tenantOrgId,
      agencyCommissionRate: "5% (Sales) / 10% (Property Management)",
      closingAgentSplitRate: "50% of Agency Fee",
      metrics,
    });
  } catch (error: any) {
    console.error("Dify Commission Tool Error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve commission metrics", details: error.message },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const searchParams = Object.fromEntries(url.searchParams.entries());
  
  const mockReq = new NextRequest(req.url, {
    method: "POST",
    headers: req.headers,
    body: JSON.stringify(searchParams),
  });

  return POST(mockReq);
}
