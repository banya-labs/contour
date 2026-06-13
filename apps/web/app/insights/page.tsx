import "../../lib/load-contour-env";
import Link from "next/link";
import { ArrowUpRight, Sparkles } from "lucide-react";
import { getPrismaClient } from "@contour/db";
import { WorkspaceShell } from "../../components/workspace-shell";

export const dynamic = "force-dynamic";

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

export default async function InsightsPage() {
  const prisma = getPrismaClient();
  const [insights, openCount, resolvedCount] = await Promise.all([
    prisma.insight.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
      include: {
        ownerUser: { select: { fullName: true } },
      },
    }),
    prisma.insight.count({ where: { status: "open" } }),
    prisma.insight.count({ where: { status: "resolved" } }),
  ]);

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
          <Link
            href="/"
            className="inline-flex h-11 items-center gap-2 rounded-[999px] border border-[color:var(--border)] bg-[color:var(--surface-muted)] px-4 text-[13px] font-medium"
          >
            <ArrowUpRight className="size-4" />
            Dashboard
          </Link>
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

      <section className="space-y-3">
        {insights.map((insight) => (
          <article
            key={insight.id}
            className="rounded-[22px] border border-[color:var(--border)] bg-[color:var(--surface)] p-5 shadow-[0_12px_30px_rgba(39,26,0,0.04)]"
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-medium ${toneClass(insight.severity)}`}>
                  {insight.severity}
                </div>
                <h2 className="mt-3 text-[16px] font-semibold">{insight.title}</h2>
                <p className="mt-1 text-[13px] text-[color:var(--muted)]">{insight.description ?? "No description"}</p>
              </div>
              <div className="text-right text-[12px] text-[color:var(--muted)]">
                <p>{insight.status}</p>
                <p className="mt-1">{insight.ownerUser?.fullName ?? "Unassigned"}</p>
              </div>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <div className="rounded-[18px] border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-4">
                <p className="text-[11px] text-[color:var(--muted)]">Recommended action</p>
                <p className="mt-2 text-[14px] font-medium">{insight.recommendedAction ?? "None"}</p>
              </div>
              <div className="rounded-[18px] border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-4">
                <p className="text-[11px] text-[color:var(--muted)]">Due</p>
                <p className="mt-2 text-[14px] font-medium">{insight.dueAt ? new Date(insight.dueAt).toLocaleDateString() : "No due date"}</p>
              </div>
            </div>
          </article>
        ))}
      </section>
    </WorkspaceShell>
  );
}
