"use client";

import type { ReactNode } from "react";
import {
  PaginatedSearchableTable,
  type PaginatedSearchableTableColumn,
  type PaginatedSearchableTableRow,
} from "./paginated-searchable-table";

type SearchableTableProps<T extends PaginatedSearchableTableRow> = {
  heading: string;
  description: string;
  searchPlaceholder: string;
  emptyMessage: string;
  rows: T[];
  colSpan: number;
  columns: PaginatedSearchableTableColumn<T>[];
  renderRow: (row: T, index: number, isLast: boolean) => ReactNode;
};

export function SearchableTable<T extends PaginatedSearchableTableRow>(props: SearchableTableProps<T>) {
  return <PaginatedSearchableTable {...props} />;
}
