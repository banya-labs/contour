"use client";

import { useState } from "react";
import { Check, CircleAlert, Eye, RotateCcw, X } from "lucide-react";
import { PaginatedSearchableTable } from "./paginated-searchable-table";

type InsightRow = {
  id: string;
  title: string;
  severity: string;
  status: string;
  owner: string;
  recommendedAction: string;
  due: string;
  searchIndex: string;
};

type InsightsTableProps = {
  rows: InsightRow[];
};

async function updateInsightStatus(id: string, status: string) {
  const response = await fetch(`/api/insights/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ status }),
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  return response.json() as Promise<{ insight: { id: string; status: string } }>;
}

function toneClass(severity: string) {
  switch (severity) {
    case "critical":
      return "bg-[color:rgba(141,43,31,0.10)] text-[color:var(--danger)]";
    case "warn":
      return "bg-[color:rgba(148,98,29,0.12)] text-[color:var(--warning)]";
    default:
      return "bg-[color:rgba(93,90,132,0.10)] text-[color:var(--info)]";
  }
}

export function InsightsTable({ rows }: InsightsTableProps) {
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
      const payload = await updateInsightStatus(id, status);
      setItems((current) =>
        current.map((item) =>
          item.id === id ? { ...item, status: payload.insight.status } : item,
        ),
      );
    } catch (caughtError) {
      setItems((current) => current.map((item) => (item.id === id ? previous : item)));
      setError(caughtError instanceof Error ? caughtError.message : "Failed to update insight");
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
        heading="Insights"
        description="Search by title, severity, status, owner, action, or due date. Resolve or acknowledge items from here."
        searchPlaceholder="Search insights"
        emptyMessage="No insights match your search."
        rows={items}
        columns={[
          { key: "title", label: "Insight", sortValue: (item) => item.title },
          { key: "severity", label: "Severity", sortValue: (item) => item.severity },
          { key: "status", label: "Status", sortValue: (item) => item.status },
          { key: "owner", label: "Owner", sortValue: (item) => item.owner },
          { key: "due", label: "Due", sortValue: (item) => item.due },
          { key: "actions", label: "Actions", sortValue: (item) => item.title },
        ]}
        colSpan={6}
        renderRow={(insight, _index, isLast) => (
          <tr key={insight.id} className={!isLast ? "border-b border-[color:var(--border)]" : ""}>
            <td className="px-4 py-3.5">
              <div className="font-medium">{insight.title}</div>
              <div className="mt-1 text-[11px] text-[color:var(--muted)]">{insight.recommendedAction}</div>
            </td>
            <td className="px-4 py-3.5">
              <span className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${toneClass(insight.severity)}`}>
                {insight.severity}
              </span>
            </td>
            <td className="px-4 py-3.5 text-[color:var(--muted)]">{insight.status}</td>
            <td className="px-4 py-3.5 text-[color:var(--muted)]">{insight.owner}</td>
            <td className="px-4 py-3.5 text-[color:var(--muted)]">{insight.due}</td>
            <td className="px-4 py-3.5">
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={savingId === insight.id}
                  onClick={() => setStatus(insight.id, "acknowledged")}
                  className="inline-flex items-center gap-1.5 rounded-full border border-[color:var(--border)] bg-[color:var(--surface-muted)] px-3 py-1.5 text-[12px] font-medium disabled:opacity-60"
                >
                  <Eye className="size-3.5" />
                  Acknowledge
                </button>
                <button
                  type="button"
                  disabled={savingId === insight.id}
                  onClick={() => setStatus(insight.id, "resolved")}
                  className="inline-flex items-center gap-1.5 rounded-full border border-[color:var(--border)] bg-[color:var(--surface-muted)] px-3 py-1.5 text-[12px] font-medium disabled:opacity-60"
                >
                  <Check className="size-3.5" />
                  Resolve
                </button>
                <button
                  type="button"
                  disabled={savingId === insight.id}
                  onClick={() => setStatus(insight.id, "dismissed")}
                  className="inline-flex items-center gap-1.5 rounded-full border border-[color:var(--border)] bg-[color:var(--surface-muted)] px-3 py-1.5 text-[12px] font-medium disabled:opacity-60"
                >
                  <X className="size-3.5" />
                  Dismiss
                </button>
                <button
                  type="button"
                  disabled={savingId === insight.id}
                  onClick={() => setStatus(insight.id, "open")}
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
