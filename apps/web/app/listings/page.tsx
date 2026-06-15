import "../../lib/load-contour-env";
import Link from "next/link";
import { ArrowLeft, Plus } from "lucide-react";
import { WorkspaceShell } from "../../components/workspace-shell";
import { ListingsTable } from "../../components/listings-table";
import { buildSearchIndex } from "../../lib/table-search";
import { getCachedListingsPageData } from "../../lib/route-data";

export const dynamic = "force-dynamic";

function formatMoney(amountCents: number, currency: string) {
  return new Intl.NumberFormat("en-ZM", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amountCents / 100);
}

export default async function ListingsPage() {
  const listings = await getCachedListingsPageData();
  const rows = listings.map((listing) => ({
    id: listing.id,
    href: `/listings/${listing.id}`,
    title: listing.title,
    propertyType: listing.propertyType,
    status: listing.status,
    statusLabel: listing.status.replaceAll("_", " "),
    locationSummary:
      listing.address ||
      [listing.locationArea, listing.cityTown, listing.province].filter(Boolean).join(", ") ||
      (listing.latitude != null && listing.longitude != null
        ? `${listing.latitude.toFixed(4)}, ${listing.longitude.toFixed(4)}`
        : "Unset"),
    description: listing.description ?? "Unset",
    price: formatMoney(listing.priceCents, listing.currency),
    priceCents: listing.priceCents,
    ownerName: listing.ownerName ?? "Unassigned",
    updatedAt: new Date(listing.updatedAt).toLocaleDateString(),
    updatedAtSort: new Date(listing.updatedAt).toISOString(),
    searchIndex: buildSearchIndex(
      listing.title,
      listing.propertyType,
      listing.status,
      listing.address,
      listing.description,
      listing.locationArea,
      listing.cityTown,
      listing.province,
      listing.latitude,
      listing.longitude,
      listing.priceCents,
      listing.currency,
      listing.ownerName,
      new Date(listing.updatedAt).toLocaleDateString(),
    ),
  }));

  return (
    <WorkspaceShell>
        <header className="rounded-[28px] border border-[color:var(--border)] bg-[color:var(--surface)] p-5 shadow-[0_16px_40px_rgba(39,26,0,0.05)]">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-[color:rgba(39,26,0,0.12)] bg-[color:rgba(39,26,0,0.04)] px-3 py-1 text-[10px] font-medium uppercase tracking-[0.28em] text-[color:var(--muted)]">
                Listings
              </div>
              <h1 className="mt-3 text-[clamp(2rem,2.2vw,3rem)] font-semibold tracking-[-0.04em]">Properties</h1>
              <p className="mt-2 max-w-2xl text-[14px] leading-7 text-[color:var(--muted)]">
                Browse the current properties, open a record, or create the next listing without leaving the app.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/listings/map"
                className="inline-flex h-11 items-center gap-2 rounded-[999px] border border-[color:var(--border)] bg-[color:var(--surface-muted)] px-4 text-[13px] font-medium"
              >
                Map
              </Link>
              <Link
                href="/"
                className="inline-flex h-11 items-center gap-2 rounded-[999px] border border-[color:var(--border)] bg-[color:var(--surface-muted)] px-4 text-[13px] font-medium"
              >
                <ArrowLeft className="size-4" />
                Back to dashboard
              </Link>
              <Link
                href="/listings/new"
                className="inline-flex h-11 items-center gap-2 rounded-[999px] bg-[color:var(--primary)] px-4 text-[13px] font-medium text-[color:var(--primary-foreground)]"
              >
                <Plus className="size-4" />
                New listing
              </Link>
            </div>
          </div>
        </header>

        <ListingsTable rows={rows} />
    </WorkspaceShell>
  );
}
