import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { approveSalePaymentPlan } from "@/lib/property-finance/sale-payment-service";
import { createApiHandler, type ApiRouteContext } from "@/lib/api-handler";

const postHandler = createApiHandler({
  requirePermissions: ["sales.plans.manage"],
  handler: async (_request, { organizationId, userId, params }) => {
    const planId = typeof params?.id === "string" ? params.id : "";
    try {
      const plan = await db.$transaction((tx) => approveSalePaymentPlan(tx, { organizationId: organizationId!, planId, approvedById: userId! }));
      return NextResponse.json({ success: true, plan });
    } catch (error) {
      const code = error instanceof Error ? error.message : "SALE_PAYMENT_APPROVAL_ERROR";
      const status = code.endsWith("NOT_FOUND") ? 404 : code.includes("NOT_APPROVABLE") ? 409 : 400;
      return NextResponse.json({ success: false, error: code, code }, { status });
    }
  },
});

export async function POST(request: NextRequest, context: ApiRouteContext) {
  return postHandler(request, context);
}
