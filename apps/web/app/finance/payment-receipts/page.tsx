import "../../../lib/load-contour-env";
import Link from "next/link";
import { ArrowLeft, ReceiptText } from "lucide-react";
import { getPrismaClient } from "@contour/db";
import { WorkspaceShell } from "../../../components/workspace-shell";
import { FinancePaymentReceiptsTable } from "../../../components/finance-payment-receipts-table";
import { buildSearchIndex } from "../../../lib/table-search";

export const dynamic = "force-dynamic";

function formatMoney(amount: number, currency: string) {
  return new Intl.NumberFormat("en-ZM", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export default async function PaymentReceiptsPage() {
  const prisma = getPrismaClient();
  const payments = await prisma.payment.findMany({
    orderBy: { paidAt: "desc" },
    take: 24,
    include: {
      client: { select: { fullName: true } },
      deal: { select: { title: true } },
    },
  });
  const rows = payments.map((payment) => ({
    id: payment.id,
    receiptNumber: payment.receiptNumber ?? payment.id,
    client: payment.client.fullName,
    deal: payment.deal?.title ?? "Unset",
    amount: formatMoney(Number(payment.amount), payment.currency),
    method: payment.method ?? "unspecified",
    searchIndex: buildSearchIndex(
      payment.receiptNumber ?? payment.id,
      payment.client.fullName,
      payment.deal?.title,
      payment.amount,
      payment.currency,
      payment.method,
    ),
  }));

  return (
    <WorkspaceShell>
      <header className="rounded-[28px] border border-[color:var(--border)] bg-[color:var(--surface)] p-5 shadow-[0_16px_40px_rgba(39,26,0,0.05)]">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[color:rgba(39,26,0,0.12)] bg-[color:rgba(39,26,0,0.04)] px-3 py-1 text-[10px] font-medium uppercase tracking-[0.28em] text-[color:var(--muted)]">
              <ReceiptText className="size-3.5" />
              Finance
            </div>
            <h1 className="mt-3 text-[clamp(2rem,2.2vw,3rem)] font-semibold tracking-[-0.04em]">Payment receipts</h1>
            <p className="mt-2 max-w-2xl text-[14px] leading-7 text-[color:var(--muted)]">
              Review incoming payments, receipt numbers, and the deal or client each receipt is tied to.
            </p>
          </div>
          <Link
            href="/finance"
            className="inline-flex h-11 items-center gap-2 rounded-[999px] border border-[color:var(--border)] bg-[color:var(--surface-muted)] px-4 text-[13px] font-medium"
          >
            <ArrowLeft className="size-4" />
            Back to finance
          </Link>
        </div>
      </header>

      <FinancePaymentReceiptsTable rows={rows} />
    </WorkspaceShell>
  );
}
