import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createApiHandler, type ApiRouteContext } from "@/lib/api-handler";
import { salePaymentEventSchema } from "@/lib/property-finance/sale-payment-validation";
import { confirmSalePaymentReceipt, reverseOrRefundSalePayment } from "@/lib/property-finance/sale-payment-service";

const postHandler = createApiHandler({
  requirePermissions: ["sales.payments.verify"],
  bodySchema: salePaymentEventSchema,
  handler: async (_request, { organizationId, userId, params, body }) => {
    if (body.kind === "REJECT") return NextResponse.json({ success: false, error: "Receipt rejection workflow is not enabled in this slice.", code: "PAYMENT_EVENT_NOT_IMPLEMENTED" }, { status: 409 });
    const planId = typeof params?.id === "string" ? params.id : "";
    const paymentId = typeof params?.paymentId === "string" ? params.paymentId : "";
    try {
      const event = await db.$transaction((tx) => body.kind === "CONFIRM"
        ? confirmSalePaymentReceipt(tx, { organizationId: organizationId!, planId, receiptEventId: paymentId, recordedById: userId!, idempotencyKey: body.idempotencyKey })
        : reverseOrRefundSalePayment(tx, { organizationId: organizationId!, planId, sourceEventId: body.sourceEventId, kind: body.kind, amount: body.amount, reason: body.reason, evidenceReference: body.kind === "REFUND" ? body.evidenceReference : undefined, recordedById: userId!, idempotencyKey: body.idempotencyKey }));
      return NextResponse.json({ success: true, event }, { status: 201 });
    } catch (error) {
      const code = error instanceof Error ? error.message : "SALE_PAYMENT_CONFIRMATION_ERROR";
      const status = code.endsWith("NOT_FOUND") ? 404 : code.includes("EXCEEDS") || code.includes("NOT_COLLECTIBLE") ? 409 : 400;
      return NextResponse.json({ success: false, error: code, code }, { status });
    }
  },
});

export async function POST(request: NextRequest, context: ApiRouteContext) {
  return postHandler(request, context);
}
