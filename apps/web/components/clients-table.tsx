"use client";

import { SearchableTable } from "./searchable-table";

type ClientRow = {
  id: string;
  fullName: string;
  contact: string;
  status: string;
  segment: string;
  budget: string;
  preferredLocation: string;
  dealsCount: string;
  searchIndex: string;
};

type ClientsTableProps = {
  rows: ClientRow[];
};

export function ClientsTable({ rows }: ClientsTableProps) {
  return (
    <SearchableTable
      heading="Clients"
      description="Search by client name, contact details, segment, status, budget, location, or deal count."
      searchPlaceholder="Search clients"
      emptyMessage="No clients match your search."
      rows={rows}
      columns={["Client", "Status", "Segment", "Budget", "Preferred location", "Deals"]}
      colSpan={6}
      renderRow={(client, _index, isLast) => (
        <tr key={client.id} className={!isLast ? "border-b border-[color:var(--border)]" : ""}>
          <td className="px-4 py-3.5">
            <div className="font-medium">{client.fullName}</div>
            <div className="mt-1 text-[11px] text-[color:var(--muted)]">{client.contact}</div>
          </td>
          <td className="px-4 py-3.5 text-[color:var(--muted)]">{client.status}</td>
          <td className="px-4 py-3.5 text-[color:var(--muted)]">{client.segment}</td>
          <td className="px-4 py-3.5 text-[color:var(--muted)]">{client.budget}</td>
          <td className="px-4 py-3.5 text-[color:var(--muted)]">{client.preferredLocation}</td>
          <td className="px-4 py-3.5 text-[color:var(--muted)]">{client.dealsCount}</td>
        </tr>
      )}
    />
  );
}
