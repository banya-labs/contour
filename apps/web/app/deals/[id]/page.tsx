import "../../../lib/load-contour-env";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight, Edit3, LineChart } from "lucide-react";
import { getContourDeal, getPrismaClient } from "@contour/db";
import { WorkspaceShell } from "../../../components/workspace-shell";

export const dynamic = "force-dynamic";

function formatMoney(amountCents: number, currency: string) {
  return new Intl.NumberFormat("en-ZM", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amountCents / 100);
}

function formatValue(value: string | null | undefined) {
  return value ?? "Unset";
}

type DealPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function DealDetailPage({ params }: DealPageProps) {
  const { id } = await params;
  const prisma = getPrismaClient();
  const deal = await getContourDeal(prisma, id);

  if (!deal) {
    notFound();
  }

  return (
    <WorkspaceShell>
      <div className="mx-auto max-w-[1100px] space-y-4">
        <Link
          href="/deals"
          className="inline-flex h-10 items-center gap-2 rounded-[999px] border border-[color:var(--border)] bg-[color:var(--surface)] px-4 text-[13px] font-medium"
        >
          <ArrowLeft className="size-4" />
          Back to deals
        </Link>

        <header className="rounded-[28px] border border-[color:var(--border)] bg-[color:var(--surface)] p-6 shadow-[0_16px_40px_rgba(39,26,0,0.05)]">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-[color:rgba(39,26,0,0.12)] bg-[color:rgba(39,26,0,0.04)] px-3 py-1 text-[10px] font-medium uppercase tracking-[0.28em] text-[color:var(--muted)]">
                <LineChart className="size-3.5" />
                Deal detail
              </div>
              <h1 className="mt-3 text-[clamp(2rem,2.2vw,3rem)] font-semibold tracking-[-0.04em]">{deal.title}</h1>
              <p className="mt-2 max-w-2xl text-[14px] leading-7 text-[color:var(--muted)]">
                Review the linked listing, client, and pipeline stage from one place.
              </p>
            </div>
            <Link
              href={`/deals/${deal.id}/edit`}
              className="inline-flex h-11 items-center gap-2 rounded-[999px] bg-[color:var(--primary)] px-4 text-[13px] font-medium text-[color:var(--primary-foreground)] transition-transform duration-150 hover:-translate-y-0.5"
            >
              <Edit3 className="size-4" />
              Edit deal
            </Link>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-4">
            <div className="rounded-[18px] border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-4">
              <p className="text-[11px] text-[color:var(--muted)]">Stage</p>
              <p className="mt-2 text-[18px] font-semibold">{formatValue(deal.stage)}</p>
            </div>
            <div className="rounded-[18px] border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-4">
              <p className="text-[11px] text-[color:var(--muted)]">Status</p>
              <p className="mt-2 text-[18px] font-semibold">{formatValue(deal.status)}</p>
            </div>
            <div className="rounded-[18px] border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-4">
              <p className="text-[11px] text-[color:var(--muted)]">Value</p>
              <p className="mt-2 text-[18px] font-semibold">{formatMoney(deal.valueCents, deal.currency)}</p>
            </div>
            <div className="rounded-[18px] border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-4">
              <p className="text-[11px] text-[color:var(--muted)]">Linked records</p>
              <p className="mt-2 text-[18px] font-semibold">
                {deal.listing ? "1 listing" : "0 listings"} / {deal.client ? "1 client" : "0 clients"}
              </p>
            </div>
          </div>
        </header>

        <section className="grid gap-4 xl:grid-cols-[1fr_1fr]">
          <article className="rounded-[28px] border border-[color:var(--border)] bg-[color:var(--surface)] p-5 shadow-[0_16px_40px_rgba(39,26,0,0.05)]">
            <p className="text-[10px] uppercase tracking-[0.28em] text-[color:var(--muted)]">Listing</p>
            <h2 className="mt-2 text-[20px] font-semibold tracking-[-0.03em]">Linked property</h2>
            <div className="mt-4 rounded-[22px] border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-4">
              {deal.listing ? (
                <>
                  <p className="text-[13px] font-medium">{deal.listing.title}</p>
                  <p className="mt-1 text-[12px] text-[color:var(--muted)]">Listing ID: {deal.listing.id}</p>
                  <Link
                    href={`/listings/${deal.listing.id}`}
                    className="mt-3 inline-flex items-center gap-2 text-[13px] font-medium text-[color:var(--primary)]"
                  >
                    <ArrowUpRight className="size-4" />
                    Open listing
                  </Link>
                </>
              ) : (
                <p className="text-[13px] text-[color:var(--muted)]">No listing linked.</p>
              )}
            </div>
          </article>

          <article className="rounded-[28px] border border-[color:var(--border)] bg-[color:var(--surface)] p-5 shadow-[0_16px_40px_rgba(39,26,0,0.05)]">
            <p className="text-[10px] uppercase tracking-[0.28em] text-[color:var(--muted)]">Client</p>
            <h2 className="mt-2 text-[20px] font-semibold tracking-[-0.03em]">Linked contact</h2>
            <div className="mt-4 rounded-[22px] border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-4">
              {deal.client ? (
                <>
                  <p className="text-[13px] font-medium">{deal.client.fullName}</p>
                  <p className="mt-1 text-[12px] text-[color:var(--muted)]">Client ID: {deal.client.id}</p>
                  <Link
                    href={`/clients/${deal.client.id}`}
                    className="mt-3 inline-flex items-center gap-2 text-[13px] font-medium text-[color:var(--primary)]"
                  >
                    <ArrowUpRight className="size-4" />
                    Open client
                  </Link>
                </>
              ) : (
                <p className="text-[13px] text-[color:var(--muted)]">No client linked.</p>
              )}
            </div>
          </article>
        </section>
      </div>
    </WorkspaceShell>
  );
}
