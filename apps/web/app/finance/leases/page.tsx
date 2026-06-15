import "../../../lib/load-contour-env";
import Link from "next/link";
import { ArrowUpRight, House } from "lucide-react";
import { WorkspaceShell } from "../../../components/workspace-shell";
import { FinanceLeasesTable } from "../../../components/finance-leases-table";
import { buildSearchIndex } from "../../../lib/table-search";
import { LeasesKanbanBoard } from "../../../components/leases-kanban-board";
import { getLeaseStageLabel, leaseWorkflow } from "../../../lib/lease-workflows";
import { getCachedFinanceLeasesPageData, getCachedLookupOptions } from "../../../lib/route-data";

export const dynamic = "force-dynamic";

type LeasesPageProps = {
  searchParams?: Promise<{
    view?: string;
  }>;
};

function formatMoney(amount: number, currency: string) {
  return new Intl.NumberFormat("en-ZM", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export default async function LeasesPage({ searchParams }: LeasesPageProps) {
  const resolvedSearchParams = await searchParams;
  const view = resolvedSearchParams?.view === "table" ? "table" : "board";
  const [leases, options] = await Promise.all([getCachedFinanceLeasesPageData(), getCachedLookupOptions()]);
  const activeLeases = leases.filter((lease) => lease.status === "active").length;
  const closedLeases = leases.filter((lease) => lease.status === "ended").length;
  const rentTotals = leases.reduce<Record<string, number>>((totals, lease) => {
    totals[lease.currency] = (totals[lease.currency] ?? 0) + Number(lease.rentAmount);
    return totals;
  }, {});
  const rentSummary = Object.entries(rentTotals)
    .map(([currency, amount]) => `${currency} ${amount.toLocaleString("en-ZM", { maximumFractionDigits: 0 })}`)
    .join(" / ");

  const boardRows = leases.map((lease) => ({
    id: lease.id,
    leaseName: lease.leaseName,
    leaseStage: lease.leaseStage,
    status: lease.status,
    rentAmount: Number(lease.rentAmount),
    currency: lease.currency,
    billingDay: lease.billingDay,
    depositAmount: lease.depositAmount == null ? null : Number(lease.depositAmount),
    listingId: lease.listingId,
    tenantClientId: lease.tenantClientId,
    listing: lease.listing ? { id: lease.listingId, title: lease.listing.title } : null,
    tenantClient: lease.tenantClient
      ? { id: lease.tenantClientId, fullName: lease.tenantClient.fullName }
      : null,
    rentalChargesCount: lease.rentalCharges.length,
    searchIndex: buildSearchIndex(
      lease.leaseName,
      getLeaseStageLabel(lease.leaseStage),
      lease.status,
      lease.listing?.title,
      lease.tenantClient?.fullName,
      formatMoney(Number(lease.rentAmount), lease.currency),
      Number(lease.rentAmount),
      lease.currency,
      lease.billingDay,
      lease.depositAmount == null ? "" : Number(lease.depositAmount),
      lease.rentalCharges.length,
    ),
  }));
  const rows = leases.map((lease) => ({
    id: lease.id,
    leaseName: lease.leaseName,
    stage: getLeaseStageLabel(lease.leaseStage),
    status: lease.status,
    tenant: lease.tenantClient.fullName,
    listing: lease.listing.title,
    rent: `${formatMoney(Number(lease.rentAmount), lease.currency)} monthly`,
    rentAmount: Number(lease.rentAmount),
    charges: `${lease.rentalCharges.length} charges`,
    chargesCount: lease.rentalCharges.length,
    searchIndex: buildSearchIndex(
      lease.leaseName,
      lease.leaseStage,
      lease.status,
      lease.tenantClient.fullName,
      lease.listing.title,
      lease.rentAmount,
      lease.currency,
      lease.billingDay,
      lease.depositAmount ?? "",
      lease.rentalCharges.length,
    ),
  }));

  return (
    <WorkspaceShell>
      <header className="rounded-[28px] border border-[color:var(--border)] bg-[color:var(--surface)] p-5 shadow-[0_16px_40px_rgba(39,26,0,0.05)]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[color:rgba(39,26,0,0.12)] bg-[color:rgba(39,26,0,0.04)] px-3 py-1 text-[10px] font-medium uppercase tracking-[0.28em] text-[color:var(--muted)]">
              <House className="size-3.5" />
              Finance
            </div>
            <h1 className="mt-3 text-[clamp(2rem,2.2vw,3rem)] font-semibold tracking-[-0.04em]">
              {view === "table" ? "All leases" : "Lease pipeline"}
            </h1>
            <p className="mt-2 max-w-2xl text-[14px] leading-7 text-[color:var(--muted)]">
              Track enquiry, screening, signing, and active tenancy in one operational board.
            </p>
          </div>
          <div className="ml-auto flex flex-wrap items-center justify-end gap-2">
            <Link
              href="/"
              className="inline-flex h-11 items-center gap-2 rounded-[999px] border border-[color:var(--border)] bg-[color:var(--surface-muted)] px-4 text-[13px] font-medium"
            >
              <ArrowUpRight className="size-4" />
              Dashboard
            </Link>
            <Link
              href={view === "table" ? "/finance/leases" : "/finance/leases?view=table"}
              className="inline-flex h-11 items-center gap-2 rounded-[999px] border border-[color:var(--border)] bg-[color:var(--surface-muted)] px-4 text-[13px] font-medium"
            >
              <ArrowUpRight className="size-4" />
              {view === "table" ? "Kanban board" : "All leases"}
            </Link>
          </div>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <div className="rounded-[18px] border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-4">
            <p className="text-[11px] text-[color:var(--muted)]">Active leases</p>
            <p className="mt-2 text-[18px] font-semibold">{activeLeases}</p>
          </div>
          <div className="rounded-[18px] border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-4">
            <p className="text-[11px] text-[color:var(--muted)]">Closed leases</p>
            <p className="mt-2 text-[18px] font-semibold">{closedLeases}</p>
          </div>
          <div className="rounded-[18px] border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-4">
            <p className="text-[11px] text-[color:var(--muted)]">Monthly rent roll</p>
            <p className="mt-2 text-[18px] font-semibold">{rentSummary || "No rent data"}</p>
          </div>
        </div>
      </header>

      {view === "table" ? (
        <FinanceLeasesTable rows={rows} />
      ) : (
        <LeasesKanbanBoard
          boardTitle="Lease workflow"
          boardDescription="Search across the lease, linked property, tenant, stage, rent, and charge history. Drag a card to move it between stages, or open it for the full record."
          searchPlaceholder="Search leases, listings, tenants, stages..."
          toggleLabel="All leases"
          emptyStateTitle="No leases found"
          emptyStateDescription="Try a broader search or clear the filter to bring the board back."
          workflow={leaseWorkflow}
          rows={boardRows}
          listings={options.listings}
          clients={options.clients}
          tableHref="/finance/leases?view=table"
        />
      )}
    </WorkspaceShell>
  );
}
