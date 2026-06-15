import "../../lib/load-contour-env";
import Link from "next/link";
import { ArrowUpRight, LineChart, Plus } from "lucide-react";
import { getPrismaClient, listContourDealsPaginated } from "@contour/db";
import { WorkspaceShell } from "../../components/workspace-shell";
import { DealsTable } from "../../components/deals-table";
import { buildSearchIndex } from "../../lib/table-search";
import { DealsKanbanBoard } from "../../components/deals-kanban-board";
import { salesDealWorkflow, getDealStageLabel } from "../../lib/deal-workflows";
import { getCachedLookupOptions } from "../../lib/route-data";

export const dynamic = "force-dynamic";

type DealsPageProps = {
  searchParams?: Promise<{
    view?: string;
    page?: string;
  }>;
};

function formatMoney(amountCents: number, currency: string) {
  return new Intl.NumberFormat("en-ZM", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amountCents / 100);
}

function buildDealSearchIndex(deal: any) {
  return buildSearchIndex(
    deal.title,
    getDealStageLabel(deal.stage, deal.dealType),
    deal.status,
    deal.requestSummary,
    deal.preferredPropertyType,
    deal.preferredLocation,
    deal.preferredProvince,
    deal.preferredCityTown,
    deal.listingDescription,
    deal.listing?.title,
    deal.client?.fullName,
    formatMoney(deal.valueCents, deal.currency),
    deal.valueCents,
    deal.currency,
    deal.paymentPlansCount,
    deal.paymentsCount,
  );
}

export default async function DealsPage({ searchParams }: DealsPageProps) {
  const resolvedSearchParams = await searchParams;
  const view = resolvedSearchParams?.view === "table" ? "table" : "board";
  const page = parseInt(resolvedSearchParams?.page || "1", 10);
  const prisma = getPrismaClient();
  const [paginatedData, options] = await Promise.all([
    listContourDealsPaginated(prisma, { page, pageSize: 50, dealType: "sale" }),
    getCachedLookupOptions(),
  ]);

  const deals = paginatedData.deals;
  const openDeals = deals.filter((deal) => deal.status === "open").length;
  const wonDeals = deals.filter((deal) => deal.status === "won").length;
  const totalValue = deals.reduce((sum, deal) => sum + deal.valueCents, 0);

  // Build search index once, reuse for both views
  const dealsWithSearchIndex = deals.map((deal) => ({
    ...deal,
    searchIndex: buildDealSearchIndex(deal),
  }));

  const boardRows = dealsWithSearchIndex;

  const rows = dealsWithSearchIndex.map((deal) => {
    const request =
      deal.requestSummary ??
      deal.preferredPropertyType ??
      deal.preferredLocation ??
      deal.preferredCityTown ??
      deal.preferredProvince ??
      "No request captured";

    return {
      id: deal.id,
      title: deal.title,
      status: deal.status,
      stage: getDealStageLabel(deal.stage, deal.dealType),
      request,
      listing: deal.listing?.title ?? "Unset",
      client: deal.client?.fullName ?? "Unset",
      value: formatMoney(deal.valueCents, deal.currency),
      valueCents: deal.valueCents,
      plans: String(deal.paymentPlansCount),
      plansCount: deal.paymentPlansCount,
      payments: String(deal.paymentsCount),
      paymentsCount: deal.paymentsCount,
      searchIndex: deal.searchIndex,
    };
  });

  return (
    <WorkspaceShell>
      <header className="rounded-[28px] border border-[color:var(--border)] bg-[color:var(--surface)] p-5 shadow-[0_16px_40px_rgba(39,26,0,0.05)]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[color:rgba(39,26,0,0.12)] bg-[color:rgba(39,26,0,0.04)] px-3 py-1 text-[10px] font-medium uppercase tracking-[0.28em] text-[color:var(--muted)]">
              <LineChart className="size-3.5" />
              Deals
            </div>
            <h1 className="mt-3 text-[clamp(2rem,2.2vw,3rem)] font-semibold tracking-[-0.04em]">
              {view === "table" ? "All deals" : "Deal pipeline"}
            </h1>
            <p className="mt-2 max-w-2xl text-[14px] leading-7 text-[color:var(--muted)]">
              Watch the current pipeline, the client enquiry, the optional linked property, and the matching listings suggested for each deal.
            </p>
          </div>
          <div className="ml-auto flex flex-wrap items-center justify-end gap-2">
            <Link
              href="/rentals"
              className="inline-flex h-11 items-center gap-2 rounded-[999px] border border-[color:var(--border)] bg-[color:var(--surface-muted)] px-4 text-[13px] font-medium"
            >
              <ArrowUpRight className="size-4" />
              Rentals
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
              href={view === "table" ? "/deals" : "/deals?view=table"}
              className="inline-flex h-11 items-center gap-2 rounded-[999px] border border-[color:var(--border)] bg-[color:var(--surface-muted)] px-4 text-[13px] font-medium"
            >
              <ArrowUpRight className="size-4" />
              {view === "table" ? "Kanban board" : "All deals"}
            </Link>
          </div>
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
            <p className="mt-2 text-[18px] font-semibold">{formatMoney(totalValue, "ZMW")}</p>
          </div>
        </div>
      </header>

      {view === "table" ? (
        <>
          <DealsTable rows={rows} />
          {paginatedData.totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between rounded-[18px] border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-4">
              <p className="text-[13px] text-[color:var(--muted)]">
                Page {page} of {paginatedData.totalPages} ({paginatedData.total} total deals)
              </p>
              <div className="flex gap-2">
                {page > 1 && (
                  <Link
                    href={`/deals?view=table&page=${page - 1}`}
                    className="inline-flex h-9 items-center rounded-lg border border-[color:var(--border)] bg-[color:var(--surface)] px-3 text-[13px] font-medium hover:bg-[color:var(--surface-muted)]"
                  >
                    Previous
                  </Link>
                )}
                {page < paginatedData.totalPages && (
                  <Link
                    href={`/deals?view=table&page=${page + 1}`}
                    className="inline-flex h-9 items-center rounded-lg border border-[color:var(--border)] bg-[color:var(--surface)] px-3 text-[13px] font-medium hover:bg-[color:var(--surface-muted)]"
                  >
                    Next
                  </Link>
                )}
              </div>
            </div>
          )}
        </>
      ) : (
        <DealsKanbanBoard
          boardTitle="Open deal pipeline"
          boardDescription="Search across enquiries, matching requests, linked properties, clients, and stage metadata. Drag a card to move it between stages, or open it to edit the record on the full page."
          searchPlaceholder="Search deals, requests, properties, clients..."
          toggleLabel="All deals"
          emptyStateTitle="No deals found"
          emptyStateDescription="Try a broader search or clear the filter to bring the pipeline back."
          workflow={salesDealWorkflow}
          rows={boardRows}
          listings={options.listings}
          clients={options.clients}
          tableHref="/deals?view=table"
        />
      )}
    </WorkspaceShell>
  );
}
