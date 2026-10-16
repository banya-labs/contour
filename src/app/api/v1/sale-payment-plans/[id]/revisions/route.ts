import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createApiHandler, type ApiRouteContext } from "@/lib/api-handler";
import { createSalePlanRevisionSchema } from "@/lib/property-finance/sale-payment-validation";
import { createSalePlanRevision } from "@/lib/property-finance/sale-payment-service";

const postHandler = createApiHandler({
  requirePermissions: ["sales.plans.manage"],
  bodySchema: createSalePlanRevisionSchema,
  handler: async (_request, { organizationId, params, body }) => {
    const planId = typeof params?.id === "string" ? params.id : "";
    try {
      const revision = await db.$transaction((tx) => createSalePlanRevision(tx, { ...body, organizationId: organizationId!, planId }));
      return NextResponse.json({ success: true, revision }, { status: 201 });
    } catch (error) {
      const code = error instanceof Error ? error.message : "SALE_REVISION_ERROR";
      const status = code.endsWith("NOT_FOUND") ? 404 : code.includes("CONFLICT") || code.includes("RESCHEDULABLE") ? 409 : 400;
      return NextResponse.json({ success: false, error: code, code }, { status });
    }
  },
});

export async function POST(request: NextRequest, context: ApiRouteContext) {
  return postHandler(request, context);
}
