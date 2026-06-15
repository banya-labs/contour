"use client";

import { SearchableTable } from "./searchable-table";

type LeaseRow = {
  id: string;
  leaseName: string;
  stage: string;
  status: string;
  tenant: string;
  listing: string;
  rent: string;
  rentAmount: number;
  charges: string;
  chargesCount: number;
  searchIndex: string;
};

type FinanceLeasesTableProps = {
  rows: LeaseRow[];
};

export function FinanceLeasesTable({ rows }: FinanceLeasesTableProps) {
  return (
    <SearchableTable
      heading="Leases"
      description="Search by lease name, stage, tenant, property, rent, or charge count."
      searchPlaceholder="Search leases"
      emptyMessage="No leases match your search."
      rows={rows}
      columns={[
        { key: "leaseName", label: "Lease", sortValue: (lease) => lease.leaseName },
        { key: "stage", label: "Stage", sortValue: (lease) => lease.stage },
        { key: "status", label: "Status", sortValue: (lease) => lease.status },
        { key: "tenant", label: "Tenant", sortValue: (lease) => lease.tenant },
        { key: "listing", label: "Listing", sortValue: (lease) => lease.listing },
        { key: "rent", label: "Rent", sortValue: (lease) => lease.rentAmount },
        { key: "charges", label: "Charges", sortValue: (lease) => lease.chargesCount },
      ]}
      colSpan={7}
      renderRow={(lease, _index, isLast) => (
        <tr key={lease.id} className={!isLast ? "border-b border-[color:var(--border)]" : ""}>
          <td className="px-4 py-3.5 font-medium">{lease.leaseName}</td>
          <td className="px-4 py-3.5 text-[color:var(--muted)]">{lease.stage}</td>
          <td className="px-4 py-3.5 text-[color:var(--muted)]">{lease.status}</td>
          <td className="px-4 py-3.5 text-[color:var(--muted)]">{lease.tenant}</td>
          <td className="px-4 py-3.5 text-[color:var(--muted)]">{lease.listing}</td>
          <td className="px-4 py-3.5 text-[color:var(--muted)]">{lease.rent}</td>
          <td className="px-4 py-3.5 text-[color:var(--muted)]">{lease.charges}</td>
        </tr>
      )}
    />
  );
}
