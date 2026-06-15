import "../../lib/load-contour-env";
import Link from "next/link";
import { ArrowUpRight, Workflow } from "lucide-react";
import { WorkspaceShell } from "../../components/workspace-shell";
import { WorkItemsTable } from "../../components/work-items-table";
import { buildSearchIndex } from "../../lib/table-search";
import { getCachedWorkItemsPageData } from "../../lib/route-data";

export const dynamic = "force-dynamic";

export default async function WorkItemsPage() {
  const { workItems, openCount, blockedCount } = await getCachedWorkItemsPageData();
  const rows = workItems.map((item) => ({
    id: item.id,
    title: item.title,
    kind: item.kind.replaceAll("_", " "),
    tone: item.tone,
    status: item.status,
    priority: item.priority ?? "Unset",
    owner: item.ownerUser?.fullName ?? "Unassigned",
    due: item.dueAt ? new Date(item.dueAt).toLocaleDateString() : "No due date",
    insight: item.relatedInsight?.title ?? "No linked insight",
    searchIndex: buildSearchIndex(
      item.title,
      item.kind,
      item.tone,
      item.status,
      item.priority,
      item.ownerUser?.fullName,
      item.relatedInsight?.title,
      item.description,
    ),
  }));

  return (
    <WorkspaceShell>
      <header className="rounded-[28px] border border-[color:var(--border)] bg-[color:var(--surface)] p-5 shadow-[0_16px_40px_rgba(39,26,0,0.05)]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[color:rgba(39,26,0,0.12)] bg-[color:rgba(39,26,0,0.04)] px-3 py-1 text-[10px] font-medium uppercase tracking-[0.28em] text-[color:var(--muted)]">
              <Workflow className="size-3.5" />
              Work queue
            </div>
            <h1 className="mt-3 text-[clamp(2rem,2.2vw,3rem)] font-semibold tracking-[-0.04em]">Open work items</h1>
            <p className="mt-2 max-w-2xl text-[14px] leading-7 text-[color:var(--muted)]">
              Tasks, sync problems, document checks, and other operational work that still needs a human to close the loop.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/insights"
              className="inline-flex h-11 items-center gap-2 rounded-[999px] border border-[color:var(--border)] bg-[color:var(--surface-muted)] px-4 text-[13px] font-medium"
            >
              <ArrowUpRight className="size-4" />
              Insights
            </Link>
            <Link
              href="/activity"
              className="inline-flex h-11 items-center gap-2 rounded-[999px] border border-[color:var(--border)] bg-[color:var(--surface-muted)] px-4 text-[13px] font-medium"
            >
              <ArrowUpRight className="size-4" />
              Activity
            </Link>
            <Link
              href="/"
              className="inline-flex h-11 items-center gap-2 rounded-[999px] border border-[color:var(--border)] bg-[color:var(--surface-muted)] px-4 text-[13px] font-medium"
            >
              <ArrowUpRight className="size-4" />
              Dashboard
            </Link>
          </div>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <div className="rounded-[18px] border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-4">
            <p className="text-[11px] text-[color:var(--muted)]">Open work</p>
            <p className="mt-2 text-[18px] font-semibold">{openCount}</p>
          </div>
          <div className="rounded-[18px] border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-4">
            <p className="text-[11px] text-[color:var(--muted)]">Blocked</p>
            <p className="mt-2 text-[18px] font-semibold">{blockedCount}</p>
          </div>
        </div>
      </header>

      <WorkItemsTable rows={rows} />
    </WorkspaceShell>
  );
}
