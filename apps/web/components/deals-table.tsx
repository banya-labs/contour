"use client";

import { useRouter } from "next/navigation";
import { SearchableTable } from "./searchable-table";
import { getDealStageLabel } from "../lib/deal-workflows";

type DealRow = {
  id: string;
  title: string;
  status: string;
  stage: string;
  request: string;
  listing: string;
  client: string;
  value: string;
  valueCents: number;
  plans: string;
  plansCount: number;
  payments: string;
  paymentsCount: number;
  searchIndex: string;
};

type DealsTableProps = {
  rows: DealRow[];
};

export function DealsTable({ rows }: DealsTableProps) {
  const router = useRouter();

  return (
    <SearchableTable
      heading="Deals"
      description="Search by deal title, enquiry request, stage, linked listing, client, value, or activity counts."
      searchPlaceholder="Search deals"
      emptyMessage="No deals match your search."
      rows={rows}
      columns={[
        { key: "title", label: "Deal", sortValue: (deal) => deal.title },
        { key: "stage", label: "Stage", sortValue: (deal) => deal.stage },
        { key: "request", label: "Request", sortValue: (deal) => deal.request },
        { key: "listing", label: "Listing", sortValue: (deal) => deal.listing },
        { key: "client", label: "Client", sortValue: (deal) => deal.client },
        { key: "value", label: "Value", sortValue: (deal) => deal.valueCents },
        { key: "plans", label: "Plans", sortValue: (deal) => deal.plansCount },
      ]}
      colSpan={7}
      renderRow={(deal) => (
        <tr
          key={deal.id}
          role="button"
          tabIndex={0}
          aria-label={`Open ${deal.title}`}
          onClick={() => router.push(`/deals/${deal.id}`)}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              router.push(`/deals/${deal.id}`);
            }
          }}
          className="group cursor-pointer border-b border-[color:var(--border)] transition-all duration-150 hover:-translate-y-[1px] hover:bg-[color:rgba(39,26,0,0.03)] hover:shadow-[inset_0_0_0_1px_rgba(39,26,0,0.05)] focus-visible:bg-[color:rgba(39,26,0,0.05)] focus-visible:outline-none"
        >
          <td className="px-4 py-3.5">
            <div className="font-medium text-[color:var(--foreground)]">{deal.title}</div>
            <div className="mt-1 text-[11px] text-[color:var(--muted)]">{deal.status}</div>
          </td>
          <td className="px-4 py-3.5 text-[color:var(--muted)] transition-colors group-hover:text-[color:var(--foreground)]">
            {getDealStageLabel(deal.stage)}
          </td>
          <td className="px-4 py-3.5 text-[color:var(--muted)] transition-colors group-hover:text-[color:var(--foreground)]">
            {deal.request}
          </td>
          <td className="px-4 py-3.5 text-[color:var(--muted)] transition-colors group-hover:text-[color:var(--foreground)]">
            {deal.listing}
          </td>
          <td className="px-4 py-3.5 text-[color:var(--muted)] transition-colors group-hover:text-[color:var(--foreground)]">
            {deal.client}
          </td>
          <td className="px-4 py-3.5 text-[color:var(--muted)] transition-colors group-hover:text-[color:var(--foreground)]">
            {deal.value}
          </td>
          <td className="px-4 py-3.5 text-[color:var(--muted)] transition-colors group-hover:text-[color:var(--foreground)]">
            {deal.plans} plans, {deal.payments} payments
          </td>
        </tr>
      )}
    />
  );
}
