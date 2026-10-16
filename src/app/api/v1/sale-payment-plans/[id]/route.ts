import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createApiHandler, type ApiRouteContext } from "@/lib/api-handler";
import { summarizeSaleSchedule } from "@/lib/property-finance/sale-payment-plan";

const getHandler = createApiHandler({
  requirePermissions: ["sales.payments.read"],
  handler: async (_request, { organizationId, params }) => {
    const id = typeof params?.id === "string" ? params.id : "";
    const plan = await db.salePaymentPlan.findFirst({ where: { id, organizationId }, include: { revisions: { include: { installments: true }, orderBy: { revision: "desc" } }, events: { where: { kind: "CONFIRM" }, include: { allocations: true }, orderBy: { postedAt: "asc" } } } });
    if (!plan) return NextResponse.json({ success: false, error: "Payment plan not found." }, { status: 404 });
    const revision = plan.revisions.find((item) => item.revision === plan.currentRevision) ?? plan.revisions[0];
    const allocations = plan.events.flatMap((event) => event.allocations.map((allocation) => ({ installmentSequence: revision?.installments.find((line) => line.id === allocation.installmentId)?.sequence ?? 0, amount: allocation.amount.toFixed(2) })));
    const summary = revision ? summarizeSaleSchedule({ lines: revision.installments.map((line) => ({ sequence: line.sequence, kind: line.kind, amount: line.amount.toFixed(2), dueDate: line.dueDate.toISOString().slice(0, 10), carriedPaidAmount: line.carriedPaidAmount.toFixed(2) })), allocations, asOfDate: new Date() }) : null;
    return NextResponse.json({ success: true, plan, revision, summary }, { headers: { "Cache-Control": "private, no-store" } });
  },
});

export async function GET(request: NextRequest, context: ApiRouteContext) {
  return getHandler(request, context);
}
