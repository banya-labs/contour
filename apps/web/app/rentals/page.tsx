import "../../lib/load-contour-env";
import Link from "next/link";
import { ArrowUpRight, LineChart, Plus } from "lucide-react";
import { getPrismaClient, listContourDeals } from "@contour/db";
import { WorkspaceShell } from "../../components/workspace-shell";
import { DealsTable } from "../../components/deals-table";
import { buildSearchIndex } from "../../lib/table-search";
import { DealsKanbanBoard } from "../../components/deals-kanban-board";
import { rentalDealWorkflow, getDealStageLabel } from "../../lib/deal-workflows";
import { getCachedLookupOptions } from "../../lib/route-data";

export const dynamic = "force-dynamic";

type RentalsPageProps = {
  searchParams?: Promise<{
    view?: string;
  }>;
};

function formatMoney(amountCents: number, currency: string) {
  return new Intl.NumberFormat("en-ZM", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amountCents / 100);
}

export default async function RentalsPage({ searchParams }: RentalsPageProps) {
  const resolvedSearchParams = await searchParams;
  const view = resolvedSearchParams?.view === "table" ? "table" : "board";
  const prisma = getPrismaClient();
  const [deals, options] = await Promise.all([
    listContourDeals(prisma, { dealType: "rental" }),
    getCachedLookupOptions(),
  ]);

  const openDeals = deals.filter((deal) => deal.status === "open").length;
  const closedDeals = deals.filter((deal) => deal.status !== "open").length;
  const totalValue = deals.reduce((sum, deal) => sum + deal.valueCents, 0);

  const boardRows = deals.map((deal) => ({
    ...deal,
    searchIndex: buildSearchIndex(
      deal.title,
      getDealStageLabel(deal.stage, deal.dealType),
      deal.status,
      deal.listing?.title,
      deal.client?.fullName,
      formatMoney(deal.valueCents, deal.currency),
      deal.valueCents,
      deal.currency,
      deal.paymentPlansCount,
      deal.paymentsCount,
    ),
  }));

  const rows = deals.map((deal) => ({
    id: deal.id,
    title: deal.title,
    status: deal.status,
    stage: getDealStageLabel(deal.stage, deal.dealType),
    request:
      deal.requestSummary ??
      deal.preferredPropertyType ??
      deal.preferredLocation ??
      deal.preferredCityTown ??
      deal.preferredProvince ??
      "No request captured",
    listing: deal.listing?.title ?? "Unset",
    client: deal.client?.fullName ?? "Unset",
    value: formatMoney(deal.valueCents, deal.currency),
    valueCents: deal.valueCents,
    plans: String(deal.paymentPlansCount),
    plansCount: deal.paymentPlansCount,
    payments: String(deal.paymentsCount),
    paymentsCount: deal.paymentsCount,
    searchIndex: buildSearchIndex(
      deal.title,
      deal.status,
      deal.stage,
      deal.requestSummary,
      deal.preferredPropertyType,
      deal.preferredLocation,
      deal.preferredCityTown,
      deal.preferredProvince,
      deal.listingDescription,
      deal.listing?.title,
      deal.client?.fullName,
      deal.valueCents,
      deal.currency,
      deal.paymentPlansCount,
      deal.paymentsCount,
    ),
  }));

  return (
    <WorkspaceShell>
      <header className="rounded-[28px] border border-[color:var(--border)] bg-[color:var(--surface)] p-5 shadow-[0_16px_40px_rgba(39,26,0,0.05)]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[color:rgba(39,26,0,0.12)] bg-[color:rgba(39,26,0,0.04)] px-3 py-1 text-[10px] font-medium uppercase tracking-[0.28em] text-[color:var(--muted)]">
              <LineChart className="size-3.5" />
              Rentals
            </div>
            <h1 className="mt-3 text-[clamp(2rem,2.2vw,3rem)] font-semibold tracking-[-0.04em]">
              {view === "table" ? "All rentals" : "Rental pipeline"}
            </h1>
            <p className="mt-2 max-w-2xl text-[14px] leading-7 text-[color:var(--muted)]">
              Track tenant interest, viewing progress, lease prep, and active tenancy in one place.
            </p>
          </div>
          <div className="ml-auto flex flex-wrap items-center justify-end gap-2">
            <Link
              href="/deals"
              className="inline-flex h-11 items-center gap-2 rounded-[999px] border border-[color:var(--border)] bg-[color:var(--surface-muted)] px-4 text-[13px] font-medium"
            >
              <ArrowUpRight className="size-4" />
              Sales pipeline
            </Link>
            <Link
              href="/deals/new"
              className="inline-flex h-11 items-center gap-2 rounded-[999px] border border-[color:var(--border)] bg-[color:var(--surface-muted)] px-4 text-[13px] font-medium"
            >
              <Plus className="size-4" />
              New deal
            </Link>
            <Link
              href="/"
              className="inline-flex h-11 items-center gap-2 rounded-[999px] border border-[color:var(--border)] bg-[color:var(--surface-muted)] px-4 text-[13px] font-medium"
            >
              <ArrowUpRight className="size-4" />
              Dashboard
            </Link>
            <Link
              href={view === "table" ? "/rentals" : "/rentals?view=table"}
              className="inline-flex h-11 items-center gap-2 rounded-[999px] border border-[color:var(--border)] bg-[color:var(--surface-muted)] px-4 text-[13px] font-medium"
            >
              <ArrowUpRight className="size-4" />
              {view === "table" ? "Kanban board" : "All rentals"}
            </Link>
          </div>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <div className="rounded-[18px] border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-4">
            <p className="text-[11px] text-[color:var(--muted)]">Open rentals</p>
            <p className="mt-2 text-[18px] font-semibold">{openDeals}</p>
          </div>
          <div className="rounded-[18px] border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-4">
            <p className="text-[11px] text-[color:var(--muted)]">Closed rentals</p>
            <p className="mt-2 text-[18px] font-semibold">{closedDeals}</p>
          </div>
          <div className="rounded-[18px] border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-4">
            <p className="text-[11px] text-[color:var(--muted)]">Rental pipeline value</p>
            <p className="mt-2 text-[18px] font-semibold">{formatMoney(totalValue, "ZMW")}</p>
          </div>
        </div>
      </header>

      {view === "table" ? (
        <DealsTable rows={rows} />
      ) : (
        <DealsKanbanBoard
          boardTitle="Rental pipeline"
          boardDescription="Use the shared pipeline shell for rentals while the board framework stays aligned with the sales workflow and future lease-specific boards."
          searchPlaceholder="Search rentals, properties, clients, stages..."
          toggleLabel="All rentals"
          emptyStateTitle="No rentals found"
          emptyStateDescription="Try a broader search or add the first rental deal."
          workflow={rentalDealWorkflow}
          rows={boardRows}
          listings={options.listings}
          clients={options.clients}
          tableHref="/rentals?view=table"
        />
      )}
    </WorkspaceShell>
  );
}
