import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createApiHandler, type ApiRouteContext } from "@/lib/api-handler";
import { recordSalePaymentReceiptSchema } from "@/lib/property-finance/sale-payment-validation";
import { recordSalePaymentReceipt } from "@/lib/property-finance/sale-payment-service";

const postHandler = createApiHandler({
  requirePermissions: ["sales.payments.record"],
  bodySchema: recordSalePaymentReceiptSchema,
  handler: async (_request, { organizationId, userId, params, body }) => {
    const id = typeof params?.id === "string" ? params.id : "";
    try {
      const event = await db.$transaction((tx) => recordSalePaymentReceipt(tx, { ...body, planId: id, organizationId: organizationId!, recordedById: userId! }));
      return NextResponse.json({ success: true, payment: event }, { status: 201 });
    } catch (error) {
      const code = error instanceof Error ? error.message : "SALE_PAYMENT_RECEIPT_ERROR";
      const status = code.endsWith("NOT_FOUND") ? 404 : code.includes("MISMATCH") || code.includes("CANCELLED") || code.includes("NOT_ACTIVE") ? 409 : 400;
      return NextResponse.json({ success: false, error: code, code }, { status });
    }
  },
});

export async function POST(request: NextRequest, context: ApiRouteContext) {
  return postHandler(request, context);
}
