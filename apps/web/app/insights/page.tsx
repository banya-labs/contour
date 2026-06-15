import "../../lib/load-contour-env";
import Link from "next/link";
import { ArrowUpRight, Sparkles } from "lucide-react";
import { WorkspaceShell } from "../../components/workspace-shell";
import { InsightsTable } from "../../components/insights-table";
import { buildSearchIndex } from "../../lib/table-search";
import { getCachedInsightsPageData } from "../../lib/route-data";

export const dynamic = "force-dynamic";

export default async function InsightsPage() {
  const { insights, openCount, resolvedCount } = await getCachedInsightsPageData();
  const rows = insights.map((insight) => ({
    id: insight.id,
    title: insight.title,
    severity: insight.severity,
    status: insight.status,
    owner: insight.ownerUser?.fullName ?? "Unassigned",
    recommendedAction: insight.recommendedAction ?? "None",
    due: insight.dueAt ? new Date(insight.dueAt).toLocaleDateString() : "No due date",
    searchIndex: buildSearchIndex(
      insight.title,
      insight.severity,
      insight.status,
      insight.ownerUser?.fullName,
      insight.recommendedAction,
      insight.description,
      insight.dueAt ? new Date(insight.dueAt).toLocaleDateString() : null,
    ),
  }));

  return (
    <WorkspaceShell>
      <header className="rounded-[28px] border border-[color:var(--border)] bg-[color:var(--surface)] p-5 shadow-[0_16px_40px_rgba(39,26,0,0.05)]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[color:rgba(39,26,0,0.12)] bg-[color:rgba(39,26,0,0.04)] px-3 py-1 text-[10px] font-medium uppercase tracking-[0.28em] text-[color:var(--muted)]">
              <Sparkles className="size-3.5" />
              Insights
            </div>
            <h1 className="mt-3 text-[clamp(2rem,2.2vw,3rem)] font-semibold tracking-[-0.04em]">Operational insights</h1>
            <p className="mt-2 max-w-2xl text-[14px] leading-7 text-[color:var(--muted)]">
              Automated signals that should become action: stale listings, follow-up gaps, duplicate checks, and missing documents.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/work-items"
              className="inline-flex h-11 items-center gap-2 rounded-[999px] border border-[color:var(--border)] bg-[color:var(--surface-muted)] px-4 text-[13px] font-medium"
            >
              <ArrowUpRight className="size-4" />
              Work queue
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
            <p className="text-[11px] text-[color:var(--muted)]">Open insights</p>
            <p className="mt-2 text-[18px] font-semibold">{openCount}</p>
          </div>
          <div className="rounded-[18px] border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-4">
            <p className="text-[11px] text-[color:var(--muted)]">Resolved insights</p>
            <p className="mt-2 text-[18px] font-semibold">{resolvedCount}</p>
          </div>
        </div>
      </header>

      <InsightsTable rows={rows} />
    </WorkspaceShell>
  );
}
