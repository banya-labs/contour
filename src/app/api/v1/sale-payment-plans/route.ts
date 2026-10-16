import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createApiHandler, type ApiRouteContext } from "@/lib/api-handler";
import { createSalePaymentPlanSchema } from "@/lib/property-finance/sale-payment-validation";
import { createSalePaymentPlan } from "@/lib/property-finance/sale-payment-service";

const postHandler = createApiHandler({
  requirePermissions: ["sales.plans.manage"],
  bodySchema: createSalePaymentPlanSchema,
  handler: async (_request, { organizationId, body }) => {
    try {
      const plan = await db.$transaction((tx) => createSalePaymentPlan(tx, { ...body, organizationId: organizationId! }));
      return NextResponse.json({ success: true, plan }, { status: 201 });
    } catch (error) {
      const code = error instanceof Error ? error.message : "SALE_PAYMENT_PLAN_ERROR";
      const status = code.endsWith("NOT_FOUND") ? 404 : code.includes("MISMATCH") ? 409 : 400;
      return NextResponse.json({ success: false, error: code, code }, { status });
    }
  },
});

export async function POST(request: NextRequest, context: ApiRouteContext) {
  return postHandler(request, context);
}
