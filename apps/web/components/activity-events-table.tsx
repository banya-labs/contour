"use client";

import { PaginatedSearchableTable } from "./paginated-searchable-table";

type ActivityEventRow = {
  id: string;
  eventType: string;
  entityType: string;
  entityId: string;
  actor: string;
  occurredAt: string;
  searchIndex: string;
};

type ActivityEventsTableProps = {
  heading: string;
  description: string;
  searchPlaceholder: string;
  emptyMessage: string;
  rows: ActivityEventRow[];
};

export function ActivityEventsTable({
  heading,
  description,
  searchPlaceholder,
  emptyMessage,
  rows,
}: ActivityEventsTableProps) {
  return (
    <PaginatedSearchableTable
      heading={heading}
      description={description}
      searchPlaceholder={searchPlaceholder}
      emptyMessage={emptyMessage}
      rows={rows}
      columns={[
        { key: "eventType", label: "Event", sortValue: (row) => row.eventType },
        { key: "entityType", label: "Entity", sortValue: (row) => row.entityType },
        { key: "entityId", label: "Record", sortValue: (row) => row.entityId },
        { key: "actor", label: "Actor", sortValue: (row) => row.actor },
        { key: "occurredAt", label: "When", sortValue: (row) => row.occurredAt },
      ]}
      colSpan={5}
      renderRow={(row, _index, isLast) => (
        <tr key={row.id} className={!isLast ? "border-b border-[color:var(--border)]" : ""}>
          <td className="px-4 py-3.5 font-medium">{row.eventType}</td>
          <td className="px-4 py-3.5 text-[color:var(--muted)]">{row.entityType}</td>
          <td className="px-4 py-3.5 text-[color:var(--muted)]">{row.entityId}</td>
          <td className="px-4 py-3.5 text-[color:var(--muted)]">{row.actor}</td>
          <td className="px-4 py-3.5 text-[color:var(--muted)]">{row.occurredAt}</td>
        </tr>
      )}
    />
  );
}
