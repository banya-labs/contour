import "../../lib/load-contour-env";
import Link from "next/link";
import { ArrowLeft, ShieldCheck, Workflow } from "lucide-react";
import { getPrismaClient } from "@contour/db";
import { WorkspaceShell } from "../../components/workspace-shell";

export const dynamic = "force-dynamic";

export default async function ActivityPage() {
  const prisma = getPrismaClient();
  const [events, auditLogs] = await Promise.all([
    prisma.event.findMany({
      orderBy: { occurredAt: "desc" },
      take: 25,
      include: {
        actor: { select: { fullName: true } },
      },
    }),
    prisma.auditLog.findMany({
      orderBy: { occurredAt: "desc" },
      take: 25,
      include: {
        actor: { select: { fullName: true } },
      },
    }),
  ]);

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
        </header>

        <section className="grid gap-4 xl:grid-cols-2">
          <article className="rounded-[28px] border border-[color:var(--border)] bg-[color:var(--surface)] p-5 shadow-[0_16px_40px_rgba(39,26,0,0.05)]">
            <p className="text-[10px] uppercase tracking-[0.28em] text-[color:var(--muted)]">Events</p>
            <div className="mt-4 space-y-3">
              {events.map((event) => (
                <div key={event.id} className="rounded-[18px] border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-[14px] font-medium">{event.eventType}</p>
                      <p className="mt-1 text-[12px] text-[color:var(--muted)]">
                        {event.entityType} · {event.entityId ?? "No entity"}
                      </p>
                    </div>
                    <p className="text-[12px] text-[color:var(--muted)]">{event.actor?.fullName ?? "System"}</p>
                  </div>
                  <p className="mt-2 text-[12px] text-[color:var(--muted)]">{new Date(event.occurredAt).toLocaleString()}</p>
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-[28px] border border-[color:var(--border)] bg-[color:var(--surface)] p-5 shadow-[0_16px_40px_rgba(39,26,0,0.05)]">
            <p className="text-[10px] uppercase tracking-[0.28em] text-[color:var(--muted)]">Audit log</p>
            <div className="mt-4 space-y-3">
              {auditLogs.map((log) => (
                <div key={log.id} className="rounded-[18px] border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-[14px] font-medium">{log.action}</p>
                      <p className="mt-1 text-[12px] text-[color:var(--muted)]">
                        {log.entityType} · {log.entityId ?? "No entity"}
                      </p>
                    </div>
                    <p className="text-[12px] text-[color:var(--muted)]">{log.actor?.fullName ?? "System"}</p>
                  </div>
                  <p className="mt-2 text-[12px] text-[color:var(--muted)]">{new Date(log.occurredAt).toLocaleString()}</p>
                </div>
              ))}
            </div>
          </article>
        </section>
      </div>
    </WorkspaceShell>
  );
}
