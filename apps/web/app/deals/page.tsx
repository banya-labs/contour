import "../../lib/load-contour-env";
import Link from "next/link";
import { ArrowUpRight, LineChart } from "lucide-react";
import { getPrismaClient } from "@contour/db";
import { WorkspaceShell } from "../../components/workspace-shell";

export const dynamic = "force-dynamic";

function formatMoney(amountCents: number, currency: string) {
  return new Intl.NumberFormat("en-ZM", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amountCents / 100);
}

export default async function DealsPage() {
  const prisma = getPrismaClient();
  const [deals, openDeals, wonDeals, totalValue] = await Promise.all([
    prisma.deal.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
      include: {
        listing: { select: { title: true } },
        client: { select: { fullName: true } },
        paymentPlans: { select: { id: true } },
        payments: { select: { id: true } },
      },
    }),
    prisma.deal.count({ where: { status: "open" } }),
    prisma.deal.count({ where: { status: "won" } }),
    prisma.deal.aggregate({ _sum: { valueCents: true } }),
  ]);

  return (
    <WorkspaceShell>
      <header className="rounded-[28px] border border-[color:var(--border)] bg-[color:var(--surface)] p-5 shadow-[0_16px_40px_rgba(39,26,0,0.05)]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[color:rgba(39,26,0,0.12)] bg-[color:rgba(39,26,0,0.04)] px-3 py-1 text-[10px] font-medium uppercase tracking-[0.28em] text-[color:var(--muted)]">
              <LineChart className="size-3.5" />
              Deals
            </div>
            <h1 className="mt-3 text-[clamp(2rem,2.2vw,3rem)] font-semibold tracking-[-0.04em]">Deal pipeline</h1>
            <p className="mt-2 max-w-2xl text-[14px] leading-7 text-[color:var(--muted)]">
              Watch the current pipeline, the linked listing, and the client attached to each deal.
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
            <p className="text-[11px] text-[color:var(--muted)]">Open deals</p>
            <p className="mt-2 text-[18px] font-semibold">{openDeals}</p>
          </div>
          <div className="rounded-[18px] border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-4">
            <p className="text-[11px] text-[color:var(--muted)]">Won deals</p>
            <p className="mt-2 text-[18px] font-semibold">{wonDeals}</p>
          </div>
          <div className="rounded-[18px] border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-4">
            <p className="text-[11px] text-[color:var(--muted)]">Total pipeline value</p>
            <p className="mt-2 text-[18px] font-semibold">{formatMoney(totalValue._sum.valueCents ?? 0, "ZMW")}</p>
          </div>
        </div>
      </header>

      <section className="rounded-[28px] border border-[color:var(--border)] bg-[color:var(--surface)] p-5 shadow-[0_16px_40px_rgba(39,26,0,0.05)]">
        <div className="overflow-hidden rounded-[22px] border border-[color:var(--border)]">
          <table className="min-w-full border-collapse text-left text-[13px]">
            <thead className="bg-[color:var(--surface-muted)] text-[color:var(--muted)]">
              <tr>
                <th className="px-4 py-3 font-medium">Deal</th>
                <th className="px-4 py-3 font-medium">Stage</th>
                <th className="px-4 py-3 font-medium">Listing</th>
                <th className="px-4 py-3 font-medium">Client</th>
                <th className="px-4 py-3 font-medium">Value</th>
                <th className="px-4 py-3 font-medium">Plans</th>
              </tr>
            </thead>
            <tbody>
              {deals.length ? (
                deals.map((deal, index) => (
                  <tr key={deal.id} className={index !== deals.length - 1 ? "border-b border-[color:var(--border)]" : ""}>
                    <td className="px-4 py-3.5">
                      <div className="font-medium">{deal.title}</div>
                      <div className="mt-1 text-[11px] text-[color:var(--muted)]">{deal.status}</div>
                    </td>
                    <td className="px-4 py-3.5 text-[color:var(--muted)]">{deal.stage}</td>
                    <td className="px-4 py-3.5 text-[color:var(--muted)]">{deal.listing?.title ?? "Unset"}</td>
                    <td className="px-4 py-3.5 text-[color:var(--muted)]">{deal.client?.fullName ?? "Unset"}</td>
                    <td className="px-4 py-3.5 text-[color:var(--muted)]">{formatMoney(deal.valueCents, deal.currency)}</td>
                    <td className="px-4 py-3.5 text-[color:var(--muted)]">{deal.paymentPlans.length} plans, {deal.payments.length} payments</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="px-4 py-8 text-center text-[13px] text-[color:var(--muted)]" colSpan={6}>
                    No deals found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </WorkspaceShell>
  );
}
