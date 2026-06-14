import "../../lib/load-contour-env";
import Link from "next/link";
import { ArrowLeft, Plus } from "lucide-react";
import { getPrismaClient, listContourListings } from "@contour/db";
import { WorkspaceShell } from "../../components/workspace-shell";

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

export default async function ListingsPage() {
  const prisma = getPrismaClient();
  const listings = await listContourListings(prisma, 100);

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

        <section className="rounded-[28px] border border-[color:var(--border)] bg-[color:var(--surface)] p-5 shadow-[0_16px_40px_rgba(39,26,0,0.05)]">
          <div className="overflow-hidden rounded-[22px] border border-[color:var(--border)]">
            <table className="min-w-full border-collapse text-left text-[13px]">
              <thead className="bg-[color:var(--surface-muted)] text-[color:var(--muted)]">
                <tr>
                  <th className="px-4 py-3 font-medium">Asset</th>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Price</th>
                  <th className="px-4 py-3 font-medium">Owner</th>
                  <th className="px-4 py-3 font-medium">Updated</th>
                </tr>
              </thead>
              <tbody>
                {listings.length ? (
                  listings.map((listing, index) => (
                    <tr
                      key={listing.id}
                      className={index !== listings.length - 1 ? "border-b border-[color:var(--border)]" : ""}
                    >
                      <td className="px-4 py-3.5 font-medium">
                        <Link href={`/listings/${listing.id}`} className="underline-offset-4 hover:underline">
                          {listing.title}
                        </Link>
                      </td>
                      <td className="px-4 py-3.5 text-[color:var(--muted)]">{listing.propertyType}</td>
                      <td className="px-4 py-3.5">
                        <span className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${statusClass(listing.status)}`}>
                          {listing.status.replaceAll("_", " ")}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">{formatMoney(listing.priceCents, listing.currency)}</td>
                      <td className="px-4 py-3.5 text-[color:var(--muted)]">{listing.ownerName ?? "Unassigned"}</td>
                      <td className="px-4 py-3.5 text-[color:var(--muted)]">
                        {new Date(listing.updatedAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="px-4 py-8 text-center text-[13px] text-[color:var(--muted)]" colSpan={6}>
                      No listings yet. Create the first record to start the inventory workflow.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
    </WorkspaceShell>
  );
}
