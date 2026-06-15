"use client";

import { useState } from "react";
import { Ban, Check, CircleDot, Play, RotateCcw } from "lucide-react";
import { PaginatedSearchableTable } from "./paginated-searchable-table";

type WorkItemRow = {
  id: string;
  title: string;
  kind: string;
  tone: string;
  status: string;
  priority: string;
  owner: string;
  due: string;
  insight: string;
  searchIndex: string;
};

type WorkItemsTableProps = {
  rows: WorkItemRow[];
};

async function updateWorkItemStatus(id: string, status: string) {
  const response = await fetch(`/api/work-items/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ status }),
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  return response.json() as Promise<{ workItem: { id: string; status: string } }>;
}

function toneClass(tone: string) {
  switch (tone) {
    case "warning":
      return "bg-[color:rgba(148,98,29,0.12)] text-[color:var(--warning)]";
    case "danger":
      return "bg-[color:rgba(141,43,31,0.10)] text-[color:var(--danger)]";
    case "success":
      return "bg-[color:rgba(47,109,68,0.10)] text-[color:var(--success)]";
    default:
      return "bg-[color:rgba(93,90,132,0.10)] text-[color:var(--info)]";
  }
}

export function WorkItemsTable({ rows }: WorkItemsTableProps) {
  const [items, setItems] = useState(rows);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function setStatus(id: string, status: string) {
    const previous = items.find((item) => item.id === id);
    if (!previous) {
      return;
    }

    setSavingId(id);
    setError(null);
    setItems((current) => current.map((item) => (item.id === id ? { ...item, status } : item)));

    try {
      const payload = await updateWorkItemStatus(id, status);
      setItems((current) =>
        current.map((item) =>
          item.id === id ? { ...item, status: payload.workItem.status } : item,
        ),
      );
    } catch (caughtError) {
      setItems((current) => current.map((item) => (item.id === id ? previous : item)));
      setError(caughtError instanceof Error ? caughtError.message : "Failed to update work item");
    } finally {
      setSavingId(null);
    }
  }

  return (
    <div className="space-y-4">
      {error ? (
        <div className="rounded-[22px] border border-[color:rgba(141,43,31,0.18)] bg-[color:rgba(141,43,31,0.06)] p-4 text-[13px] text-[color:var(--danger)]">
          {error}
        </div>
      ) : null}

      <PaginatedSearchableTable
        heading="Work items"
        description="Search by title, kind, tone, status, owner, priority, or linked insight. Update the task state from the table."
        searchPlaceholder="Search work items"
        emptyMessage="No work items match your search."
        rows={items}
        columns={[
          { key: "title", label: "Work item", sortValue: (item) => item.title },
          { key: "kind", label: "Kind", sortValue: (item) => item.kind },
          { key: "status", label: "Status", sortValue: (item) => item.status },
          { key: "priority", label: "Priority", sortValue: (item) => item.priority },
          { key: "owner", label: "Owner", sortValue: (item) => item.owner },
          { key: "actions", label: "Actions", sortValue: (item) => item.title },
        ]}
        colSpan={6}
        renderRow={(item, _index, isLast) => (
          <tr key={item.id} className={!isLast ? "border-b border-[color:var(--border)]" : ""}>
            <td className="px-4 py-3.5">
              <div className="font-medium">{item.title}</div>
              <div className="mt-1 text-[11px] text-[color:var(--muted)]">{item.insight}</div>
            </td>
            <td className="px-4 py-3.5">
              <span className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${toneClass(item.tone)}`}>
                {item.kind}
              </span>
            </td>
            <td className="px-4 py-3.5 text-[color:var(--muted)]">{item.status}</td>
            <td className="px-4 py-3.5 text-[color:var(--muted)]">{item.priority}</td>
            <td className="px-4 py-3.5 text-[color:var(--muted)]">{item.owner}</td>
            <td className="px-4 py-3.5">
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={savingId === item.id}
                  onClick={() => setStatus(item.id, "in_progress")}
                  className="inline-flex items-center gap-1.5 rounded-full border border-[color:var(--border)] bg-[color:var(--surface-muted)] px-3 py-1.5 text-[12px] font-medium disabled:opacity-60"
                >
                  <Play className="size-3.5" />
                  Start
                </button>
                <button
                  type="button"
                  disabled={savingId === item.id}
                  onClick={() => setStatus(item.id, "done")}
                  className="inline-flex items-center gap-1.5 rounded-full border border-[color:var(--border)] bg-[color:var(--surface-muted)] px-3 py-1.5 text-[12px] font-medium disabled:opacity-60"
                >
                  <Check className="size-3.5" />
                  Done
                </button>
                <button
                  type="button"
                  disabled={savingId === item.id}
                  onClick={() => setStatus(item.id, "blocked")}
                  className="inline-flex items-center gap-1.5 rounded-full border border-[color:var(--border)] bg-[color:var(--surface-muted)] px-3 py-1.5 text-[12px] font-medium disabled:opacity-60"
                >
                  <Ban className="size-3.5" />
                  Block
                </button>
                <button
                  type="button"
                  disabled={savingId === item.id}
                  onClick={() => setStatus(item.id, "open")}
                  className="inline-flex items-center gap-1.5 rounded-full border border-[color:var(--border)] bg-[color:var(--surface-muted)] px-3 py-1.5 text-[12px] font-medium disabled:opacity-60"
                >
                  <RotateCcw className="size-3.5" />
                  Reopen
                </button>
              </div>
            </td>
          </tr>
        )}
      />
    </div>
  );
}
