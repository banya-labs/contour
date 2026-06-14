import "../../../lib/load-contour-env";
import Link from "next/link";
import { ArrowLeft, Banknote } from "lucide-react";
import { getPrismaClient } from "@contour/db";
import { WorkspaceShell } from "../../../components/workspace-shell";

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

      <section className="rounded-[28px] border border-[color:var(--border)] bg-[color:var(--surface)] p-5 shadow-[0_16px_40px_rgba(39,26,0,0.05)]">
        <div className="grid gap-3 xl:grid-cols-2">
          {paymentPlans.map((plan) => (
            <article key={plan.id} className="rounded-[18px] border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-[14px] font-medium">{plan.planName}</p>
                  <p className="mt-1 text-[12px] text-[color:var(--muted)]">
                    {plan.client.fullName} - {plan.deal.title}
                  </p>
                </div>
                <p className="text-[12px] text-[color:var(--muted)]">{plan.status}</p>
              </div>
              <div className="mt-3 grid gap-2 sm:grid-cols-3">
                <p className="text-[12px] text-[color:var(--muted)]">
                  Principal: {formatMoney(Number(plan.principalAmount), plan.currency)}
                </p>
                <p className="text-[12px] text-[color:var(--muted)]">
                  Down payment: {formatMoney(Number(plan.downPaymentAmount), plan.currency)}
                </p>
                <p className="text-[12px] text-[color:var(--muted)]">{plan.installmentScheduleItems.length} schedule items</p>
              </div>
            </article>
          ))}
        </div>
      </section>
    </WorkspaceShell>
  );
}
