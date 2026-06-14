"use client";

import { SearchableTable } from "./searchable-table";

type DealRow = {
  id: string;
  title: string;
  status: string;
  stage: string;
  listing: string;
  client: string;
  value: string;
  plans: string;
  payments: string;
  searchIndex: string;
};

type DealsTableProps = {
  rows: DealRow[];
};

export function DealsTable({ rows }: DealsTableProps) {
  return (
    <SearchableTable
      heading="Deals"
      description="Search by deal title, stage, linked listing, client, value, or activity counts."
      searchPlaceholder="Search deals"
      emptyMessage="No deals match your search."
      rows={rows}
      columns={["Deal", "Stage", "Listing", "Client", "Value", "Plans"]}
      colSpan={6}
      renderRow={(deal, _index, isLast) => (
        <tr key={deal.id} className={!isLast ? "border-b border-[color:var(--border)]" : ""}>
          <td className="px-4 py-3.5">
            <div className="font-medium">{deal.title}</div>
            <div className="mt-1 text-[11px] text-[color:var(--muted)]">{deal.status}</div>
          </td>
          <td className="px-4 py-3.5 text-[color:var(--muted)]">{deal.stage}</td>
          <td className="px-4 py-3.5 text-[color:var(--muted)]">{deal.listing}</td>
          <td className="px-4 py-3.5 text-[color:var(--muted)]">{deal.client}</td>
          <td className="px-4 py-3.5 text-[color:var(--muted)]">{deal.value}</td>
          <td className="px-4 py-3.5 text-[color:var(--muted)]">
            {deal.plans} plans, {deal.payments} payments
          </td>
        </tr>
      )}
    />
  );
}
