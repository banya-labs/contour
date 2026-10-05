import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { summarizeMachineCommission } from "@/lib/machine-permissions";
import { authenticateDifyRequest, checkDirectMachineIpLimit } from "@/lib/dify-auth";
import { commissionToolSchema } from "@/lib/ai-tool-schemas";
import { getOrCreateCorrelationId } from "@/lib/correlation";

/**
 * Dify Tool: `get_revenue_commission`
 * 
 * Aggregates 5% agency commission revenue, closing splits, and pipeline value
 * strictly for the authenticated tenant in Neon PostgreSQL.
 */
export async function POST(req: NextRequest) {
  try {
    const rateError = await checkDirectMachineIpLimit(req);
    if (rateError) return rateError;
    const body = await req.json().catch(() => ({}));
    const parsed = commissionToolSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid commission arguments" }, { status: 400 });
    }
    const { organization_id } = parsed.data;

    const { context, errorResponse } = await authenticateDifyRequest(req, organization_id);
    if (errorResponse) return errorResponse;

    const tenantOrgId = context!.organizationId;

    const transactions = await db.transaction.groupBy({
      by: ["currency", "status"],
      where: { organizationId: tenantOrgId },
      _sum: { grossValue: true, agencyCommissionAmount: true, agentSplitAmount: true },
      _count: { _all: true },
    });

    const metrics = summarizeMachineCommission(transactions);

    return NextResponse.json({
      success: true,
      tenant: tenantOrgId,
      agencyCommissionRate: "Per-property contracted rate",
      closingAgentSplitRate: "50% of Agency Fee",
      metrics,
    });
  } catch (error: unknown) {
    const correlationId = getOrCreateCorrelationId(req);
    console.error("Dify Commission Tool Error:", { correlationId, error });
    return NextResponse.json(
      { error: "Failed to retrieve commission metrics", correlationId },
      { status: 500, headers: { "x-correlation-id": correlationId } }
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
