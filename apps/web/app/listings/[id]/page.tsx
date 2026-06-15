import "../../../lib/load-contour-env";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Pencil } from "lucide-react";
import { getContourListingWithDocuments, getPrismaClient } from "@contour/db";
import { WorkspaceShell } from "../../../components/workspace-shell";
import { PropertyLocationMap } from "../../../components/property-location-map";
import { ListingAttachmentsPanel } from "../../../components/listing-attachments-panel";
import { pickPrimaryListingImage } from "../../../lib/listing-attachments";

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
  params: Promise<{
    id: string;
  }>;
};

export default async function ListingDetailPage({ params }: ListingPageProps) {
  const { id } = await params;
  const prisma = getPrismaClient();
  const listing = await getContourListingWithDocuments(prisma, id);

  if (!listing) {
    notFound();
  }

  const primaryImageUrl = pickPrimaryListingImage(listing.documents);

  return (
    <WorkspaceShell>
      <div className="mx-auto max-w-[1200px] space-y-4">
        <Link
          href="/listings"
          className="inline-flex h-10 items-center gap-2 rounded-[999px] border border-[color:var(--border)] bg-[color:var(--surface)] px-4 text-[13px] font-medium"
        >
          <ArrowLeft className="size-4" />
          Back to properties
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
            <div className="rounded-[18px] border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-4 md:col-span-2 xl:col-span-1">
              <p className="text-[11px] text-[color:var(--muted)]">Address</p>
              <p className="mt-2 text-[18px] font-semibold">{listing.address ?? "Unset"}</p>
            </div>
            <div className="rounded-[18px] border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-4">
              <p className="text-[11px] text-[color:var(--muted)]">Updated</p>
              <p className="mt-2 text-[18px] font-semibold">{new Date(listing.updatedAt).toLocaleDateString()}</p>
            </div>
            <div className="rounded-[18px] border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-4">
              <p className="text-[11px] text-[color:var(--muted)]">Province</p>
              <p className="mt-2 text-[18px] font-semibold">{listing.province ?? "Unset"}</p>
            </div>
            <div className="rounded-[18px] border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-4">
              <p className="text-[11px] text-[color:var(--muted)]">City / Town</p>
              <p className="mt-2 text-[18px] font-semibold">{listing.cityTown ?? "Unset"}</p>
            </div>
            <div className="rounded-[18px] border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-4">
              <p className="text-[11px] text-[color:var(--muted)]">Coordinates</p>
              <p className="mt-2 text-[18px] font-semibold">
                {listing.latitude != null && listing.longitude != null
                  ? `${listing.latitude.toFixed(4)}, ${listing.longitude.toFixed(4)}`
                  : "Unset"}
              </p>
            </div>
          </div>

          <div className="mt-4 rounded-[22px] border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-4">
            <p className="text-[11px] uppercase tracking-[0.24em] text-[color:var(--muted)]">Description</p>
            <p className="mt-2 text-[14px] leading-7 text-[color:var(--foreground)]">
              {listing.description?.trim() || "No description has been added yet."}
            </p>
          </div>
        </section>

        <section className="grid gap-4 xl:grid-cols-[0.8fr_1.2fr]">
          <article className="space-y-3 rounded-[28px] border border-[color:var(--border)] bg-[color:var(--surface)] p-5 shadow-[0_16px_40px_rgba(39,26,0,0.05)]">
            <p className="text-[10px] uppercase tracking-[0.28em] text-[color:var(--muted)]">Preview</p>
            <h2 className="mt-2 text-[20px] font-semibold tracking-[-0.03em]">Property thumbnail</h2>
            {primaryImageUrl ? (
              <img
                src={primaryImageUrl}
                alt={listing.title}
                className="aspect-[4/3] w-full rounded-[22px] border border-[color:var(--border)] object-cover"
              />
            ) : (
              <div className="flex min-h-[260px] items-center justify-center rounded-[22px] border border-[color:var(--border)] bg-[color:var(--surface-muted)] text-[13px] text-[color:var(--muted)]">
                No property image uploaded yet.
              </div>
            )}
          </article>

          <PropertyLocationMap
            latitude={listing.latitude}
            longitude={listing.longitude}
            className="min-h-[420px]"
            interactive={false}
          />
        </section>

        <ListingAttachmentsPanel listingId={listing.id} returnTo={`/listings/${listing.id}`} attachments={listing.documents} />
      </div>
    </WorkspaceShell>
  );
}
