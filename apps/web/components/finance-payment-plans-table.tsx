"use client";

import { SearchableTable } from "./searchable-table";

type PaymentPlanRow = {
  id: string;
  planName: string;
  client: string;
  deal: string;
  status: string;
  principal: string;
  downPayment: string;
  scheduleItems: string;
  searchIndex: string;
};

type FinancePaymentPlansTableProps = {
  rows: PaymentPlanRow[];
};

export function FinancePaymentPlansTable({ rows }: FinancePaymentPlansTableProps) {
  return (
    <SearchableTable
      heading="Payment plans"
      description="Search by plan name, client, deal, status, principal, down payment, or schedule count."
      searchPlaceholder="Search payment plans"
      emptyMessage="No payment plans match your search."
      rows={rows}
      columns={["Plan", "Status", "Client", "Deal", "Principal", "Schedule"]}
      colSpan={6}
      renderRow={(plan, _index, isLast) => (
        <tr key={plan.id} className={!isLast ? "border-b border-[color:var(--border)]" : ""}>
          <td className="px-4 py-3.5">
            <div className="font-medium">{plan.planName}</div>
            <div className="mt-1 text-[11px] text-[color:var(--muted)]">{plan.status}</div>
          </td>
          <td className="px-4 py-3.5 text-[color:var(--muted)]">{plan.status}</td>
          <td className="px-4 py-3.5 text-[color:var(--muted)]">{plan.client}</td>
          <td className="px-4 py-3.5 text-[color:var(--muted)]">{plan.deal}</td>
          <td className="px-4 py-3.5 text-[color:var(--muted)]">
            {plan.principal}
            <div className="mt-1">{plan.downPayment}</div>
          </td>
          <td className="px-4 py-3.5 text-[color:var(--muted)]">{plan.scheduleItems}</td>
        </tr>
      )}
    />
  );
}
