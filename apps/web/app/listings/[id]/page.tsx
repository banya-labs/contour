import "../../../lib/load-contour-env";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Pencil } from "lucide-react";
import { getContourListing, getPrismaClient } from "@contour/db";
import { WorkspaceShell } from "../../../components/workspace-shell";

export const dynamic = "force-dynamic";

function formatMoney(amountCents: number, currency: string) {
  return new Intl.NumberFormat("en-ZM", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amountCents / 100);
}

function statusClass(status: string) {
  switch (status) {
    case "available":
      return "bg-[color:rgba(47,109,68,0.10)] text-[color:var(--success)]";
    case "reserved":
      return "bg-[color:rgba(148,98,29,0.12)] text-[color:var(--warning)]";
    case "sold":
      return "bg-[color:rgba(141,43,31,0.10)] text-[color:var(--danger)]";
    default:
      return "bg-[color:rgba(93,90,132,0.10)] text-[color:var(--info)]";
  }
}

type ListingPageProps = {
  params: {
    id: string;
  };
};

export default async function ListingDetailPage({ params }: ListingPageProps) {
  const prisma = getPrismaClient();
  const listing = await getContourListing(prisma, params.id);

  if (!listing) {
    notFound();
  }

  return (
    <WorkspaceShell>
      <div className="mx-auto max-w-[1200px] space-y-4">
        <Link
          href="/listings"
          className="inline-flex h-10 items-center gap-2 rounded-[999px] border border-[color:var(--border)] bg-[color:var(--surface)] px-4 text-[13px] font-medium"
        >
          <ArrowLeft className="size-4" />
          Back to inventory
        </Link>

        <section className="rounded-[28px] border border-[color:var(--border)] bg-[color:var(--surface)] p-6 shadow-[0_16px_40px_rgba(39,26,0,0.05)]">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-[10px] uppercase tracking-[0.28em] text-[color:var(--muted)]">Listing detail</p>
              <h1 className="mt-2 text-[clamp(2rem,2.2vw,3rem)] font-semibold tracking-[-0.04em]">{listing.title}</h1>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${statusClass(listing.status)}`}>
                  {listing.status.replaceAll("_", " ")}
                </span>
                <span className="rounded-full bg-[color:rgba(39,26,0,0.06)] px-2.5 py-1 text-[11px] font-medium text-[color:var(--muted)]">
                  {listing.propertyType}
                </span>
              </div>
            </div>

            <Link
              href={`/listings/${listing.id}/edit`}
              className="inline-flex h-11 items-center gap-2 rounded-[999px] bg-[color:var(--primary)] px-4 text-[13px] font-medium text-[color:var(--primary-foreground)]"
            >
              <Pencil className="size-4" />
              Edit listing
            </Link>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <div className="rounded-[18px] border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-4">
              <p className="text-[11px] text-[color:var(--muted)]">Price</p>
              <p className="mt-2 text-[18px] font-semibold">{formatMoney(listing.priceCents, listing.currency)}</p>
            </div>
            <div className="rounded-[18px] border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-4">
              <p className="text-[11px] text-[color:var(--muted)]">Owner</p>
              <p className="mt-2 text-[18px] font-semibold">{listing.ownerName ?? "Unassigned"}</p>
            </div>
            <div className="rounded-[18px] border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-4">
              <p className="text-[11px] text-[color:var(--muted)]">Updated</p>
              <p className="mt-2 text-[18px] font-semibold">{new Date(listing.updatedAt).toLocaleDateString()}</p>
            </div>
          </div>
        </section>
      </div>
    </WorkspaceShell>
  );
}
