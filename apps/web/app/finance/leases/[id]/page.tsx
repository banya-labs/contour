import "../../../../lib/load-contour-env";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, House } from "lucide-react";
import { getPrismaClient } from "@contour/db";
import { WorkspaceShell } from "../../../../components/workspace-shell";
import { LeaseDetailForm } from "../../../../components/lease-detail-form";
import { getCachedLookupOptions } from "../../../../lib/route-data";

export const dynamic = "force-dynamic";

function formatMoney(amount: number, currency: string) {
  return new Intl.NumberFormat("en-ZM", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export default async function LeaseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const prisma = getPrismaClient();
  const [lease, options] = await Promise.all([
    prisma.rentalLease.findUnique({
      where: { id },
      include: {
        listing: { select: { id: true, title: true } },
        tenantClient: { select: { id: true, fullName: true } },
        rentalCharges: { select: { id: true, status: true } },
      },
    }),
    getCachedLookupOptions(),
  ]);

  if (!lease) {
    notFound();
  }

  return (
    <WorkspaceShell>
      <header className="rounded-[28px] border border-[color:var(--border)] bg-[color:var(--surface)] p-5 shadow-[0_16px_40px_rgba(39,26,0,0.05)]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[color:rgba(39,26,0,0.12)] bg-[color:rgba(39,26,0,0.04)] px-3 py-1 text-[10px] font-medium uppercase tracking-[0.28em] text-[color:var(--muted)]">
              <House className="size-3.5" />
              Leases
            </div>
            <h1 className="mt-3 text-[clamp(2rem,2.2vw,3rem)] font-semibold tracking-[-0.04em]">{lease.leaseName}</h1>
            <p className="mt-2 max-w-2xl text-[14px] leading-7 text-[color:var(--muted)]">
              Review the lease, move it through the workflow, and update the linked property or tenant.
            </p>
          </div>
          <Link
            href="/finance/leases"
            className="inline-flex h-11 items-center gap-2 rounded-[999px] border border-[color:var(--border)] bg-[color:var(--surface-muted)] px-4 text-[13px] font-medium"
          >
            <ArrowLeft className="size-4" />
            Back to leases
          </Link>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <div className="rounded-[18px] border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-4">
            <p className="text-[11px] text-[color:var(--muted)]">Listing</p>
            <p className="mt-2 text-[18px] font-semibold">{lease.listing.title}</p>
          </div>
          <div className="rounded-[18px] border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-4">
            <p className="text-[11px] text-[color:var(--muted)]">Tenant</p>
            <p className="mt-2 text-[18px] font-semibold">{lease.tenantClient.fullName}</p>
          </div>
          <div className="rounded-[18px] border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-4">
            <p className="text-[11px] text-[color:var(--muted)]">Rent</p>
            <p className="mt-2 text-[18px] font-semibold">{formatMoney(Number(lease.rentAmount), lease.currency)} / mo</p>
          </div>
        </div>
      </header>

      <LeaseDetailForm
        lease={{
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
        }}
        listings={options.listings}
        clients={options.clients}
      />
    </WorkspaceShell>
  );
}
