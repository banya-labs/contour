import "../../lib/load-contour-env";
import Link from "next/link";
import { ArrowLeft, Plus } from "lucide-react";
import { getPrismaClient, listContourListings } from "@contour/db";
import { WorkspaceShell } from "../../components/workspace-shell";
import { ListingsTable } from "../../components/listings-table";
import { buildSearchIndex } from "../../lib/table-search";

export const dynamic = "force-dynamic";

function formatMoney(amountCents: number, currency: string) {
  return new Intl.NumberFormat("en-ZM", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amountCents / 100);
}

export default async function ListingsPage() {
  const prisma = getPrismaClient();
  const listings = await listContourListings(prisma, 100);
  const rows = listings.map((listing) => ({
    id: listing.id,
    href: `/listings/${listing.id}`,
    title: listing.title,
    propertyType: listing.propertyType,
    status: listing.status,
    statusLabel: listing.status.replaceAll("_", " "),
    price: formatMoney(listing.priceCents, listing.currency),
    ownerName: listing.ownerName ?? "Unassigned",
    updatedAt: new Date(listing.updatedAt).toLocaleDateString(),
    searchIndex: buildSearchIndex(
      listing.title,
      listing.propertyType,
      listing.status,
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
              <h1 className="mt-3 text-[clamp(2rem,2.2vw,3rem)] font-semibold tracking-[-0.04em]">Inventory</h1>
              <p className="mt-2 max-w-2xl text-[14px] leading-7 text-[color:var(--muted)]">
                Browse the current inventory, open a record, or create the next listing without leaving the app.
              </p>
            </div>

            <div className="flex items-center gap-2">
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
