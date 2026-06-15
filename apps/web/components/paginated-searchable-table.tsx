"use client";

import type { ReactNode } from "react";
import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowDownAZ,
  ArrowUpAZ,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Search,
  X,
} from "lucide-react";

export type PaginatedSearchableTableRow = {
  id: string;
  searchIndex: string;
};

export type TableSortDirection = "asc" | "desc";

export type TableSortValue = string | number | Date | boolean | null | undefined;

export type PaginatedSearchableTableColumn<T> = {
  key: string;
  label: string;
  sortValue: (row: T) => TableSortValue;
};

export type PaginatedSearchableTableProps<T extends PaginatedSearchableTableRow> = {
  heading: string;
  description: string;
  searchPlaceholder: string;
  emptyMessage: string;
  rows: T[];
  colSpan: number;
  columns: PaginatedSearchableTableColumn<T>[];
  pageSize?: number;
  renderRow: (row: T, index: number, isLast: boolean) => ReactNode;
};

export function getPageCount(rowCount: number, pageSize = 10) {
  return Math.max(1, Math.ceil(rowCount / pageSize));
}

export function clampPage(page: number, pageCount: number) {
  return Math.min(Math.max(page, 1), pageCount);
}

export function getPageRows<T>(rows: T[], page: number, pageSize = 10) {
  const safePage = Math.max(page, 1);
  const startIndex = (safePage - 1) * pageSize;
  return rows.slice(startIndex, startIndex + pageSize);
}

export function compareTableValues(
  left: TableSortValue,
  right: TableSortValue,
  direction: TableSortDirection,
) {
  const multiplier = direction === "asc" ? 1 : -1;

  if (left == null && right == null) {
    return 0;
  }
  if (left == null) {
    return 1;
  }
  if (right == null) {
    return -1;
  }

  const leftValue = left instanceof Date ? left.getTime() : typeof left === "boolean" ? Number(left) : left;
  const rightValue = right instanceof Date ? right.getTime() : typeof right === "boolean" ? Number(right) : right;

  if (typeof leftValue === "number" && typeof rightValue === "number") {
    return (leftValue - rightValue) * multiplier;
  }

  return (
    String(leftValue).localeCompare(String(rightValue), undefined, {
      numeric: true,
      sensitivity: "base",
    }) * multiplier
  );
}

export function PaginatedSearchableTable<T extends PaginatedSearchableTableRow>({
  heading,
  description,
  searchPlaceholder,
  emptyMessage,
  rows,
  colSpan,
  columns,
  pageSize = 10,
  renderRow,
}: PaginatedSearchableTableProps<T>) {
  const [query, setQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<TableSortDirection>("asc");
  const [openSortMenuKey, setOpenSortMenuKey] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const deferredQuery = useDeferredValue(query.trim().toLowerCase());

  const filteredRows = deferredQuery ? rows.filter((row) => row.searchIndex.includes(deferredQuery)) : rows;

  const sortedRows = useMemo(() => {
    if (!sortKey) {
      return filteredRows;
    }

    const column = columns.find((item) => item.key === sortKey);
    if (!column) {
      return filteredRows;
    }

    return [...filteredRows].sort((left, right) =>
      compareTableValues(column.sortValue(left), column.sortValue(right), sortDirection),
    );
  }, [columns, filteredRows, sortDirection, sortKey]);

  const pageCount = getPageCount(sortedRows.length, pageSize);
  const safeCurrentPage = clampPage(currentPage, pageCount);
  const pageRows = getPageRows(sortedRows, safeCurrentPage, pageSize);

  useEffect(() => {
    setCurrentPage(1);
  }, [deferredQuery]);

  useEffect(() => {
    setCurrentPage(1);
  }, [sortDirection, sortKey]);

  useEffect(() => {
    setCurrentPage((previousPage) => clampPage(previousPage, pageCount));
  }, [pageCount]);

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      const target = event.target as Node | null;
      if (rootRef.current && target && !rootRef.current.contains(target)) {
        setOpenSortMenuKey(null);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpenSortMenuKey(null);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  return (
    <section
      ref={rootRef}
      className="rounded-[28px] border border-[color:var(--border)] bg-[color:var(--surface)] p-5 shadow-[0_16px_40px_rgba(39,26,0,0.05)]"
    >
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
              {columns.map((column) => {
                const isActive = sortKey === column.key;

                return (
                  <th key={column.key} className="px-4 py-3 font-medium">
                    <div className="flex items-center justify-between gap-2">
                      <span>{column.label}</span>
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() =>
                            setOpenSortMenuKey((current) => (current === column.key ? null : column.key))
                          }
                          className={`inline-flex size-8 items-center justify-center rounded-full border transition-colors ${
                            isActive
                              ? "border-[color:var(--primary)] bg-[color:rgba(39,26,0,0.08)] text-[color:var(--foreground)]"
                              : "border-[color:var(--border)] bg-[color:var(--surface)] text-[color:var(--muted)] hover:text-[color:var(--foreground)]"
                          }`}
                          aria-label={`Sort ${column.label}`}
                          aria-haspopup="menu"
                          aria-expanded={openSortMenuKey === column.key}
                        >
                          {isActive ? (
                            sortDirection === "asc" ? (
                              <ArrowUpAZ className="size-4" />
                            ) : (
                              <ArrowDownAZ className="size-4" />
                            )
                          ) : (
                            <ArrowUpDown className="size-4" />
                          )}
                        </button>

                        {openSortMenuKey === column.key ? (
                          <div className="absolute right-0 top-full z-20 mt-2 w-48 overflow-hidden rounded-[16px] border border-[color:var(--border)] bg-[color:var(--surface)] p-1 shadow-[0_14px_28px_rgba(39,26,0,0.16)]">
                            <button
                              type="button"
                              onClick={() => {
                                setSortKey(column.key);
                                setSortDirection("asc");
                                setOpenSortMenuKey(null);
                              }}
                              className="flex w-full items-center gap-2 rounded-[12px] px-3 py-2 text-left text-[12px] text-[color:var(--foreground)] hover:bg-[color:var(--surface-muted)]"
                            >
                              <ArrowUpAZ className="size-4" />
                              Sort ascending
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setSortKey(column.key);
                                setSortDirection("desc");
                                setOpenSortMenuKey(null);
                              }}
                              className="flex w-full items-center gap-2 rounded-[12px] px-3 py-2 text-left text-[12px] text-[color:var(--foreground)] hover:bg-[color:var(--surface-muted)]"
                            >
                              <ArrowDownAZ className="size-4" />
                              Sort descending
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setSortKey(null);
                                setSortDirection("asc");
                                setOpenSortMenuKey(null);
                              }}
                              className="flex w-full items-center gap-2 rounded-[12px] px-3 py-2 text-left text-[12px] text-[color:var(--muted)] hover:bg-[color:var(--surface-muted)] hover:text-[color:var(--foreground)]"
                            >
                              <ArrowUpDown className="size-4" />
                              Clear sort
                            </button>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {pageRows.length ? (
              pageRows.map((row, index) => renderRow(row, index, index === pageRows.length - 1))
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

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-[12px] text-[color:var(--muted)]">
          Page {safeCurrentPage} of {pageCount}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setCurrentPage((value) => clampPage(value - 1, pageCount))}
            disabled={safeCurrentPage <= 1}
            className="inline-flex h-9 items-center gap-1.5 rounded-[999px] border border-[color:var(--border)] bg-[color:var(--surface-muted)] px-3 text-[12px] font-medium disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ChevronLeft className="size-4" />
            Previous
          </button>
          <div className="flex flex-wrap items-center gap-2">
            {Array.from({ length: pageCount }, (_, index) => index + 1).map((pageNumber) => (
              <button
                key={pageNumber}
                type="button"
                onClick={() => setCurrentPage(pageNumber)}
                className={`inline-flex h-9 min-w-9 items-center justify-center rounded-[999px] border px-3 text-[12px] font-medium transition-colors ${
                  pageNumber === safeCurrentPage
                    ? "border-[color:var(--primary)] bg-[color:rgba(39,26,0,0.08)] text-[color:var(--foreground)]"
                    : "border-[color:var(--border)] bg-[color:var(--surface-muted)] text-[color:var(--muted)] hover:text-[color:var(--foreground)]"
                }`}
              >
                {pageNumber}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setCurrentPage((value) => clampPage(value + 1, pageCount))}
            disabled={safeCurrentPage >= pageCount}
            className="inline-flex h-9 items-center gap-1.5 rounded-[999px] border border-[color:var(--border)] bg-[color:var(--surface-muted)] px-3 text-[12px] font-medium disabled:cursor-not-allowed disabled:opacity-50"
          >
            Next
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>
    </section>
  );
}
