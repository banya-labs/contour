"use client";

import { SearchableTable } from "./searchable-table";

type ReceiptRow = {
  id: string;
  receiptNumber: string;
  client: string;
  deal: string;
  amount: string;
  method: string;
  searchIndex: string;
};

type FinancePaymentReceiptsTableProps = {
  rows: ReceiptRow[];
};

export function FinancePaymentReceiptsTable({ rows }: FinancePaymentReceiptsTableProps) {
  return (
    <SearchableTable
      heading="Payment receipts"
      description="Search by receipt number, client, deal, amount, or payment method."
      searchPlaceholder="Search payment receipts"
      emptyMessage="No payment receipts match your search."
      rows={rows}
      columns={["Receipt", "Client", "Deal", "Amount", "Method"]}
      colSpan={5}
      renderRow={(payment, _index, isLast) => (
        <tr key={payment.id} className={!isLast ? "border-b border-[color:var(--border)]" : ""}>
          <td className="px-4 py-3.5 font-medium">{payment.receiptNumber}</td>
          <td className="px-4 py-3.5 text-[color:var(--muted)]">{payment.client}</td>
          <td className="px-4 py-3.5 text-[color:var(--muted)]">{payment.deal}</td>
          <td className="px-4 py-3.5 text-[color:var(--muted)]">{payment.amount}</td>
          <td className="px-4 py-3.5 text-[color:var(--muted)]">{payment.method}</td>
        </tr>
      )}
    />
  );
}
