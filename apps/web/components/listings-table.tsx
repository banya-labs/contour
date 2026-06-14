"use client";

import Link from "next/link";
import { SearchableTable } from "./searchable-table";

type ListingRow = {
  id: string;
  href: string;
  title: string;
  propertyType: string;
  status: string;
  statusLabel: string;
  price: string;
  ownerName: string;
  updatedAt: string;
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
  return (
    <SearchableTable
      heading="Inventory"
      description="Search by title, owner, type, status, price, or updated date."
      searchPlaceholder="Search inventory"
      emptyMessage="No inventory records match your search."
      rows={rows}
      columns={["Asset", "Type", "Status", "Price", "Owner", "Updated"]}
      colSpan={6}
      renderRow={(listing, _index, isLast) => (
        <tr key={listing.id} className={!isLast ? "border-b border-[color:var(--border)]" : ""}>
          <td className="px-4 py-3.5 font-medium">
            <Link href={listing.href} className="underline-offset-4 hover:underline">
              {listing.title}
            </Link>
          </td>
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
