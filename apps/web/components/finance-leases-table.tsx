"use client";

import { SearchableTable } from "./searchable-table";

type LeaseRow = {
  id: string;
  leaseName: string;
  tenant: string;
  listing: string;
  rent: string;
  charges: string;
  searchIndex: string;
};

type FinanceLeasesTableProps = {
  rows: LeaseRow[];
};

export function FinanceLeasesTable({ rows }: FinanceLeasesTableProps) {
  return (
    <SearchableTable
      heading="Leases"
      description="Search by lease name, tenant, property, rent, or charge count."
      searchPlaceholder="Search leases"
      emptyMessage="No leases match your search."
      rows={rows}
      columns={["Lease", "Tenant", "Listing", "Rent", "Charges"]}
      colSpan={5}
      renderRow={(lease, _index, isLast) => (
        <tr key={lease.id} className={!isLast ? "border-b border-[color:var(--border)]" : ""}>
          <td className="px-4 py-3.5 font-medium">{lease.leaseName}</td>
          <td className="px-4 py-3.5 text-[color:var(--muted)]">{lease.tenant}</td>
          <td className="px-4 py-3.5 text-[color:var(--muted)]">{lease.listing}</td>
          <td className="px-4 py-3.5 text-[color:var(--muted)]">{lease.rent}</td>
          <td className="px-4 py-3.5 text-[color:var(--muted)]">{lease.charges}</td>
        </tr>
      )}
    />
  );
}
