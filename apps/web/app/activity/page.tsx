import "../../lib/load-contour-env";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight, ShieldCheck, Workflow } from "lucide-react";
import { WorkspaceShell } from "../../components/workspace-shell";
import { ActivityEventsTable } from "../../components/activity-events-table";
import { buildSearchIndex } from "../../lib/table-search";
import { getCachedActivityPageData } from "../../lib/route-data";

export const dynamic = "force-dynamic";

export default async function ActivityPage() {
  const { events, auditLogs } = await getCachedActivityPageData();

  const eventRows = events.map((event) => ({
    id: event.id,
    eventType: event.eventType,
    entityType: event.entityType,
    entityId: event.entityId ?? "No entity",
    actor: event.actor?.fullName ?? "System",
    occurredAt: new Date(event.occurredAt).toLocaleString(),
    searchIndex: buildSearchIndex(
      event.eventType,
      event.entityType,
      event.entityId,
      event.actor?.fullName,
      new Date(event.occurredAt).toLocaleString(),
    ),
  }));

  const auditRows = auditLogs.map((log) => ({
    id: log.id,
    eventType: log.action,
    entityType: log.entityType,
    entityId: log.entityId ?? "No entity",
    actor: log.actor?.fullName ?? "System",
    occurredAt: new Date(log.occurredAt).toLocaleString(),
    searchIndex: buildSearchIndex(
      log.action,
      log.entityType,
      log.entityId,
      log.actor?.fullName,
      new Date(log.occurredAt).toLocaleString(),
    ),
  }));

  return (
    <WorkspaceShell>
      <div className="space-y-4">
        <Link
          href="/"
          className="inline-flex h-10 items-center gap-2 rounded-[999px] border border-[color:var(--border)] bg-[color:var(--surface)] px-4 text-[13px] font-medium"
        >
          <ArrowLeft className="size-4" />
          Back to dashboard
        </Link>

        <header className="rounded-[28px] border border-[color:var(--border)] bg-[color:var(--surface)] p-5 shadow-[0_16px_40px_rgba(39,26,0,0.05)]">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-[color:rgba(39,26,0,0.12)] bg-[color:rgba(39,26,0,0.04)] px-3 py-1 text-[10px] font-medium uppercase tracking-[0.28em] text-[color:var(--muted)]">
                <Workflow className="size-3.5" />
                Activity
              </div>
              <h1 className="mt-3 text-[clamp(2rem,2.2vw,3rem)] font-semibold tracking-[-0.04em]">Events and audit log</h1>
              <p className="mt-2 max-w-2xl text-[14px] leading-7 text-[color:var(--muted)]">
                Recent system activity, change history, and compliance-related actions.
              </p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[color:var(--border)] bg-[color:var(--surface-muted)] px-3 py-2 text-[12px] text-[color:var(--muted)]">
              <ShieldCheck className="size-4 text-[color:var(--success)]" />
              Review trail
            </div>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Link
              href="/insights"
              className="inline-flex h-11 items-center gap-2 rounded-[999px] border border-[color:var(--border)] bg-[color:var(--surface-muted)] px-4 text-[13px] font-medium"
            >
              <ArrowUpRight className="size-4" />
              Insights
            </Link>
            <Link
              href="/work-items"
              className="inline-flex h-11 items-center gap-2 rounded-[999px] border border-[color:var(--border)] bg-[color:var(--surface-muted)] px-4 text-[13px] font-medium"
            >
              <ArrowUpRight className="size-4" />
              Work queue
            </Link>
          </div>
        </header>

        <section className="grid gap-4 xl:grid-cols-2">
          <ActivityEventsTable
            heading="Events"
            description="Search system events by type, entity, actor, or time."
            searchPlaceholder="Search events"
            emptyMessage="No events match your search."
            rows={eventRows}
          />

          <ActivityEventsTable
            heading="Audit log"
            description="Search audit entries by action, entity, actor, or time."
            searchPlaceholder="Search audit log"
            emptyMessage="No audit rows match your search."
            rows={auditRows}
          />
        </section>
      </div>
    </WorkspaceShell>
  );
}
