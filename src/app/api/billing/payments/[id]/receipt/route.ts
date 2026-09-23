import { NextResponse } from "next/server";
import { createApiHandler } from "@/lib/api-handler";
import { db } from "@/lib/db";
import { CONTOUR_PLANS } from "@/lib/lenco";

export const GET = createApiHandler({
  requireAuth: true,
  requirePermissions: ["org.billing.read"],
  handler: async (req, { params, organizationId }) => {
    const { id } = (params || {}) as { id?: string };
    if (!id) return NextResponse.json({ success: false, error: "Payment ID is required" }, { status: 400 });

    const payment = await db.payment.findFirst({
      where: { id, organizationId: organizationId!, status: "SUCCESS" },
      include: { organization: { select: { name: true } } },
    });
    if (!payment) return NextResponse.json({ success: false, error: "Receipt not found" }, { status: 404 });

    const plan = CONTOUR_PLANS[payment.planId] || CONTOUR_PLANS.starter;
    const paidAt = (payment.completedAt || payment.createdAt).toLocaleDateString("en-ZM", { day: "numeric", month: "long", year: "numeric" });
    const invoiceNumber = `RCPT-${payment.reference.slice(-12).toUpperCase()}`;
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>${invoiceNumber}</title><style>body{font-family:Arial,sans-serif;color:#282828;max-width:720px;margin:48px auto;padding:0 24px}header{display:flex;justify-content:space-between;border-bottom:2px solid #282828;padding-bottom:20px}h1{font-size:28px;margin:0}p{color:#5f6368}.row{display:flex;justify-content:space-between;border-bottom:1px solid #ddd;padding:14px 0}.total{font-size:22px;font-weight:700;border-top:2px solid #282828;border-bottom:0}@media print{body{margin:24px}}</style></head><body><header><div><h1>Contour</h1><p>${payment.organization.name}</p></div><div><strong>Payment receipt</strong><p>${invoiceNumber}<br>${paidAt}</p></div></header><main><div class="row"><span>Plan</span><strong>${plan.name} (${payment.billingCycle})</strong></div><div class="row"><span>Provider</span><strong>${payment.provider}</strong></div><div class="row"><span>Reference</span><strong>${payment.reference}</strong></div><div class="row total"><span>Paid</span><strong>${payment.currency} ${Number(payment.amount).toLocaleString()}</strong></div></main><p>Thank you for your Contour payment. This receipt confirms a successful payment record. It is not a tax invoice unless Contour has explicitly marked it as one.</p></body></html>`;
    const download = new URL(req.url).searchParams.get("download") === "1";
    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Content-Disposition": `${download ? "attachment" : "inline"}; filename="${invoiceNumber}.html"`,
        "Cache-Control": "private, no-store",
      },
    });
  },
});
