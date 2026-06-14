import "../../../lib/load-contour-env";
import Link from "next/link";
import { ArrowLeft, House } from "lucide-react";
import { getPrismaClient } from "@contour/db";
import { WorkspaceShell } from "../../../components/workspace-shell";
import { FinanceLeasesTable } from "../../../components/finance-leases-table";
import { buildSearchIndex } from "../../../lib/table-search";

export const dynamic = "force-dynamic";

function formatMoney(amount: number, currency: string) {
  return new Intl.NumberFormat("en-ZM", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export default async function LeasesPage() {
  const prisma = getPrismaClient();
  const leases = await prisma.rentalLease.findMany({
    orderBy: { createdAt: "desc" },
    take: 24,
    include: {
      listing: { select: { title: true } },
      tenantClient: { select: { fullName: true } },
      rentalCharges: { select: { id: true, status: true } },
    },
  });
  const rows = leases.map((lease) => ({
    id: lease.id,
    leaseName: lease.leaseName,
    tenant: lease.tenantClient.fullName,
    listing: lease.listing.title,
    rent: `${formatMoney(Number(lease.rentAmount), lease.currency)} monthly`,
    charges: `${lease.rentalCharges.length} charges`,
    searchIndex: buildSearchIndex(
      lease.leaseName,
      lease.tenantClient.fullName,
      lease.listing.title,
      lease.rentAmount,
      lease.currency,
      lease.rentalCharges.length,
    ),
  }));

  return (
    <WorkspaceShell>
      <header className="rounded-[28px] border border-[color:var(--border)] bg-[color:var(--surface)] p-5 shadow-[0_16px_40px_rgba(39,26,0,0.05)]">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[color:rgba(39,26,0,0.12)] bg-[color:rgba(39,26,0,0.04)] px-3 py-1 text-[10px] font-medium uppercase tracking-[0.28em] text-[color:var(--muted)]">
              <House className="size-3.5" />
              Finance
            </div>
            <h1 className="mt-3 text-[clamp(2rem,2.2vw,3rem)] font-semibold tracking-[-0.04em]">Leases</h1>
            <p className="mt-2 max-w-2xl text-[14px] leading-7 text-[color:var(--muted)]">
              Monitor active rental agreements and the property-to-tenant linkage behind each record.
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

      <FinanceLeasesTable rows={rows} />
    </WorkspaceShell>
  );
}
