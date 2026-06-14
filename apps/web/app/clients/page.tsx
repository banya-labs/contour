import "../../lib/load-contour-env";
import Link from "next/link";
import { ArrowUpRight, Users } from "lucide-react";
import { getPrismaClient } from "@contour/db";
import { WorkspaceShell } from "../../components/workspace-shell";
import { ClientsTable } from "../../components/clients-table";
import { buildSearchIndex } from "../../lib/table-search";

export const dynamic = "force-dynamic";

function formatMoney(amount: number | null, currency: string | null) {
  if (amount === null || currency === null) {
    return "Unset";
  }

  return new Intl.NumberFormat("en-ZM", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(Number(amount));
}

export default async function ClientsPage() {
  const prisma = getPrismaClient();
  const [clients, totalClients, activeClients, recentInteractions] = await Promise.all([
    prisma.client.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
      include: {
        preferredLocations: true,
        deals: {
          select: {
            id: true,
          },
        },
      },
    }),
    prisma.client.count(),
    prisma.client.count({ where: { status: "active" } }),
    prisma.interaction.count(),
  ]);
  const rows = clients.map((client) => ({
    id: client.id,
    href: `/clients/${client.id}`,
    fullName: client.fullName,
    contact: client.email ?? client.phone ?? "No contact",
    status: client.status,
    segment: client.segment ?? "Unset",
    budget:
      `${formatMoney(client.budgetMinAmount === null ? null : Number(client.budgetMinAmount), client.budgetCurrency ?? null)} - ${formatMoney(client.budgetMaxAmount === null ? null : Number(client.budgetMaxAmount), client.budgetCurrency ?? null)}`,
    preferredLocation: client.preferredLocations[0]?.locationArea ?? "Unset",
    dealsCount: String(client.deals.length),
    searchIndex: buildSearchIndex(
      client.fullName,
      client.email,
      client.phone,
      client.status,
      client.segment,
      client.budgetMinAmount ?? null,
      client.budgetMaxAmount ?? null,
      client.budgetCurrency,
      client.preferredLocations[0]?.locationArea,
      client.deals.length,
    ),
  }));

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
              Every client, their preferred location, deal count, and budget band in one working view.
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

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <div className="rounded-[18px] border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-4">
            <p className="text-[11px] text-[color:var(--muted)]">Total clients</p>
            <p className="mt-2 text-[18px] font-semibold">{totalClients}</p>
          </div>
          <div className="rounded-[18px] border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-4">
            <p className="text-[11px] text-[color:var(--muted)]">Active clients</p>
            <p className="mt-2 text-[18px] font-semibold">{activeClients}</p>
          </div>
          <div className="rounded-[18px] border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-4">
            <p className="text-[11px] text-[color:var(--muted)]">Interactions logged</p>
            <p className="mt-2 text-[18px] font-semibold">{recentInteractions}</p>
          </div>
        </div>
      </header>

      <ClientsTable rows={rows} />
    </WorkspaceShell>
  );
}
