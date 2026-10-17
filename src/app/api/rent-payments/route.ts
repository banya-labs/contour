import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { createApiHandler, type ApiRouteContext } from "@/lib/api-handler";
import { db } from "@/lib/db";
import { recordRentPaymentSchema } from "@/lib/validations";

const postHandler = createApiHandler({
  requirePermissions: ["leases.manage"],
  bodySchema: recordRentPaymentSchema,
  handler: async (_request, { organizationId, userId, body }) => {
    const result = await db.$transaction(async (tx) => {
      if (body.idempotencyKey) {
        const existing = await tx.rentPayment.findFirst({ where: { organizationId, idempotencyKey: body.idempotencyKey } });
        if (existing) return existing;
      }
      const lease = await tx.lease.findFirst({ where: { id: body.leaseId, organizationId }, select: { id: true, currency: true } });
      if (!lease) return null;
      if (lease.currency !== body.currency) throw new Error("RENT_PAYMENT_CURRENCY_MISMATCH");
      const receiptNumber = `RENT-${new Date().getUTCFullYear()}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
      return tx.rentPayment.create({ data: {
        organizationId: organizationId!, leaseId: lease.id, amountPaid: new Prisma.Decimal(body.amountPaid), currency: body.currency,
        periodMonth: body.periodMonth, periodYear: body.periodYear, paymentDate: new Date(body.paymentDate), paymentMethod: body.paymentMethod,
        referenceNumber: body.referenceNumber, receiptNumber, idempotencyKey: body.idempotencyKey, status: "CONFIRMED", reconciledVia: "MANUAL", notes: body.notes,
      } });
    });
    if (!result) return NextResponse.json({ success: false, error: "Lease not found." }, { status: 404 });
    return NextResponse.json({ success: true, payment: result, recordedById: userId }, { status: 201 });
  },
});

export async function POST(request: NextRequest, context: ApiRouteContext) {
  try { return await postHandler(request, context); }
  catch (error) {
    const code = error instanceof Error ? error.message : "RENT_PAYMENT_ERROR";
    return NextResponse.json({ success: false, error: code, code }, { status: code.includes("MISMATCH") ? 409 : 400 });
  }
}
