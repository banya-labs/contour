import "../../../lib/load-contour-env";
import Link from "next/link";
import { ArrowLeft, Banknote } from "lucide-react";
import { getPrismaClient } from "@contour/db";
import { WorkspaceShell } from "../../../components/workspace-shell";
import { FinancePaymentPlansTable } from "../../../components/finance-payment-plans-table";
import { buildSearchIndex } from "../../../lib/table-search";

export const dynamic = "force-dynamic";

function formatMoney(amount: number, currency: string) {
  return new Intl.NumberFormat("en-ZM", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export default async function PaymentPlansPage() {
  const prisma = getPrismaClient();
  const paymentPlans = await prisma.paymentPlan.findMany({
    orderBy: { createdAt: "desc" },
    take: 24,
    include: {
      deal: { select: { title: true } },
      client: { select: { fullName: true } },
      installmentScheduleItems: { select: { id: true, status: true } },
    },
  });
  const rows = paymentPlans.map((plan) => ({
    id: plan.id,
    planName: plan.planName,
    client: plan.client.fullName,
    deal: plan.deal.title,
    status: plan.status,
    principal: `Principal: ${formatMoney(Number(plan.principalAmount), plan.currency)}`,
    downPayment: `Down payment: ${formatMoney(Number(plan.downPaymentAmount), plan.currency)}`,
    scheduleItems: `${plan.installmentScheduleItems.length} schedule items`,
    searchIndex: buildSearchIndex(
      plan.planName,
      plan.client.fullName,
      plan.deal.title,
      plan.status,
      plan.principalAmount,
      plan.downPaymentAmount,
      plan.currency,
      plan.installmentScheduleItems.length,
    ),
  }));

  return (
    <WorkspaceShell>
      <header className="rounded-[28px] border border-[color:var(--border)] bg-[color:var(--surface)] p-5 shadow-[0_16px_40px_rgba(39,26,0,0.05)]">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[color:rgba(39,26,0,0.12)] bg-[color:rgba(39,26,0,0.04)] px-3 py-1 text-[10px] font-medium uppercase tracking-[0.28em] text-[color:var(--muted)]">
              <Banknote className="size-3.5" />
              Finance
            </div>
            <h1 className="mt-3 text-[clamp(2rem,2.2vw,3rem)] font-semibold tracking-[-0.04em]">Payment plans</h1>
            <p className="mt-2 max-w-2xl text-[14px] leading-7 text-[color:var(--muted)]">
              Track every installment structure with linked clients, deals, and schedule items.
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

      <FinancePaymentPlansTable rows={rows} />
    </WorkspaceShell>
  );
}
