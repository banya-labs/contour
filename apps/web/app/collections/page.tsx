import "../../lib/load-contour-env";
import Link from "next/link";
import { ArrowUpRight, Banknote } from "lucide-react";
import { getPrismaClient } from "@contour/db";
import { WorkspaceShell } from "../../components/workspace-shell";

export const dynamic = "force-dynamic";

function formatMoney(amount: number, currency: string) {
  return new Intl.NumberFormat("en-ZM", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export default async function CollectionsPage() {
  const prisma = getPrismaClient();
  const [paymentPlans, leases, payments, charges, overdueCharges] = await Promise.all([
    prisma.paymentPlan.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      include: {
        deal: { select: { title: true } },
        client: { select: { fullName: true } },
        installmentScheduleItems: { select: { id: true, status: true } },
      },
    }),
    prisma.rentalLease.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      include: {
        listing: { select: { title: true } },
        tenantClient: { select: { fullName: true } },
        rentalCharges: { select: { id: true, status: true } },
      },
    }),
    prisma.payment.findMany({
      orderBy: { paidAt: "desc" },
      take: 10,
      include: {
        client: { select: { fullName: true } },
        deal: { select: { title: true } },
      },
    }),
    prisma.rentalCharge.count(),
    prisma.rentalCharge.count({ where: { status: "overdue" } }),
  ]);

  return (
    <WorkspaceShell>
      <header className="rounded-[28px] border border-[color:var(--border)] bg-[color:var(--surface)] p-5 shadow-[0_16px_40px_rgba(39,26,0,0.05)]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[color:rgba(39,26,0,0.12)] bg-[color:rgba(39,26,0,0.04)] px-3 py-1 text-[10px] font-medium uppercase tracking-[0.28em] text-[color:var(--muted)]">
              <Banknote className="size-3.5" />
              Collections
            </div>
            <h1 className="mt-3 text-[clamp(2rem,2.2vw,3rem)] font-semibold tracking-[-0.04em]">Collections and billing</h1>
            <p className="mt-2 max-w-2xl text-[14px] leading-7 text-[color:var(--muted)]">
              Payment plans, leases, charges, and receipt history for the revenue side of the app.
            </p>
          </div>
          <Link
            href="/"
            className="inline-flex h-11 items-center gap-2 rounded-[999px] border border-[color:var(--border)] bg-[color:var(--surface-muted)] px-4 text-[13px] font-medium"
          >
            <ArrowUpRight className="size-4" />
            Dashboard
          </Link>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <div className="rounded-[18px] border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-4">
            <p className="text-[11px] text-[color:var(--muted)]">Payment plans</p>
            <p className="mt-2 text-[18px] font-semibold">{paymentPlans.length}</p>
          </div>
          <div className="rounded-[18px] border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-4">
            <p className="text-[11px] text-[color:var(--muted)]">Leases</p>
            <p className="mt-2 text-[18px] font-semibold">{leases.length}</p>
          </div>
          <div className="rounded-[18px] border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-4">
            <p className="text-[11px] text-[color:var(--muted)]">Overdue charges</p>
            <p className="mt-2 text-[18px] font-semibold">{overdueCharges} / {charges}</p>
          </div>
        </div>
      </header>

      <section className="grid gap-4 xl:grid-cols-3">
        <article className="rounded-[28px] border border-[color:var(--border)] bg-[color:var(--surface)] p-5 shadow-[0_16px_40px_rgba(39,26,0,0.05)] xl:col-span-2">
          <p className="text-[10px] uppercase tracking-[0.28em] text-[color:var(--muted)]">Payment plans</p>
          <div className="mt-4 space-y-3">
            {paymentPlans.map((plan) => (
              <div key={plan.id} className="rounded-[18px] border border-[color:var(--border)] bg-[color:var(--surface-muted)] px-4 py-3">
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
                  <p className="text-[12px] text-[color:var(--muted)]">Principal: {formatMoney(Number(plan.principalAmount), plan.currency)}</p>
                  <p className="text-[12px] text-[color:var(--muted)]">Down payment: {formatMoney(Number(plan.downPaymentAmount), plan.currency)}</p>
                  <p className="text-[12px] text-[color:var(--muted)]">{plan.installmentScheduleItems.length} schedule items</p>
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-[28px] border border-[color:var(--border)] bg-[color:var(--surface)] p-5 shadow-[0_16px_40px_rgba(39,26,0,0.05)]">
          <p className="text-[10px] uppercase tracking-[0.28em] text-[color:var(--muted)]">Recent payments</p>
          <div className="mt-4 space-y-3">
            {payments.map((payment) => (
              <div key={payment.id} className="rounded-[18px] border border-[color:var(--border)] bg-[color:var(--surface-muted)] px-4 py-3">
                <p className="text-[14px] font-medium">{payment.receiptNumber ?? payment.id}</p>
                <p className="mt-1 text-[12px] text-[color:var(--muted)]">
                  {payment.client.fullName}
                  {payment.deal ? ` - ${payment.deal.title}` : ""}
                </p>
                <p className="mt-2 text-[12px] text-[color:var(--muted)]">
                  {formatMoney(Number(payment.amount), payment.currency)} via {payment.method ?? "unspecified"}
                </p>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="rounded-[28px] border border-[color:var(--border)] bg-[color:var(--surface)] p-5 shadow-[0_16px_40px_rgba(39,26,0,0.05)]">
        <p className="text-[10px] uppercase tracking-[0.28em] text-[color:var(--muted)]">Rental leases</p>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {leases.map((lease) => (
            <div key={lease.id} className="rounded-[18px] border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-4">
              <p className="text-[14px] font-medium">{lease.leaseName}</p>
              <p className="mt-1 text-[12px] text-[color:var(--muted)]">
                {lease.tenantClient.fullName} - {lease.listing.title}
              </p>
              <p className="mt-2 text-[12px] text-[color:var(--muted)]">
                {formatMoney(Number(lease.rentAmount), lease.currency)} monthly
              </p>
            </div>
          ))}
        </div>
      </section>
    </WorkspaceShell>
  );
}
