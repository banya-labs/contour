import "../../lib/load-contour-env";
import Link from "next/link";
import { ArrowUpRight, Plus, Users } from "lucide-react";
import { WorkspaceShell } from "../../components/workspace-shell";
import { ClientsTable } from "../../components/clients-table";
import { buildSearchIndex } from "../../lib/table-search";
import { getCachedClientsPageData } from "../../lib/route-data";
import { createRouteTimer } from "../../lib/performance";

export const dynamic = "force-dynamic";

type ClientPageRow = {
  id: string;
  href: string;
  fullName: string;
  contact: string;
  status: string;
  source: string;
  dealsCount: string;
  dealsCountNumber: number;
  searchIndex: string;
};

export default async function ClientsPage() {
  const timer = createRouteTimer("clients page");
  const { clients, totalClients, activeClients } = await timer.measure(
    "query",
    () => getCachedClientsPageData(),
    { note: "clients list" },
  );
  const rows: ClientPageRow[] = clients.map((client) => ({
    id: client.id,
    href: `/clients/${client.id}`,
    fullName: client.fullName,
    contact: client.email ?? client.phone ?? "No contact",
    status: client.status,
    source: client.source ?? "Unset",
    dealsCount: String(client._count.deals),
    dealsCountNumber: client._count.deals,
    searchIndex: buildSearchIndex(
      client.fullName,
      client.email,
      client.phone,
      client.status,
      client.source,
      client._count.deals,
    ),
  }));
  timer.finish({ count: rows.length, note: `rows:${rows.length}` });

  return (
    <WorkspaceShell>
      <header className="rounded-[28px] border border-[color:var(--border)] bg-[color:var(--surface)] p-5 shadow-[0_16px_40px_rgba(39,26,0,0.05)]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[color:rgba(39,26,0,0.12)] bg-[color:rgba(39,26,0,0.04)] px-3 py-1 text-[10px] font-medium uppercase tracking-[0.28em] text-[color:var(--muted)]">
              <Users className="size-3.5" />
              Clients
            </div>
            <h1 className="mt-3 text-[clamp(2rem,2.2vw,3rem)] font-semibold tracking-[-0.04em]">Client registry</h1>
            <p className="mt-2 max-w-2xl text-[14px] leading-7 text-[color:var(--muted)]">
              Every client and their linked deals in one working view.
            </p>
          </div>
          <Link
            href="/clients/new"
            className="inline-flex h-11 items-center gap-2 rounded-[999px] bg-[color:var(--primary)] px-4 text-[13px] font-medium text-[color:var(--primary-foreground)] transition-transform duration-150 hover:-translate-y-0.5"
          >
            <Plus className="size-4" />
            New client
          </Link>
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
            <p className="text-[11px] text-[color:var(--muted)]">Total clients</p>
            <p className="mt-2 text-[18px] font-semibold">{totalClients}</p>
          </div>
          <div className="rounded-[18px] border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-4">
            <p className="text-[11px] text-[color:var(--muted)]">Active clients</p>
            <p className="mt-2 text-[18px] font-semibold">{activeClients}</p>
          </div>

        </div>
      </header>

      <ClientsTable rows={rows} />
    </WorkspaceShell>
  );
}
