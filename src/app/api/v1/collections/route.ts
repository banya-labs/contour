import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { createApiHandler, type ApiRouteContext } from "@/lib/api-handler";
import { summarizeSaleSchedule } from "@/lib/property-finance/sale-payment-plan";

const collectionQuerySchema = z.object({
  status: z.enum(["ALL", "DUE", "OVERDUE", "COMPLETED", "CANCELLED"]).default("ALL"),
  currency: z.enum(["ZMW", "USD", "ZAR"]).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  cursor: z.string().optional(),
});

const getHandler = createApiHandler({
  requirePermissions: ["sales.payments.read"],
  querySchema: collectionQuerySchema,
  handler: async (_request, { organizationId, query }) => {
    const plans = await db.salePaymentPlan.findMany({
      where: { organizationId, ...(query.currency ? { currency: query.currency } : {}), ...(query.status === "COMPLETED" ? { status: "COMPLETED" } : query.status === "CANCELLED" ? { status: "CANCELLED" } : { status: { not: "CANCELLED" } }) },
      orderBy: { updatedAt: "desc" }, take: query.limit + 1, ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
      include: { inquiry: { select: { clientName: true, clientPhone: true } }, revisions: { include: { installments: true }, orderBy: { revision: "desc" } }, events: { where: { kind: "CONFIRM" }, include: { allocations: true }, orderBy: { postedAt: "asc" } } },
    });
    const hasMore = plans.length > query.limit;
    const page = hasMore ? plans.slice(0, query.limit) : plans;
    const rows = page.map((plan) => {
      const revision = plan.revisions.find((item) => item.revision === plan.currentRevision) ?? plan.revisions[0];
      const allocations = plan.events.flatMap((event) => event.allocations.map((allocation) => ({ installmentSequence: revision?.installments.find((line) => line.id === allocation.installmentId)?.sequence ?? 0, amount: allocation.amount.toFixed(2) })));
      const summary = revision ? summarizeSaleSchedule({ lines: revision.installments.map((line) => ({ sequence: line.sequence, kind: line.kind, amount: line.amount.toFixed(2), dueDate: line.dueDate.toISOString().slice(0, 10), carriedPaidAmount: line.carriedPaidAmount.toFixed(2) })), allocations, asOfDate: new Date() }) : null;
      return { id: plan.id, transactionId: plan.transactionId, status: plan.status, currency: plan.currency, client: plan.inquiry, revision: revision?.revision ?? null, summary };
    }).filter((row) => query.status === "OVERDUE" ? Number(row.summary?.overdue ?? 0) > 0 : query.status === "DUE" ? Number(row.summary?.outstanding ?? 0) > 0 : true);
    return NextResponse.json({ success: true, collections: rows, nextCursor: hasMore ? page.at(-1)?.id ?? null : null }, { headers: { "Cache-Control": "private, no-store" } });
  },
});

export async function GET(request: NextRequest, context: ApiRouteContext) {
  return getHandler(request, context);
}
