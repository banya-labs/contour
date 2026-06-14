"use client";

import type { ReactNode } from "react";
import { useDeferredValue, useState } from "react";
import { Search, X } from "lucide-react";

type SearchableTableRow = {
  id: string;
  searchIndex: string;
};

type SearchableTableProps<T extends SearchableTableRow> = {
  heading: string;
  description: string;
  searchPlaceholder: string;
  emptyMessage: string;
  rows: T[];
  colSpan: number;
  columns: string[];
  renderRow: (row: T, index: number, isLast: boolean) => ReactNode;
};

export function SearchableTable<T extends SearchableTableRow>({
  heading,
  description,
  searchPlaceholder,
  emptyMessage,
  rows,
  colSpan,
  columns,
  renderRow,
}: SearchableTableProps<T>) {
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query.trim().toLowerCase());
  const filteredRows = deferredQuery ? rows.filter((row) => row.searchIndex.includes(deferredQuery)) : rows;

  return (
    <section className="rounded-[28px] border border-[color:var(--border)] bg-[color:var(--surface)] p-5 shadow-[0_16px_40px_rgba(39,26,0,0.05)]">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.28em] text-[color:var(--muted)]">{heading}</p>
          <p className="mt-2 max-w-2xl text-[14px] leading-7 text-[color:var(--muted)]">{description}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <label className="relative min-w-[280px] flex-1">
            <span className="sr-only">{searchPlaceholder}</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[color:var(--muted)]" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={searchPlaceholder}
              className="h-11 w-full rounded-[999px] border border-[color:var(--border)] bg-[color:var(--surface-muted)] pl-10 pr-10 text-[13px] outline-none transition focus:border-[color:var(--primary)]"
            />
            {query ? (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="absolute right-2 top-1/2 inline-flex size-7 -translate-y-1/2 items-center justify-center rounded-full text-[color:var(--muted)] transition-colors hover:bg-[color:rgba(39,26,0,0.08)] hover:text-[color:var(--foreground)]"
                aria-label="Clear search"
              >
                <X className="size-4" />
              </button>
            ) : null}
          </label>
          <p className="rounded-full border border-[color:var(--border)] bg-[color:var(--surface-muted)] px-3 py-2 text-[12px] text-[color:var(--muted)]">
            {filteredRows.length} of {rows.length}
          </p>
        </div>
      </div>

      <div className="mt-4 overflow-hidden rounded-[22px] border border-[color:var(--border)]">
        <table className="min-w-full border-collapse text-left text-[13px]">
          <thead className="bg-[color:var(--surface-muted)] text-[color:var(--muted)]">
            <tr>
              {columns.map((column) => (
                <th key={column} className="px-4 py-3 font-medium">
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredRows.length ? (
              filteredRows.map((row, index) => renderRow(row, index, index === filteredRows.length - 1))
            ) : (
              <tr>
                <td className="px-4 py-8 text-center text-[13px] text-[color:var(--muted)]" colSpan={colSpan}>
                  {emptyMessage}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
