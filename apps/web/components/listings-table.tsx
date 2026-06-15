"use client";

import { ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { SearchableTable } from "./searchable-table";

type ListingRow = {
  id: string;
  href: string;
  title: string;
  propertyType: string;
  status: string;
  statusLabel: string;
  locationSummary: string;
  description: string;
  price: string;
  priceCents: number;
  ownerName: string;
  updatedAt: string;
  updatedAtSort: string;
  searchIndex: string;
};

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

type ListingsTableProps = {
  rows: ListingRow[];
};

export function ListingsTable({ rows }: ListingsTableProps) {
  const router = useRouter();

  return (
    <SearchableTable
      heading="Properties"
      description="Search by title, description, owner, location, type, status, price, or updated date."
      searchPlaceholder="Search properties"
      emptyMessage="No property records match your search."
      rows={rows}
      columns={[
        { key: "title", label: "Asset", sortValue: (listing) => listing.title },
        { key: "description", label: "Description", sortValue: (listing) => listing.description },
        { key: "locationSummary", label: "Location", sortValue: (listing) => listing.locationSummary },
        { key: "propertyType", label: "Type", sortValue: (listing) => listing.propertyType },
        { key: "statusLabel", label: "Status", sortValue: (listing) => listing.statusLabel },
        { key: "price", label: "Price", sortValue: (listing) => listing.priceCents },
        { key: "ownerName", label: "Owner", sortValue: (listing) => listing.ownerName },
        { key: "updatedAt", label: "Updated", sortValue: (listing) => listing.updatedAtSort },
      ]}
      colSpan={8}
      renderRow={(listing, _index, isLast) => (
        <tr
          key={listing.id}
          role="link"
          tabIndex={0}
          onClick={() => router.push(listing.href)}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              router.push(listing.href);
            }
          }}
          className={`group cursor-pointer transition-colors hover:bg-[color:rgba(39,26,0,0.035)] focus-visible:bg-[color:rgba(39,26,0,0.035)] focus-visible:outline-none ${
            !isLast ? "border-b border-[color:var(--border)]" : ""
          }`}
        >
          <td className="px-4 py-3.5 font-medium">
            <div className="flex items-center gap-3">
              <span className="underline-offset-4 group-hover:underline group-focus-visible:underline">{listing.title}</span>
              <span className="inline-flex items-center gap-1 rounded-full border border-[color:var(--border)] bg-[color:var(--surface-muted)] px-2 py-1 text-[10px] font-medium text-[color:var(--muted)] opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                View
                <ChevronRight className="size-3" />
              </span>
            </div>
          </td>
          <td className="px-4 py-3.5 text-[color:var(--muted)]">{listing.description}</td>
          <td className="px-4 py-3.5 text-[color:var(--muted)]">{listing.locationSummary}</td>
          <td className="px-4 py-3.5 text-[color:var(--muted)]">{listing.propertyType}</td>
          <td className="px-4 py-3.5">
            <span className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${statusClass(listing.status)}`}>
              {listing.statusLabel}
            </span>
          </td>
          <td className="px-4 py-3.5">{listing.price}</td>
          <td className="px-4 py-3.5 text-[color:var(--muted)]">{listing.ownerName}</td>
          <td className="px-4 py-3.5 text-[color:var(--muted)]">{listing.updatedAt}</td>
        </tr>
      )}
    />
  );
}
